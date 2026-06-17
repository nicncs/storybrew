import SwiftUI

/// Grid of big emoji animal buttons. Tapping one adds it as a character.
struct AnimalPicker: View {
    let isEnabled: Bool
    let onPick: (AnimalType) -> Void

    private let columns = [GridItem(.adaptive(minimum: 72), spacing: 12)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(AnimalType.allCases) { animal in
                Button {
                    onPick(animal)
                } label: {
                    VStack(spacing: 4) {
                        Text(animal.emoji)
                            .font(.system(size: 38))
                        Text(animal.displayName)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(Theme.textDark)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Theme.background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .disabled(!isEnabled)
                .opacity(isEnabled ? 1 : 0.4)
            }
        }
    }
}

/// A selected character shown as a removable chip.
struct CharacterChip: View {
    let emoji: String
    let name: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Text(emoji).font(.system(size: 28))
            Text(name)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.textDark)
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(Theme.dislike)
                    .font(.system(size: 20))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Theme.secondary.opacity(0.18), in: Capsule())
    }
}
