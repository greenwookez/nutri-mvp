import Foundation

struct ActivitySyncResponse: Decodable {
    struct Activity: Decodable {
        let date: String
        let activeCalories: Double
        let source: String
        let updatedAt: String
    }

    let message: String
    let activity: Activity
}

struct ActivityPayload: Encodable {
    let date: String
    let activeCalories: Double
    let source: String
}

enum APIClientError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let message):
            return message
        }
    }
}

final class APIClient {
    private let baseURL: String
    private let apiKey: String?

    init(baseURL: String, apiKey: String? = nil) {
        self.baseURL = baseURL
        self.apiKey = apiKey
    }

    func syncActiveCalories(date: String, activeCalories: Double, source: String = "ios-healthkit") async throws -> ActivitySyncResponse {
        guard let url = URL(string: "\(baseURL)/api/activity/active-calories") else {
            throw APIClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let apiKey, !apiKey.isEmpty {
            request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        }

        let payload = ActivityPayload(date: date, activeCalories: activeCalories, source: source)
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        guard (200...299).contains(http.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "Server returned \(http.statusCode)"
            throw APIClientError.serverError(msg)
        }

        return try JSONDecoder().decode(ActivitySyncResponse.self, from: data)
    }
}
