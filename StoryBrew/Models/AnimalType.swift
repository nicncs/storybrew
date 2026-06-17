import Foundation

/// The animals a parent can pick as story characters.
/// Kept deliberately small and friendly so the picker stays simple for kids.
enum AnimalType: String, CaseIterable, Codable, Identifiable {
    case lion
    case rabbit
    case bear
    case owl
    case fox
    case elephant
    case mouse
    case puppy
    case kitten
    case frog
    case penguin
    case turtle

    var id: String { rawValue }

    /// Emoji used on the big, colourful picker buttons.
    var emoji: String {
        switch self {
        case .lion: return "🦁"
        case .rabbit: return "🐰"
        case .bear: return "🐻"
        case .owl: return "🦉"
        case .fox: return "🦊"
        case .elephant: return "🐘"
        case .mouse: return "🐭"
        case .puppy: return "🐶"
        case .kitten: return "🐱"
        case .frog: return "🐸"
        case .penguin: return "🐧"
        case .turtle: return "🐢"
        }
    }

    var displayName: String {
        switch self {
        case .lion: return "Lion"
        case .rabbit: return "Rabbit"
        case .bear: return "Bear"
        case .owl: return "Owl"
        case .fox: return "Fox"
        case .elephant: return "Elephant"
        case .mouse: return "Mouse"
        case .puppy: return "Puppy"
        case .kitten: return "Kitten"
        case .frog: return "Frog"
        case .penguin: return "Penguin"
        case .turtle: return "Turtle"
        }
    }

    /// A friendly default name suggestion, e.g. "Leo the Lion".
    var suggestedName: String {
        switch self {
        case .lion: return "Leo"
        case .rabbit: return "Bonnie"
        case .bear: return "Bruno"
        case .owl: return "Ollie"
        case .fox: return "Foxy"
        case .elephant: return "Ella"
        case .mouse: return "Milo"
        case .puppy: return "Pip"
        case .kitten: return "Kiki"
        case .frog: return "Freddie"
        case .penguin: return "Percy"
        case .turtle: return "Tilly"
        }
    }
}
