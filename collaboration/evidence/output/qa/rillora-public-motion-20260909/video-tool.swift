import Foundation
import AVFoundation

@main struct VideoTool {
    static func main() async throws {
        let args = CommandLine.arguments
        let input = URL(fileURLWithPath: args[1])
        let asset = AVURLAsset(url: input)
        let duration = try await asset.load(.duration)
        let creationItem = try await asset.load(.creationDate)
        let creation = try await creationItem?.load(.dateValue)
        print("duration_seconds=\(duration.seconds)")
        if let creation { print("creation_epoch=\(creation.timeIntervalSince1970)") }
        if args.count == 5 {
            guard let start = Double(args[2]), let seconds = Double(args[3]),
                  let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetHighestQuality) else {
                fatalError("Invalid video export arguments")
            }
            exporter.timeRange = CMTimeRange(start: CMTime(seconds: start, preferredTimescale: 600), duration: CMTime(seconds: seconds, preferredTimescale: 600))
            exporter.shouldOptimizeForNetworkUse = true
            try await exporter.export(to: URL(fileURLWithPath: args[4]), as: .mp4)
            print("exported=\(args[4])")
        }
    }
}
