import SwiftUI

@main
struct StoryBrewApp: App {
    @StateObject private var store = StoryStore()
    @StateObject private var audio = AudioService()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(store)
                .environmentObject(audio)
                .tint(Theme.primary)
        }
    }
}
