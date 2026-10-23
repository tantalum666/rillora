// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "RilloraContentKit",
    defaultLocalization: "en",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "RilloraContentKit", targets: ["RilloraContentKit"])],
    targets: [
        .target(name: "RilloraContentKit", resources: [.process("Resources")]),
        .testTarget(name: "RilloraContentKitTests", dependencies: ["RilloraContentKit"])
    ]
)
