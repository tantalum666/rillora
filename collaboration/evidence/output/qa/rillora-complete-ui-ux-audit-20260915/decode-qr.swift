import Foundation
import Vision
import AppKit
let url = URL(fileURLWithPath:CommandLine.arguments[1])
let request = VNDetectBarcodesRequest()
try VNImageRequestHandler(url:url).perform([request])
let values = request.results?.compactMap(\.payloadStringValue) ?? []
print(String(data:try JSONEncoder().encode(values),encoding:.utf8)!)
