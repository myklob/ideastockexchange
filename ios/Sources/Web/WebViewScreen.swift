import SwiftUI
@preconcurrency import WebKit

/// Hosts the production web app inside a WKWebView. The destination URL is
/// configured via the `ISEWebURL` Info.plist key so CI and per-scheme overrides
/// don't require a code change.
struct WebViewScreen: View {
    @State private var isLoading = true
    @State private var loadError: String?

    private var startURL: URL {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "ISEWebURL") as? String)
            ?? "https://ideastockexchange.com"
        return URL(string: raw) ?? URL(string: "https://ideastockexchange.com")!
    }

    var body: some View {
        ZStack {
            WebView(url: startURL, isLoading: $isLoading, loadError: $loadError)
                .ignoresSafeArea(edges: .bottom)

            if isLoading && loadError == nil {
                ProgressView().controlSize(.large)
            }

            if let loadError {
                VStack(spacing: 12) {
                    Text("Couldn't load").font(.headline)
                    Text(loadError)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                    Button("Try again") {
                        self.loadError = nil
                        self.isLoading = true
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                .padding()
            }
        }
    }
}

private struct WebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    @Binding var loadError: String?

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if loadError == nil && webView.url == nil {
            webView.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let parent: WebView
        init(_ parent: WebView) { self.parent = parent }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation nav: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish nav: WKNavigation!) {
            parent.isLoading = false
        }

        func webView(_ webView: WKWebView, didFail nav: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            parent.loadError = error.localizedDescription
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation nav: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            parent.loadError = error.localizedDescription
        }
    }
}
