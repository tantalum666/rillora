import Foundation
import CoreImage
let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1])
guard let image = CIImage(contentsOf: input),
      let detector = CIDetector(ofType: CIDetectorTypeQRCode, context: CIContext(), options: [CIDetectorAccuracy: CIDetectorAccuracyHigh]),
      let feature = detector.features(in: image).compactMap({ $0 as? CIQRCodeFeature }).first,
      let value = feature.messageString,
      let url = URLComponents(string: value), url.host == "127.0.0.1",
      let fragment = url.fragment, fragment.hasPrefix("invitation="), fragment.count == 54 else {
    fatalError("No valid bounded synthetic invitation QR found")
}
try JSONSerialization.data(withJSONObject: ["url":value,"decoded":true]).write(to: URL(fileURLWithPath: args[2]))
print("Decoded synthetic QR; bounded invitation fragment, no private matter fields.")
