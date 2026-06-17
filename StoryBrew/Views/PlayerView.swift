import SwiftUI

/// Plays an approved story aloud with per-character voices, highlights the line
/// being read, and offers replay, deletion, and "make the next episode".
struct PlayerView: View {
    @EnvironmentObject private var store: StoryStore
    @EnvironmentObject private var audio: AudioService
    @Environment(\.dismiss) private var dismiss

    let story: Story

    @State private var showingNextEpisode = false
    @State private var showingDeleteConfirm = false

    /// Always reflect the latest stored copy if it exists.
    private var current: Story {
        store.stories.first(where: { $0.id == story.id }) ?? story
    }

    private var episodes: [Story] {
        store.episodes(inSeriesOf: current).filter { $0.approvalState == .approved }
    }

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    linesCard
                    moralCard
                    if episodes.count > 1 { episodeList }
                    nextEpisodeButton
                }
                .padding()
            }
        }
        .navigationTitle("Story Time")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(role: .destructive) {
                    showingDeleteConfirm = true
                } label: {
                    Image(systemName: "trash")
                }
            }
        }
        .safeAreaInset(edge: .bottom) { playBar }
        .onDisappear { audio.stop() }
        .fullScreenCover(isPresented: $showingNextEpisode) {
            CreateStoryView(continuingFrom: current)
        }
        .confirmationDialog("Delete this story?", isPresented: $showingDeleteConfirm, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                audio.stop()
                store.delete(current)
                dismiss()
            }
            Button("Keep", role: .cancel) {}
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(current.title)
                .font(.system(size: 26, weight: .heavy, design: .rounded))
                .foregroundStyle(Theme.textDark)
            if let series = current.seriesTitle, current.episodeNumber > 0 {
                Text("\(series) • Episode \(current.episodeNumber)")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(Theme.accent)
            }
            HStack(spacing: 10) {
                ForEach(current.characters) { character in
                    VStack(spacing: 2) {
                        Text(character.animal.emoji).font(.system(size: 26))
                        Text(character.name)
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(Theme.textDark.opacity(0.7))
                    }
                }
            }
            .padding(.top, 4)
        }
    }

    private var linesCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(current.lines.enumerated()), id: \.element.id) { index, line in
                StoryLineRow(
                    line: line,
                    isNarration: line.speaker == Story.narratorSpeaker,
                    isActive: audio.isCurrent(current) && audio.currentLineIndex == index
                )
            }
        }
        .cardStyle()
    }

    private var moralCard: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("🌟").font(.system(size: 28))
            VStack(alignment: .leading, spacing: 4) {
                Text("The lesson")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.secondary)
                Text(current.moralLesson)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(Theme.textDark)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Theme.secondary.opacity(0.14), in: RoundedRectangle(cornerRadius: Theme.cornerRadius))
    }

    private var episodeList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("More in this series")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.textDark)
            ForEach(episodes) { episode in
                NavigationLink(value: episode) {
                    HStack {
                        Text("Ep \(episode.episodeNumber)")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(Theme.accent)
                        Text(episode.title)
                            .font(.system(size: 15, design: .rounded))
                            .foregroundStyle(Theme.textDark)
                            .lineLimit(1)
                        Spacer()
                        if episode.id == current.id {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.secondary)
                        }
                    }
                    .padding(10)
                    .background(Theme.card, in: RoundedRectangle(cornerRadius: 14))
                }
            }
        }
    }

    private var nextEpisodeButton: some View {
        Button {
            showingNextEpisode = true
        } label: {
            Label("Make the Next Episode", systemImage: "plus.circle.fill")
        }
        .buttonStyle(BigButtonStyle(fill: Theme.accent))
        .padding(.top, 4)
    }

    private var playBar: some View {
        let isThisPlaying = audio.isCurrent(current) && audio.isPlaying && !audio.isPaused
        return HStack(spacing: 14) {
            Button {
                audio.togglePlayPause(for: current)
            } label: {
                Label(isThisPlaying ? "Pause" : (audio.isCurrent(current) && audio.isPaused ? "Resume" : "Play Story"),
                      systemImage: isThisPlaying ? "pause.fill" : "play.fill")
            }
            .buttonStyle(BigButtonStyle())

            if audio.isCurrent(current) {
                Button {
                    audio.stop()
                } label: {
                    Image(systemName: "stop.fill")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 60)
                        .padding(.vertical, 18)
                        .background(Theme.dislike, in: RoundedRectangle(cornerRadius: Theme.cornerRadius))
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
    }
}
