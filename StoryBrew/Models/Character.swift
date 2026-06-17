import Foundation

/// A story character chosen by the parent: an animal with a name and a
/// distinct voice profile so it sounds unique when the story is read aloud.
struct Character: Codable, Equatable, Identifiable {
    var id: UUID
    var name: String
    var animal: AnimalType
    var voiceProfile: VoiceProfile

    init(id: UUID = UUID(), name: String, animal: AnimalType, voiceProfile: VoiceProfile) {
        self.id = id
        self.name = name
        self.animal = animal
        self.voiceProfile = voiceProfile
    }

    /// e.g. "Leo the Lion" — handy for prompts and labels.
    var fullDescription: String {
        "\(name) the \(animal.displayName)"
    }
}
