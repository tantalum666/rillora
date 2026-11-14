import SwiftUI
import WidgetKit

private struct Entry: TimelineEntry { let date: Date }
private struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        completion(Timeline(entries: [Entry(date: Date())], policy: .never))
    }
}
private struct ShortcutView: View {
    @Environment(\.widgetFamily) private var family
    var body: some View {
        Group {
            if family == .accessoryCircular { Image(systemName: "checkmark.circle").font(.title2) }
            else { Label(String(localized: "checkinShortcut"), systemImage: "checkmark.circle") }
        }
        .widgetURL(URL(string: "rillora-watch://checkin"))
        .containerBackground(.clear, for: .widget)
        .accessibilityLabel(String(localized: "checkinShortcut"))
    }
}

@main
struct RilloraCheckInWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "RilloraCheckIn", provider: Provider()) { _ in ShortcutView() }
            .configurationDisplayName(String(localized: "checkinShortcut"))
            .description(String(localized: "checkinShortcutDescription"))
            .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}
