import Foundation
import AVFoundation
import AppKit

let asset = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
var actual = CMTime.zero
let requested = CMTime(seconds: Double(CommandLine.arguments[2])!, preferredTimescale: 600)
let frame = try generator.copyCGImage(at: requested, actualTime: &actual)
let image = NSBitmapImageRep(cgImage: frame)
try image.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[3]))
print("Captured original video frame at \(CMTimeGetSeconds(actual)) seconds")
