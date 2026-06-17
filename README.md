# StoryBrew 📚✨

Brewing short, gentle, voiced stories for kids.

StoryBrew is an iOS (SwiftUI) app where a parent describes a story — their
child's age, a small cast of animal friends, and a theme — and the app brews a
~2 minute tale with a happy ending and a moral lesson. The parent reads it,
votes 👍 / 👎, and only an approved story gets read aloud, with a **distinct
voice per character**. Approved stories live in a replayable playlist and can
grow into multi-episode series.

Inspired by the friendly-animal-mystery vibe of *Sheriff Labrador* and
*Inspector Chimp*.

## How it works

1. **Make a Story** — pick the child's age, up to **5** animal characters (each
   gets its own voice), and a theme prompt.
2. **Brew** — a story engine writes a short, structured story.
3. **Read & approve** — the parent reads the generated text and votes 👍 / 👎.
   Audio is only produced after a 👍.
4. **Play** — approved stories are read aloud with per-character voices, the
   current line highlighted. Replay any time from the playlist; swipe to delete.
5. **Next episode** — continue any story as a series; later episodes stay
   consistent with earlier ones.

### Safety

Every story is constrained to be positive and uplifting with a clear moral.
Guardrails work on two levels:

- The story engine's **system prompt** forbids violence, bullying, sexual
  content, discrimination, and other grown-up/frightening themes, and tells the
  model to gently reinterpret unsafe ideas rather than produce them.
- `StoryGuardrails` is a local backstop that screens the parent's **input
  theme** before generation and the **generated output** before it is shown.

## Architecture

```
StoryBrew/
├─ Models/        AnimalType, Character, VoiceProfile, Story
├─ Services/
│  ├─ Engines/    StoryEngine (protocol), ClaudeStoryEngine, TemplateStoryEngine
│  ├─ AppConfig   API-key resolution + engine selection
│  ├─ StoryStore  on-device JSON persistence + playlist + series
│  ├─ AudioService AVSpeechSynthesizer playback, one voice per character
│  └─ StoryGuardrails  local content-safety backstop
├─ ViewModels/    StoryCreationViewModel
├─ Views/         HomeView, CreateStoryView, StoryReviewView, PlayerView + components
└─ Theme/         colours, big-button style
```

- **Story generation is pluggable** via the `StoryEngine` protocol. The shipped
  implementation, `ClaudeStoryEngine`, calls the Anthropic Messages API
  (`claude-opus-4-8`) with structured outputs. Swap in your own backend/proxy by
  providing another `StoryEngine` to `StoryCreationViewModel`.
- **Audio uses Apple's on-device `AVSpeechSynthesizer`** — offline, free, no API
  key. Each character is assigned a distinct `VoiceProfile` (voice lean + pitch
  + rate), resolved to an installed voice at playback time so characters sound
  different on any device.
- **Everything is stored on-device** (Documents/`stories.json`). No accounts, no
  cloud sync.

## Running it

Requirements: **Xcode 16+**, iOS 17+ simulator or device.

1. Open `StoryBrew.xcodeproj`.
2. (Optional but recommended) add an Anthropic API key so real stories generate:
   - Copy `StoryBrew/Resources/Secrets.example.plist` to
     `StoryBrew/Resources/Secrets.plist` and paste your key, **or**
   - set the `ANTHROPIC_API_KEY` environment variable in the scheme, **or**
   - feed `ANTHROPIC_API_KEY` via an xcconfig build setting (wired into
     `Info.plist`).
   - `Secrets.plist` is gitignored.
3. Select the **StoryBrew** scheme and run.

Without a key, the app falls back to a basic offline `TemplateStoryEngine` so it
still runs for demos (lower-quality, no network).

## Notes

- The Xcode project uses a file-system-synchronized group, so new Swift files
  added under `StoryBrew/` are picked up automatically — no manual project edits.
- Story prompts and the child's age are sent to the story engine (the Anthropic
  API) when a real key is configured. See the compliance note below.

---

**Compliance note (PDPA / data flows):** when a real API key is configured, this
app transmits the child's age and the parent's theme prompt to a third-party LLM
provider (Anthropic) to generate stories. That is a PDPA-sensitive,
customer-/child-data flow and should be reviewed and signed off by Risk /
Compliance / Legal (and covered in the app's privacy notice) before this ships
externally. The offline engine and on-device persistence keep all data local.
