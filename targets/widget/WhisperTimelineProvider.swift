import WidgetKit
import SwiftUI

struct QuoteEntry: TimelineEntry {
    let date: Date
    let quote: WidgetQuote?
    let isLiked: Bool
    let locked: Bool
}

struct WhisperTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> QuoteEntry {
        QuoteEntry(date: Date(), quote: nil, isLiked: false, locked: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (QuoteEntry) -> Void) {
        let entry = makeEntry(date: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuoteEntry>) -> Void) {
        var entries: [QuoteEntry] = []
        let now = Date()

        // Generate 24 entries over 24 hours (one every hour)
        for i in 0..<24 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: i, to: now)!
            entries.append(makeEntry(date: entryDate))
        }

        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 24, to: now)!
        completion(Timeline(entries: entries, policy: .after(nextUpdate)))
    }

    private func makeEntry(date: Date) -> QuoteEntry {
        guard let data = loadWidgetData() else {
            return QuoteEntry(date: date, quote: nil, isLiked: false, locked: false)
        }

        // Premium-only lock: show the upgrade card, no quote content.
        if data.locked == true {
            return QuoteEntry(date: date, quote: nil, isLiked: false, locked: true)
        }

        // ~30% chance to show a liked quote if available
        let showLiked = !data.likedQuotes.isEmpty && Int.random(in: 0..<10) < 3

        if showLiked {
            let quote = data.likedQuotes.randomElement()!
            return QuoteEntry(date: date, quote: quote, isLiked: true, locked: false)
        } else if !data.quotes.isEmpty {
            let quote = data.quotes.randomElement()!
            return QuoteEntry(date: date, quote: quote, isLiked: false, locked: false)
        }

        return QuoteEntry(date: date, quote: nil, isLiked: false, locked: false)
    }
}
