import SwiftUI
import WidgetKit

// MARK: - Colors
private let gradientTop = Color(red: 0.722, green: 0.851, blue: 0.910)    // #B8D9E8
private let gradientBottom = Color(red: 0.961, green: 0.961, blue: 0.941) // #F5F5F0
private let textColor = Color(red: 0.227, green: 0.420, blue: 0.502)      // #3A6B80

// MARK: - Small Widget
struct SmallWidgetView: View {
    let entry: QuoteEntry

    var body: some View {
        if let quote = entry.quote {
            VStack(alignment: .leading, spacing: 6) {
                Text(quote.text)
                    .font(.system(size: 13, weight: .medium, design: .serif))
                    .foregroundColor(textColor)
                    .lineLimit(5)
                    .minimumScaleFactor(0.8)

                Text("— \(quote.author)")
                    .font(.system(size: 10, weight: .regular, design: .serif))
                    .foregroundColor(textColor.opacity(0.7))
                    .lineLimit(1)
            }
            .padding(14)
        } else {
            placeholderView
        }
    }

    private var placeholderView: some View {
        VStack(spacing: 8) {
            Image(systemName: "quote.opening")
                .font(.system(size: 20))
                .foregroundColor(textColor.opacity(0.4))
            Text("Let's personalize your experience. Tap to finish telling your story.")
                .font(.system(size: 12, weight: .medium, design: .serif))
                .foregroundColor(textColor.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .padding(14)
    }
}

// MARK: - Medium Widget
struct MediumWidgetView: View {
    let entry: QuoteEntry

    var body: some View {
        if let quote = entry.quote {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: "quote.opening")
                    .font(.system(size: 14))
                    .foregroundColor(textColor.opacity(0.4))

                Text(quote.text)
                    .font(.system(size: 15, weight: .medium, design: .serif))
                    .foregroundColor(textColor)
                    .lineLimit(4)
                    .minimumScaleFactor(0.8)

                Spacer()

                Text("— \(quote.author)")
                    .font(.system(size: 11, weight: .regular, design: .serif))
                    .foregroundColor(textColor.opacity(0.7))
                    .lineLimit(1)
            }
            .padding(16)
        } else {
            placeholderView
        }
    }

    private var placeholderView: some View {
        VStack(spacing: 10) {
            Image(systemName: "quote.opening")
                .font(.system(size: 24))
                .foregroundColor(textColor.opacity(0.4))
            Text("Let's personalize your experience. Tap to finish telling your story.")
                .font(.system(size: 14, weight: .medium, design: .serif))
                .foregroundColor(textColor.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .padding(16)
    }
}

// MARK: - Accessory Rectangular (Lock Screen)
struct AccessoryRectangularView: View {
    let entry: QuoteEntry

    var body: some View {
        if let quote = entry.quote {
            Text(quote.text)
                .font(.system(size: 13, weight: .medium, design: .serif))
                .lineLimit(3)
                .minimumScaleFactor(0.8)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            VStack(alignment: .leading, spacing: 2) {
                Image(systemName: "quote.opening")
                    .font(.system(size: 12))
                Text("Whisper")
                    .font(.system(size: 12, weight: .medium, design: .serif))
            }
        }
    }
}

// MARK: - Accessory Circular (Lock Screen)
struct AccessoryCircularView: View {
    let entry: QuoteEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            Image(systemName: "quote.opening")
                .font(.system(size: 16, weight: .medium))
        }
    }
}
