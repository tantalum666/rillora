import Foundation
import AVFoundation
import AppKit
let file = CommandLine.arguments[1]
let output = CommandLine.arguments[2]
let asset = AVURLAsset(url: URL(fileURLWithPath: file))
let duration = try await asset.load(.duration)
let tracks = try await asset.loadTracks(withMediaType: .video)
guard let track = tracks.first else { fatalError("Missing video track") }
let size = try await track.load(.naturalSize)
let fps = try await track.load(.nominalFrameRate)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
let frame = try await generator.image(at: CMTime(seconds: min(3, duration.seconds / 2), preferredTimescale: 600))
let bitmap = NSBitmapImageRep(cgImage: frame.image)
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: output))
let json: [String: Any] = ["duration":duration.seconds,"width":size.width,"height":size.height,"fps":fps,"decodedFrame":true]
print(String(data:try JSONSerialization.data(withJSONObject: json, options:.sortedKeys),encoding:.utf8)!)
