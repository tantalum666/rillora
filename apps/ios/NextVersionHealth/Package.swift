// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "RilloraHeartRateKit",
    defaultLocalization: "en",
    platforms: [.iOS("17.4"), .macOS(.v14)],
    products: [.library(name: "RilloraHeartRateKit", targets: ["RilloraHeartRateKit"])],
    targets: [
        .target(name: "RilloraHeartRateKit", resources: [.process("Resources")]),
        .testTarget(name: "RilloraHeartRateKitTests", dependencies: ["RilloraHeartRateKit"])
    ]
)
