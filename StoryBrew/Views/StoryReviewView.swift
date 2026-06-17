import SwiftUI

/// Shows the freshly-generated story text for the parent to read and vote on.
/// Thumbs up approves it (and makes it playable / adds it to the playlist);
/// thumbs down discards it so the parent can try again. No audio is produced
/// until a story is approved.
struct StoryReviewView: View {
    @EnvironmentObject private var store: StoryStore
    let story: Story
    let onApproved: () -> Void
    let onTryAgain: () -> Void

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    storyCard
                    moralCard
                    Text("Do you like this story?")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(Theme.textDark)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 4)
                }
                .padding()
            }
        }
        .navigationTitle("Read & Approve")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .safeAreaInset(edge: .bottom) { voteBar }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(story.title)
                .font(.system(size: 26, weight: .heavy, design: .rounded))
                .foregroundStyle(Theme.textDark)
            Text(story.summary)
                .font(.system(size: 16, design: .rounded))
                .foregroundStyle(Theme.textDark.opacity(0.7))
            HStack(spacing: 8) {
                ForEach(story.characters) { character in
                    Text(character.animal.emoji).font(.system(size: 24))
                }
            }
            .padding(.top, 2)
        }
    }

    private var storyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(story.lines) { line in
                StoryLineRow(line: line, isNarration: line.speaker == Story.narratorSpeaker)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }

    private var moralCard: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("🌟").font(.system(size: 30))
            VStack(alignment: .leading, spacing: 4) {
                Text("The lesson")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.secondary)
                Text(story.moralLesson)
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(Theme.textDark)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Theme.secondary.opacity(0.14), in: RoundedRectangle(cornerRadius: Theme.cornerRadius))
    }

    private var voteBar: some View {
        HStack(spacing: 14) {
            Button {
                onTryAgain()
            } label: {
                Label("Try Again", systemImage: "hand.thumbsdown.fill")
            }
            .buttonStyle(BigButtonStyle(fill: Theme.dislike))

            Button {
                var approved = story
                approved.approvalState = .approved
                approved.audioReady = true
                store.upsert(approved)
                onApproved()
            } label: {
                Label("I Like It", systemImage: "hand.thumbsup.fill")
            }
            .buttonStyle(BigButtonStyle(fill: Theme.like))
        }
        .padding()
        .background(.ultraThinMaterial)
    }
}

/// One line of story text, styled differently for narration vs. dialogue.
struct StoryLineRow: View {
    let line: StoryLine
    let isNarration: Bool
    var isActive: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if !isNarration {
                Text(line.speaker.uppercased())
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.accent)
            }
            Text(line.text)
                .font(.system(size: isNarration ? 16 : 17,
                              weight: isNarration ? .regular : .semibold,
                              design: .rounded))
                .italic(isNarration)
                .foregroundStyle(Theme.textDark)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(
            isActive ? Theme.primary.opacity(0.18) : Color.clear,
            in: RoundedRectangle(cornerRadius: 12)
        )
    }
}
