import SwiftUI

/// The "make a story" form: child's age, characters (max 5), and a theme.
/// On success it pushes the review screen for a thumbs up / down.
struct CreateStoryView: View {
    @EnvironmentObject private var store: StoryStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var vm = StoryCreationViewModel()

    /// When set, the form starts pre-filled to write the next episode of a series.
    var continuingFrom: Story? = nil

    @State private var draftStory: Story?

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.background.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        ageSection
                        charactersSection
                        themeSection
                        generateButton
                    }
                    .padding()
                }
            }
            .navigationTitle(vm.isContinuingSeries ? "Next Episode" : "New Story")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .navigationDestination(item: $draftStory) { story in
                StoryReviewView(
                    story: story,
                    onApproved: { dismiss() },
                    onTryAgain: { draftStory = nil }
                )
            }
            .overlay { if vm.phase == .generating { generatingOverlay } }
            .alert("Hmm…", isPresented: errorBinding) {
                Button("OK") { vm.dismissError() }
            } message: {
                if case let .error(message) = vm.phase { Text(message) }
            }
            .onAppear {
                if let story = continuingFrom, !vm.isContinuingSeries {
                    vm.configureForNextEpisode(of: story, store: store)
                }
            }
        }
    }

    // MARK: - Sections

    private var ageSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("How old is your child?")
            HStack {
                Stepper(value: $vm.childAge, in: vm.minAge...vm.maxAge) {
                    Text("\(vm.childAge) year\(vm.childAge == 1 ? "" : "s") old")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundStyle(Theme.textDark)
                }
            }
            .cardStyle()
        }
    }

    private var charactersSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("Who is in the story?")
            Text("Pick up to \(vm.maxCharacters) animal friends. Tap a name to rename.")
                .font(.system(size: 14, design: .rounded))
                .foregroundStyle(Theme.textDark.opacity(0.6))

            if !vm.drafts.isEmpty {
                ForEach($vm.drafts) { $draft in
                    HStack(spacing: 12) {
                        Text(draft.animal.emoji).font(.system(size: 30))
                        TextField("Name", text: $draft.name)
                            .font(.system(size: 18, weight: .semibold, design: .rounded))
                            .textInputAutocapitalization(.words)
                        Spacer()
                        Button {
                            vm.removeCharacter(draft)
                        } label: {
                            Image(systemName: "trash.circle.fill")
                                .font(.system(size: 24))
                                .foregroundStyle(Theme.dislike)
                        }
                    }
                    .padding(10)
                    .cardStyle()
                }
            }

            if vm.canAddCharacter {
                AnimalPicker(isEnabled: vm.canAddCharacter) { vm.addCharacter($0) }
                    .cardStyle()
            } else {
                Text("That's a full cast! 🎉")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(Theme.secondary)
            }
        }
    }

    private var themeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("What should it be about?")
            TextField(
                "e.g. solving the mystery of the missing cookies",
                text: $vm.theme,
                axis: .vertical
            )
            .lineLimit(2...5)
            .font(.system(size: 17, design: .rounded))
            .padding(12)
            .cardStyle()
        }
    }

    private var generateButton: some View {
        Button {
            Task {
                if let story = await vm.generate() {
                    draftStory = story
                }
            }
        } label: {
            Label(vm.isContinuingSeries ? "Brew Next Episode" : "Brew the Story",
                  systemImage: "wand.and.stars")
        }
        .buttonStyle(BigButtonStyle(fill: vm.canGenerate ? Theme.primary : Theme.primary.opacity(0.4)))
        .disabled(!vm.canGenerate)
        .padding(.top, 4)
    }

    private var generatingOverlay: some View {
        ZStack {
            Color.black.opacity(0.35).ignoresSafeArea()
            VStack(spacing: 16) {
                ProgressView().scaleEffect(1.6).tint(.white)
                Text("Brewing your story… ✨")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
            }
            .padding(30)
            .background(Theme.accent, in: RoundedRectangle(cornerRadius: Theme.cornerRadius))
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 20, weight: .bold, design: .rounded))
            .foregroundStyle(Theme.textDark)
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { if case .error = vm.phase { return true } else { return false } },
            set: { if !$0 { vm.dismissError() } }
        )
    }
}
