import Foundation

enum ContentBinary {
    static func mediaType(_ bytes: Data) throws -> String {
        guard !bytes.isEmpty, bytes.count <= ContentLimits.fileBytes else { throw ContentError.tooLarge }
        let b = [UInt8](bytes.prefix(12))
        if bytes.starts(with: Data("%PDF-".utf8)) { return "application/pdf" }
        if b.starts(with: [137, 80, 78, 71, 13, 10, 26, 10]) { return "image/png" }
        if b.starts(with: [255, 216, 255]) { return "image/jpeg" }
        if b.count >= 12, String(bytes: b[0..<4], encoding: .ascii) == "RIFF" {
            if String(bytes: b[8..<12], encoding: .ascii) == "WEBP" { return "image/webp" }
            if String(bytes: b[8..<12], encoding: .ascii) == "WAVE" {
                _ = try PCMRecording.samples(from: bytes)
                return "audio/wav"
            }
        }
        throw ContentError.unsupportedFile
    }
    static func upload(_ bytes: Data, requestKey: String, kind: ContentKind, metadata: ContentMetadata) throws -> Data {
        try ContentValidation.id(requestKey); try ContentValidation.metadata(metadata)
        let mime = try mediaType(bytes)
        guard (kind == .voice) == (mime == "audio/wav") else { throw ContentError.unsupportedFile }
        struct Header: Encodable { let requestKey: String; let kind: ContentKind; let mediaType: String; let metadata: ContentMetadata }
        let header = try JSONEncoder().encode(Header(requestKey: requestKey, kind: kind, mediaType: mime, metadata: metadata))
        guard header.count <= ContentLimits.uploadMetadataBytes else { throw ContentError.tooLarge }
        var length = UInt32(header.count).bigEndian
        var result = withUnsafeBytes(of: &length) { Data($0) }
        result.append(header); result.append(bytes)
        return result
    }
}

/// Exact shared Web/API format, independent of AVAudioRecorder's extra RIFF chunks.
enum PCMRecording {
    static let maximumSamples = ContentLimits.voiceSeconds * 16000
    static func wave(samples: [Int16]) throws -> Data {
        guard !samples.isEmpty, samples.count <= maximumSamples else { throw ContentError.tooLarge }
        var data = Data()
        func word<T: FixedWidthInteger>(_ value: T) {
            var little = value.littleEndian
            withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
        }
        data.append(Data("RIFF".utf8)); word(UInt32(36 + samples.count * 2)); data.append(Data("WAVEfmt ".utf8))
        word(UInt32(16)); word(UInt16(1)); word(UInt16(1)); word(UInt32(16000)); word(UInt32(32000))
        word(UInt16(2)); word(UInt16(16)); data.append(Data("data".utf8)); word(UInt32(samples.count * 2))
        for sample in samples { word(sample) }
        return data
    }
    static func samples(from data: Data, allowRecorderChunks: Bool = false) throws -> [Int16] {
        guard data.count >= 46, data.count <= maximumSamples * 2 + 4096 else { throw ContentError.unsupportedFile }
        let b = [UInt8](data)
        func u16(_ i: Int) -> UInt16 { UInt16(b[i]) | UInt16(b[i+1]) << 8 }
        func u32(_ i: Int) -> UInt32 { UInt32(b[i]) | UInt32(b[i+1]) << 8 | UInt32(b[i+2]) << 16 | UInt32(b[i+3]) << 24 }
        func label(_ i: Int) -> String { String(bytes: b[i..<i+4], encoding: .ascii) ?? "" }
        guard label(0) == "RIFF", label(8) == "WAVE", Int(u32(4)) == b.count - 8 else { throw ContentError.unsupportedFile }
        var cursor = 12, format = false, pcm: [Int16]?
        while cursor + 8 <= b.count {
            let size = Int(u32(cursor + 4)), start = cursor + 8
            guard size <= b.count - start else { throw ContentError.unsupportedFile }
            switch label(cursor) {
            case "fmt ":
                guard !format, size >= 16, u16(start) == 1, u16(start+2) == 1, u32(start+4) == 16000,
                      u32(start+8) == 32000, u16(start+12) == 2, u16(start+14) == 16 else { throw ContentError.unsupportedFile }
                format = true
            case "data":
                guard pcm == nil, size > 0, size % 2 == 0, size / 2 <= maximumSamples else { throw ContentError.unsupportedFile }
                pcm = stride(from: start, to: start + size, by: 2).map { Int16(bitPattern: u16($0)) }
            default:
                guard allowRecorderChunks else { throw ContentError.unsupportedFile }
            }
            cursor = start + size + (size % 2)
        }
        guard format, let pcm, cursor == b.count else { throw ContentError.unsupportedFile }
        if !allowRecorderChunks { guard try wave(samples: pcm) == data else { throw ContentError.unsupportedFile } }
        return pcm
    }
}
