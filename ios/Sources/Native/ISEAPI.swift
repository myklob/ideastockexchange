import Foundation

/// Thin networking layer over the deployed JSON API.
/// Base URL is read from the same `ISEWebURL` Info.plist key the WebView uses,
/// so the wrapper and native tab always agree on which environment they target.
struct ISEAPI {
    static let shared = ISEAPI()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let baseURL: URL

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()

        let raw = (Bundle.main.object(forInfoDictionaryKey: "ISEWebURL") as? String)
            ?? "https://ideastockexchange.com"
        self.baseURL = URL(string: raw) ?? URL(string: "https://ideastockexchange.com")!
    }

    func fetchBeliefs(limit: Int = 100) async throws -> [BeliefSummary] {
        var components = URLComponents(url: baseURL.appendingPathComponent("api/beliefs"),
                                       resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        let url = components.url!

        let (data, response) = try await session.data(from: url)
        try Self.validate(response)
        let decoded = try decoder.decode(BeliefListResponse.self, from: data)
        return decoded.beliefs
    }

    func fetchBelief(id: Int) async throws -> BeliefDetailResponse {
        let url = baseURL.appendingPathComponent("api/beliefs/\(id)")
        let (data, response) = try await session.data(from: url)
        try Self.validate(response)
        return try decoder.decode(BeliefDetailResponse.self, from: data)
    }

    private static func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}
