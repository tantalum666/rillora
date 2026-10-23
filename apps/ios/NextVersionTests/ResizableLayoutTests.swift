import SwiftUI
import UIKit
import XCTest
@testable import Rillora

/// Generic view/window stress checks on the installed SDK, not Duo pose tests.
@MainActor
final class ResizableLayoutTests: XCTestCase {
    func testColumnsRespectAvailableSpaceAndKeepChildState() async throws {
        let probe = LayoutProbe()
        let host = try LayoutHost { ProbeHarness(probe: probe) }
        defer { host.close() }
        host.resize(width: 360, height: 780)
        try await settle { probe.frames.count == 2 }
        let original = probe.identities
        XCTAssertGreaterThan(probe.frames["people"]!.minY, probe.frames["map"]!.maxY)

        host.resize(width: 1000, height: 700)
        try await settle { abs(probe.frames["map"]!.minY - probe.frames["people"]!.minY) < 1 }
        XCTAssertGreaterThan(probe.frames["people"]!.minX, probe.frames["map"]!.maxX)
        XCTAssertEqual(probe.identities, original)
        XCTAssertEqual(probe.appearances, ["map": 1, "people": 1])

        // Safe areas can be asymmetric. They must reduce the actual layout space.
        host.resize(width: 900, height: 700, insets: UIEdgeInsets(top: 0, left: 180, bottom: 0, right: 140))
        try await settle { probe.frames["people"]!.minY > probe.frames["map"]!.maxY }
        XCTAssertGreaterThanOrEqual(probe.frames["map"]!.minX, 180)
        XCTAssertLessThanOrEqual(probe.frames["map"]!.maxX, 760)

        host.resize(width: 1000, height: 700)
        try await settle { abs(probe.frames["map"]!.minY - probe.frames["people"]!.minY) < 1 }
        probe.typeSize = .accessibility5
        try await settle { probe.frames["people"]!.minY > probe.frames["map"]!.maxY }
        XCTAssertEqual(probe.identities, original)
        XCTAssertEqual(probe.appearances, ["map": 1, "people": 1])
        host.resize(width: 360, height: 780)
        try await settle { probe.frames["map"]!.width < 361 }
        XCTAssertEqual(probe.identities, original)
    }

    func testWholeBrandFitsNarrowToolbar() throws {
        for width: CGFloat in [42, 76, 200] {
            let renderer = ImageRenderer(content: RilloraBrand())
            renderer.scale = 3
            renderer.proposedSize = ProposedViewSize(width: width, height: 28)
            let image = try XCTUnwrap(renderer.uiImage)
            XCTAssertLessThanOrEqual(image.size.width, width + 0.5)
            XCTAssertLessThanOrEqual(image.size.height, 28.5)
            // The toolbar frame includes transparent letterboxing, not just the mark.
            let attachment = XCTAttachment(image: image)
            attachment.name = "brand-width-\(Int(width))"
            attachment.lifetime = .keepAlways
            add(attachment)
        }
    }

    func testOverviewAndPublicPageAtGenericWindowSizes() async throws {
        let host = try LayoutHost {
            OverviewContent(snapshot: .preview, onReviewMatters: {}, onOpenMatter: { _ in },
                onOpenProfile: {}, onAddFirstMatter: {}, onOpenFirstUseGuide: {}, onPauseFirstUse: {})
        }
        defer { host.close() }
        for (name, width, height) in [("narrow", 360.0, 780.0), ("wide", 1000.0, 760.0), ("short", 800.0, 380.0)] {
            host.resize(width: width, height: height)
            try await Task.sleep(for: .milliseconds(250))
            XCTAssertEqual(host.controller.view.bounds.width, width, accuracy: 1)
            capture(host.controller.view, name: "generic-overview-" + name)
        }
        host.close()
        let publicHost = try LayoutHost {
            SignedOutOverviewView(onStartPrivatePlan: {}, onExploreMatters: {})
        }
        defer { publicHost.close() }
        publicHost.resize(width: 1000, height: 1000)
        try await Task.sleep(for: .milliseconds(250))
        capture(publicHost.controller.view, name: "generic-public-wide")
    }

    private func settle(_ condition: () -> Bool) async throws {
        for _ in 0..<40 {
            if condition() { return }
            try await Task.sleep(for: .milliseconds(50))
        }
        XCTFail("Layout did not reach the expected state")
    }

    private func capture(_ view: UIView, name: String) {
        let image = UIGraphicsImageRenderer(size: view.bounds.size).image { _ in
            view.drawHierarchy(in: view.bounds, afterScreenUpdates: true)
        }
        let attachment = XCTAttachment(image: image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}

@MainActor @Observable private final class LayoutProbe {
    var typeSize: DynamicTypeSize = .large
    var frames: [String: CGRect] = [:]
    var identities: [String: UUID] = [:]
    var appearances: [String: Int] = [:]
}

private struct ProbeHarness: View {
    let probe: LayoutProbe
    var body: some View {
        RilloraAdaptivePair {
            IdentityCell(name: "map", probe: probe)
        } second: {
            IdentityCell(name: "people", probe: probe)
        }
        .padding(20)
        .frame(maxHeight: .infinity, alignment: .top)
        .dynamicTypeSize(probe.typeSize)
    }
}

private struct IdentityCell: View {
    let name: String
    let probe: LayoutProbe
    @State private var identity = UUID()
    var body: some View {
        Text(name).frame(maxWidth: .infinity, minHeight: 80)
            .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: {
                probe.frames[name] = $0
                probe.identities[name] = identity
            }
            .onAppear { probe.appearances[name, default: 0] += 1 }
    }
}

@MainActor private final class LayoutHost<Content: View> {
    let controller: UIHostingController<Content>
    private let window: UIWindow
    private weak var originalWindow: UIWindow?
    init(@ViewBuilder content: () -> Content) throws {
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        originalWindow = scene.keyWindow
        controller = UIHostingController(rootView: content())
        window = UIWindow(windowScene: scene)
        window.rootViewController = controller
        window.makeKeyAndVisible()
    }
    func resize(width: CGFloat, height: CGFloat, insets: UIEdgeInsets = .zero) {
        window.frame = CGRect(x: 0, y: 0, width: width, height: height)
        controller.view.frame = window.bounds
        controller.additionalSafeAreaInsets = insets
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
    }
    func close() {
        window.isHidden = true
        originalWindow?.makeKey()
    }
}
