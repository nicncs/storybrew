import SwiftUI

/// Central place for the app's kid-friendly look: soft, warm colours, rounded
/// shapes, and big readable type. Keeping it here means the few screens we have
/// stay visually consistent.
enum Theme {
    // Warm, playful palette.
    static let background = Color(red: 1.0, green: 0.97, blue: 0.90)
    static let card = Color.white
    static let primary = Color(red: 0.96, green: 0.55, blue: 0.30)   // friendly orange
    static let secondary = Color(red: 0.45, green: 0.73, blue: 0.62) // calm green
    static let accent = Color(red: 0.55, green: 0.50, blue: 0.85)    // soft purple
    static let textDark = Color(red: 0.25, green: 0.22, blue: 0.20)
    static let like = Color(red: 0.40, green: 0.72, blue: 0.45)
    static let dislike = Color(red: 0.90, green: 0.45, blue: 0.45)

    static let cornerRadius: CGFloat = 24
}

/// A large, tappable, rounded button — the main interaction style for the app.
struct BigButtonStyle: ButtonStyle {
    var fill: Color = Theme.primary
    var textColor: Color = .white

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 22, weight: .bold, design: .rounded))
            .foregroundStyle(textColor)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(fill, in: RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
            .shadow(color: fill.opacity(0.35), radius: 8, y: 4)
    }
}

extension View {
    /// Standard rounded white card container used across screens.
    func cardStyle() -> some View {
        self
            .padding()
            .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cornerRadius, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 6, y: 3)
    }
}
