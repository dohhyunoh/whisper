import Foundation

struct WidgetQuote: Codable {
    let id: String
    let text: String
    let author: String
    let isLiked: Bool
}

struct WidgetData: Codable {
    let quotes: [WidgetQuote]
    let likedQuotes: [WidgetQuote]
    let updatedAt: Double
}

func loadWidgetData() -> WidgetData? {
    guard let defaults = UserDefaults(suiteName: "group.com.dohhyun.whisper"),
          let jsonString = defaults.string(forKey: "widgetData"),
          let data = jsonString.data(using: .utf8) else {
        return nil
    }
    return try? JSONDecoder().decode(WidgetData.self, from: data)
}
