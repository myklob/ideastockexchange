import SwiftUI

/// Two-tab shell:
///   - "Web" hosts a WKWebView pointing at the deployed site (the entire product).
///   - "Browse" is a native list/detail that traverses reasons-to-agree/disagree
///     using the JSON API. It exists primarily to clear App Store guideline 4.2
///     ("minimum functionality") and to seed the path toward a fully native
///     rebuild (docs/IOS.md, step 3).
struct RootView: View {
    var body: some View {
        TabView {
            WebViewScreen()
                .tabItem {
                    Label("Web", systemImage: "globe")
                }

            NavigationStack {
                BeliefsListView()
            }
            .tabItem {
                Label("Browse", systemImage: "list.bullet.rectangle")
            }
        }
    }
}

#Preview {
    RootView()
}
