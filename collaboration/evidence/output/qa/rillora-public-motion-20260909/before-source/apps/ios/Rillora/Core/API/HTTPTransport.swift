import Foundation

struct HTTPTransportResponse: Sendable {
    let data: Data
    let response: HTTPURLResponse
}

protocol HTTPTransport: Sendable {
    func send(_ request: URLRequest) async throws -> HTTPTransportResponse
}

struct URLSessionTransport: HTTPTransport {
    let session: URLSession

    static func live() -> URLSessionTransport {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = true
        configuration.httpCookieAcceptPolicy = .always
        configuration.timeoutIntervalForRequest = 15
        configuration.timeoutIntervalForResource = 30
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSessionTransport(session: URLSession(configuration: configuration))
    }

    func send(_ request: URLRequest) async throws -> HTTPTransportResponse {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw RilloraAPIError.invalidResponse
        }
        return HTTPTransportResponse(data: data, response: httpResponse)
    }
}
