/**
 * Web "Media Session" integration so a playing story shows up on Bluetooth
 * devices, car head units (incl. CarPlay/Android Auto over the browser) and the
 * OS media controls, and so their play/pause/stop buttons drive the app.
 *
 * This is a no-op on native and in any environment without the Media Session
 * API. (On native iOS/Android, audio routing to Bluetooth/CarPlay is handled by
 * the audio-session configuration in AudioService; native lock-screen/CarPlay
 * transport metadata would require a custom native module — see README.)
 */

interface NowPlaying {
  title: string;
  artist?: string;
}

interface Handlers {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

function session(): any | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const ms = (navigator as any).mediaSession;
  return ms ?? undefined;
}

export function setNowPlaying(info: NowPlaying, handlers: Handlers): void {
  const ms = session();
  if (!ms) return;

  try {
    if (typeof (globalThis as any).MediaMetadata === 'function') {
      ms.metadata = new (globalThis as any).MediaMetadata({
        title: info.title,
        artist: info.artist ?? 'StoryBrew',
        album: 'StoryBrew',
      });
    }
    ms.setActionHandler('play', handlers.onPlay);
    ms.setActionHandler('pause', handlers.onPause);
    ms.setActionHandler('stop', handlers.onStop);
    // We render a single continuous narration, so disable track skipping.
    ms.setActionHandler('previoustrack', null);
    ms.setActionHandler('nexttrack', null);
  } catch {
    // Media Session unsupported / partial — ignore.
  }
}

export function setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  const ms = session();
  if (!ms) return;
  try {
    ms.playbackState = state;
  } catch {
    // ignore
  }
}

export function clearNowPlaying(): void {
  const ms = session();
  if (!ms) return;
  try {
    ms.playbackState = 'none';
    ms.metadata = null;
    ['play', 'pause', 'stop'].forEach((a) => ms.setActionHandler(a, null));
  } catch {
    // ignore
  }
}
