// swift-tools-version: 6.0
import PackageDescription

let package = Package(name: "RilloraCheckInKit", defaultLocalization: "en",
    platforms: [.iOS("17.4"), .watchOS("10.4"), .macOS(.v14)],
    products: [.library(name: "RilloraCheckInKit", targets: ["RilloraCheckInKit"])],
    targets: [
        .target(name: "RilloraCheckInKit", resources: [.process("Resources")]),
        .testTarget(name: "RilloraCheckInKitTests", dependencies: ["RilloraCheckInKit"])
    ])
