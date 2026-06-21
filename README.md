# StoryBrew 📚✨

Brewing short, gentle, voiced stories for kids — **one codebase, three platforms (iOS, Android, web)**.

A parent describes a story — their child's age, a small cast of animal friends,
and a theme — and the app brews a ~2 minute tale with a happy ending and a moral
lesson. The parent reads it, votes 👍 / 👎, and only an approved story gets read
aloud, with a **distinct voice per character**. Approved stories live in a
replayable playlist and can grow into multi-episode series.

Inspired by the friendly-animal-mystery vibe of *Sheriff Labrador* and
*Inspector Chimp*.

## Tech stack

- **Expo (React Native + TypeScript)** with **react-native-web** — a single
  codebase that runs on iOS, Android, and the web.
- **Expo Router** for file-based navigation (also gives real web URLs).
- **expo-speech** for on-device text-to-speech — distinct per-character voices
  on all three platforms (the browser uses the Web Speech API).
- **AsyncStorage** for on-device persistence (web uses `localStorage`).
- **Anthropic Messages API (`claude-opus-4-8`)** for story generation, behind a
  pluggable `StoryEngine` interface.

## How it works

1. **Make a Story** — pick the child's age, up to **5** animal characters (each
   gets its own voice), and a theme prompt.
2. **Brew** — the story engine writes a short, structured story.
3. **Read & approve** — the parent reads the generated text and votes 👍 / 👎.
   Audio is only produced after a 👍.
4. **Play** — approved stories are read aloud with per-character voices, the
   current line highlighted. Replay any time from the playlist; delete from the
   player.
5. **Next episode** — continue any story as a series; later episodes stay
   consistent with earlier ones.

### Safety

Every story is constrained to be positive and uplifting with a clear moral.
Guardrails work on two levels:

- The engine's **system prompt** forbids violence, bullying, sexual content,
  discrimination, and other grown-up/frightening themes, and tells the model to
  gently reinterpret unsafe ideas rather than produce them.
- `guardrails.ts` is a local backstop that screens the parent's **input theme**
  before generation and the **generated output** before it is shown.

## Architecture

```
app/                      Expo Router screens (also the web routes)
├─ _layout.tsx            Stack + providers
├─ index.tsx              Home / playlist
├─ create.tsx             Make-a-story form
├─ review.tsx             Read & vote 👍/👎
└─ player/[id].tsx        Player

src/
├─ models/                types, animals, voice palette
├─ services/
│  ├─ engines/            StoryEngine (interface), ClaudeStoryEngine, TemplateStoryEngine
│  ├─ appConfig.ts        API-key resolution + engine selection
│  ├─ storyStore.ts       AsyncStorage persistence + playlist/series selectors
│  ├─ audioService.ts     expo-speech playback, one voice per character
│  └─ guardrails.ts       local content-safety backstop
├─ state/AppProvider.tsx  app-wide store + audio + generation, via React context
├─ components/            BigButton, AnimalPicker, StoryLineRow
└─ theme/theme.ts         colours + sizing
```

- **Story generation is pluggable** via the `StoryEngine` interface. The shipped
  implementation, `ClaudeStoryEngine`, calls the Anthropic Messages API directly
  with structured outputs and adaptive thinking. To move the key off the client,
  swap in an engine that calls your own backend proxy — no UI changes needed.
- **Audio uses `expo-speech`** — each character is assigned a distinct
  `VoiceProfile` (gender lean + pitch + rate), resolved to an installed voice at
  playback time so characters sound different on any device/browser. Playback is
  sequential (line → line) and synthesised on demand, so there are no audio
  files to store; replay just re-runs synthesis.
- **Everything is stored on-device** (`AsyncStorage`). No accounts, no cloud sync.

## Running it

Requirements: **Node 18+** and the Expo tooling.

```bash
npm install
# optional but recommended: add an Anthropic key for real stories
cp .env.example .env        # then paste your key into .env

npm run web        # open in the browser
npm run ios        # iOS simulator (macOS + Xcode)
npm run android    # Android emulator/device
# or: npm start    # then press w / i / a
```

If your installed Expo SDK differs, run `npx expo install` once to align native
package versions with the SDK.

Without a key, the app falls back to a basic offline `TemplateStoryEngine` so it
still runs everywhere for demos (lower quality, no network).

## Audio output (Bluetooth / CarPlay / speakers)

Playback is configured to route to whatever output is connected:

- **Routing** — before playback, the app sets the OS audio session to media
  "playback" (`expo-av` `Audio.setAudioModeAsync`). On iOS/Android this means the
  story plays out over a connected **Bluetooth** device, **car speaker**, or
  **CarPlay/Android Auto** audio, plays even when the ringer is on silent, and
  keeps going with the screen locked / app backgrounded (iOS background-audio
  mode is declared in `app.json`). On web, the browser/OS handles routing.
- **Media controls** — on web, a playing story is published to the **Media
  Session API**, so it shows on the OS/Bluetooth/car media controls and their
  play/pause/stop buttons drive the app.

**Limitation (scope):** native iOS/Android lock-screen & CarPlay *Now Playing*
metadata and transport buttons are **not** wired up — that needs
`MPNowPlayingInfoCenter` / `MPRemoteCommandCenter` (a custom native module, not
available with on-device speech synthesis in Expo Go). Audio still **plays**
through Bluetooth/CarPlay; it just won't show a title/artwork or accept the
car's transport buttons on native. Reliable background playback and full car
controls are the natural follow-up if you move to pre-rendered audio files (the
"full Now Playing" path) — the `StoryEngine`-style seam makes that swap
localised to the audio layer.

---

**Compliance note (PDPA / data flows):** when a real API key is configured, this
app transmits the child's age and the parent's theme prompt to a third-party LLM
provider (Anthropic) to generate stories. That is a PDPA-sensitive,
customer-/child-data flow and should be reviewed and signed off by Risk /
Compliance / Legal (and covered in the app's privacy notice) before this ships
externally. The shipped default also calls the API **directly from the client**,
exposing the API key to the client — acceptable for a prototype, but for
production move generation behind a backend proxy (a drop-in swap behind the
`StoryEngine` interface). The offline engine and on-device persistence keep all
data local.
