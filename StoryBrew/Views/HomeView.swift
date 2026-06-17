import SwiftUI

/// The home screen: the story playlist plus the one big button that starts the
/// "make a story" flow. Deliberately just two things on screen.
struct HomeView: View {
    @EnvironmentObject private var store: StoryStore
    @State private var showingCreate = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()
                content
            }
            .navigationTitle("StoryBrew")
            .navigationDestination(for: Story.self) { story in
                PlayerView(story: story)
            }
            .safeAreaInset(edge: .bottom) {
                Button {
                    showingCreate = true
                } label: {
                    Label("Make a Story", systemImage: "sparkles")
                }
                .buttonStyle(BigButtonStyle())
                .padding()
            }
            .fullScreenCover(isPresented: $showingCreate) {
                CreateStoryView()
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if store.hasPlaylist {
            List {
                ForEach(store.playlist) { story in
                    NavigationLink(value: story) {
                        StoryRow(story: story)
                    }
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                }
                .onDelete { offsets in
                    store.delete(at: offsets, in: store.playlist)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
        } else {
            emptyState
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("📚✨")
                .font(.system(size: 72))
            Text("No stories yet!")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.textDark)
            Text("Tap “Make a Story” to brew your first magical tale.")
                .font(.system(size: 17, design: .rounded))
                .foregroundStyle(Theme.textDark.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .padding(.bottom, 80)
    }
}

/// A single playlist row.
struct StoryRow: View {
    @EnvironmentObject private var audio: AudioService
    let story: Story

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle().fill(Theme.accent.opacity(0.18)).frame(width: 54, height: 54)
                Text(story.characters.first?.animal.emoji ?? "📖")
                    .font(.system(size: 28))
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(story.title)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.textDark)
                    .lineLimit(2)
                HStack(spacing: 6) {
                    if let series = story.seriesTitle, story.episodeNumber > 0 {
                        Text("\(series) • Ep \(story.episodeNumber)")
                    } else {
                        Text("~\(story.estimatedReadingSeconds / 60) min")
                    }
                }
                .font(.system(size: 13, design: .rounded))
                .foregroundStyle(Theme.textDark.opacity(0.6))
            }
            Spacer()
            Image(systemName: audio.isCurrent(story) && audio.isPlaying ? "speaker.wave.2.fill" : "play.circle.fill")
                .font(.system(size: 28))
                .foregroundStyle(Theme.primary)
        }
        .padding(12)
        .cardStyle()
        .padding(.vertical, 4)
    }
}
