import WidgetKit
import SwiftUI

struct WhisperWidget: Widget {
    let kind: String = "WhisperWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WhisperTimelineProvider()) { entry in
            Group {
                if #available(iOSApplicationExtension 17.0, *) {
                    WhisperWidgetEntryView(entry: entry)
                        .containerBackground(for: .widget) {
                            ContainerBackgroundView()
                        }
                } else {
                    WhisperWidgetEntryView(entry: entry)
                }
            }
        }
        .configurationDisplayName("Whisper")
        .description("Daily quotes to inspire and uplift you.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .accessoryRectangular,
            .accessoryCircular,
        ])
    }
}

@available(iOSApplicationExtension 17.0, *)
struct ContainerBackgroundView: View {
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryRectangular, .accessoryCircular, .accessoryInline:
            Color.clear
        default:
            LinearGradient(
                colors: [
                    Color(red: 0.722, green: 0.851, blue: 0.910),
                    Color(red: 0.961, green: 0.961, blue: 0.941)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        }
    }
}

struct WhisperWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: QuoteEntry

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                SmallWidgetView(entry: entry)
            case .systemMedium:
                MediumWidgetView(entry: entry)
            case .accessoryRectangular:
                AccessoryRectangularView(entry: entry)
            case .accessoryCircular:
                AccessoryCircularView(entry: entry)
            default:
                SmallWidgetView(entry: entry)
            }
        }
        .widgetURL(URL(string: "whisper://home?quoteId=\(entry.quote?.id ?? "")"))
    }
}
