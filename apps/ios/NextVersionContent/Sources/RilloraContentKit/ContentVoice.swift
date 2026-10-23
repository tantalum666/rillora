#if os(iOS)
import AVFoundation
import Speech
import Observation

@MainActor @Observable
final class ContentVoice: NSObject, AVAudioRecorderDelegate, AVAudioPlayerDelegate {
    enum Phase: Equatable { case idle, permission, recording, ready, failed }
    private(set) var phase: Phase = .idle
    private(set) var bytes: Data?
    private(set) var seconds = 0
    private(set) var playing = false
    private(set) var transcribing = false
    private(set) var transcriptDraft: String?
    var message: String?
    @ObservationIgnored private var recorder: AVAudioRecorder?
    @ObservationIgnored private var player: AVAudioPlayer?
    @ObservationIgnored private let files = ContentTemporaryFiles()
    @ObservationIgnored private var timer: Task<Void, Never>?
    @ObservationIgnored private var speechTimer: Task<Void, Never>?
    @ObservationIgnored private var speechTask: SFSpeechRecognitionTask?
    @ObservationIgnored private var recognizer: SFSpeechRecognizer?
    @ObservationIgnored private let permission: @MainActor () async -> Bool
    private var generation = 0

    init(permission: @escaping @MainActor () async -> Bool = { await AVAudioApplication.requestRecordPermission() }) {
        self.permission = permission
        super.init()
    }

    func start() async {
        guard phase != .recording, phase != .permission else { return }
        clear(); phase = .permission; let epoch = generation
        let granted = await permission()
        guard epoch == generation, !Task.isCancelled else { return }
        guard granted else { phase = .failed; message = ContentText.get("microphoneDenied"); return }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try session.setActive(true)
            let url = try files.create("capture.wav")
            let recording = try AVAudioRecorder(url: url, settings: [AVFormatIDKey: kAudioFormatLinearPCM,
                AVSampleRateKey: 16000, AVNumberOfChannelsKey: 1, AVLinearPCMBitDepthKey: 16,
                AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false])
            recording.delegate = self
            recorder = recording
            guard recording.prepareToRecord(), recording.record(forDuration: TimeInterval(ContentLimits.voiceSeconds)) else { throw ContentError.microphone }
            try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: url.path)
            phase = .recording
            timer = Task { [weak self] in
                while !Task.isCancelled {
                    try? await Task.sleep(for: .milliseconds(250))
                    guard let self, !Task.isCancelled, phase == .recording else { return }
                    seconds = min(ContentLimits.voiceSeconds, Int(recorder?.currentTime ?? 0))
                }
            }
        } catch { finishFailure(error) }
    }
    func finish() {
        guard phase == .recording, let recorder else { return }
        timer?.cancel(); timer = nil; recorder.stop()
        do {
            let values = try recorder.url.resourceValues(forKeys: [.fileSizeKey])
            guard (values.fileSize ?? Int.max) <= PCMRecording.maximumSamples * 2 + 4096 else { throw ContentError.tooLarge }
            let raw = try Data(contentsOf: recorder.url)
            bytes = try PCMRecording.wave(samples: PCMRecording.samples(from: raw, allowRecorderChunks: true))
            phase = .ready; seconds = (bytes!.count - 44) / 32000
        } catch { bytes = nil; phase = .failed; message = ContentText.error(error) }
        self.recorder = nil; files.remove()
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        let source = recorder.url
        Task { @MainActor [weak self] in
            guard let self, phase == .recording, self.recorder?.url == source else { return }
            if flag { finish() } else { finishFailure(ContentError.microphone) }
        }
    }
    nonisolated func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        let source = recorder.url
        Task { @MainActor [weak self] in
            guard let self, self.recorder?.url == source else { return }
            self.finishFailure(ContentError.microphone)
        }
    }
    func play(_ data: Data? = nil) {
        stopPlayback()
        guard let data = data ?? bytes else { return }
        do {
            _ = try PCMRecording.samples(from: data)
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback); try session.setActive(true)
            player = try AVAudioPlayer(data: data)
            player?.delegate = self
            playing = player?.play() == true
        } catch { message = ContentText.error(error) }
    }
    func stopPlayback() {
        let hadPlayer = player != nil
        player?.delegate = nil; player?.stop(); player = nil; playing = false
        if hadPlayer { try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation]) }
    }
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        let source = ObjectIdentifier(player)
        Task { @MainActor [weak self] in
            guard let self, self.player.map(ObjectIdentifier.init) == source else { return }
            self.stopPlayback()
        }
    }
    func transcribe(_ recording: Data? = nil, language: String) async {
        guard !transcribing, let bytes = recording ?? bytes else { return }
        stopPlayback(); message = nil; transcriptDraft = nil
        do { _ = try PCMRecording.samples(from: bytes) }
        catch { message = ContentText.error(error); return }
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: language)), recognizer.supportsOnDeviceRecognition else {
            message = ContentText.get("speechUnavailable"); return
        }
        transcribing = true; let epoch = generation
        let status = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0) }
        }
        guard epoch == generation, !Task.isCancelled else { return }
        guard status == .authorized, recognizer.isAvailable else { cancelSpeech(); message = ContentText.get("speechUnavailable"); return }
        do {
            let url = try files.create("transcribe.wav", bytes: bytes)
            let request = SFSpeechURLRecognitionRequest(url: url)
            request.requiresOnDeviceRecognition = true
            request.shouldReportPartialResults = false
            self.recognizer = recognizer
            speechTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
                let text = result?.bestTranscription.formattedString
                let final = result?.isFinal == true, failed = error != nil
                Task { @MainActor in
                    guard let self, epoch == self.generation, self.transcribing else { return }
                    if final, let text { self.transcriptDraft = String(text.prefix(12000)); self.cancelSpeech() }
                    else if failed { self.cancelSpeech(); self.message = ContentText.get("speechUnavailable") }
                }
            }
            speechTimer = Task { [weak self] in
                try? await Task.sleep(for: .seconds(60))
                guard !Task.isCancelled, let self, epoch == generation, transcribing else { return }
                cancelSpeech(); message = ContentText.get("speechUnavailable")
            }
        } catch { cancelSpeech(); message = ContentText.error(error) }
    }
    func cancelSpeech() {
        generation += 1
        speechTask?.cancel(); speechTask = nil; recognizer = nil
        speechTimer?.cancel(); speechTimer = nil; transcribing = false; files.remove()
    }
    func discardTranscriptDraft() {
        cancelSpeech()
        transcriptDraft = nil
    }
    func interrupted() {
        if phase == .recording { finish(); message = ContentText.get("recordingInterrupted") }
        else if phase == .permission { clear() }
        stopPlayback(); cancelSpeech()
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }
    func clear() {
        generation += 1; timer?.cancel(); timer = nil
        recorder?.delegate = nil; recorder?.stop(); recorder = nil
        stopPlayback(); cancelSpeech(); files.remove()
        bytes = nil; transcriptDraft = nil; seconds = 0; phase = .idle; message = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }
    private func finishFailure(_ error: Error) { clear(); phase = .failed; message = ContentText.error(error) }
}
#endif
