# Client-Side Playback Architecture & Technical Specification
**Date**: November 2026  
**Target Environment**: Client-side Single Page Application (GitHub Pages / Vercel / Netlify / Static CDN) + YouTube IFrame API

---

## 1. Problem Analysis & Root Causes

### 1.1 Why Invidious / Piped / Direct googlevideo URLs Fail
- **CORS & Token Expiration**: Invidious and Piped public instances rotate IP pools and frequently return HTTP `403 Forbidden` or `429 Too Many Requests`. Direct audio streams from `googlevideo.com` are cryptographically tied to the requesting IP address and range and fail with CORS network errors (`TypeError: Failed to fetch`) when requested from a browser on GitHub Pages.
- **Offline Download Failures**: Calling `fetch(streamUrl)` or `fetch(youtubeVideoUrl)` from the browser causes instant CORS / network `TypeError` because YouTube video endpoints do not expose permissive `Access-Control-Allow-Origin: *` headers to third-party domains.

### 1.2 Why Hidden YouTube Iframe Audio Fails or Gets Muted/Blocked
- **Browser Autoplay & Visibility Policies**: Modern Chrome, Safari, and iOS/Android WebViews enforce strict Autoplay Policies:
  - Iframes with dimensions `<= 1px`, `opacity: 0`, `visibility: hidden`, or `display: none` are classified by the browser engine as non-visible or disguised.
  - The browser suspends background media playback on non-visible iframes unless there is direct, synchronous user interaction on the iframe itself or an unmuted media element.
  - On mobile Safari and Android Chrome, hidden iframes lose hardware media decoding priority and get killed or paused when the device screen locks.
- **YouTube Player API Ready State & Track Advancement**:
  - In `UniversalAudioBridge.tsx`, `new window.YT.Player()` was attached to an offscreen `1px x 1px` div.
  - When switching tracks via `nextTrack()`, if the iframe is paused, muted, or destroyed, calling `loadVideoById` fails silently without throwing an error if the player's internal state machine hasn't transitioned to `CUED` or `ENDED`.

### 1.3 Why Equalizer (WebAudio API) Fails
- WebAudio's `createMediaElementSource(audioElement)` captures media data at the browser buffer level.
- Cross-origin audio streams without explicit CORS response headers (`Access-Control-Allow-Origin: *`) produce **silence** (all-zero buffer) when routed through `AudioContext` for security (preventing side-channel timing attacks across origins).
- Furthermore, YouTube IFrame players **cannot** be connected to an `AudioContext` because the audio stream is isolated inside Google's cross-origin `<iframe>` sandbox.

---

## 2. Proposed Playback Architecture

### 2.1 The Official Visible YouTube IFrame Player (Dual Anchor Design)
Rather than hiding the YouTube iframe in an off-screen `1px` element that triggers browser autoplay blocks, we use an **Active Visible Player Anchor**:
1. **Persistent Mini-Player / Bottom Dock**:
   - The YouTube IFrame (`<div id="yt-player-container">`) is rendered within a permanent, visible dock element (min 200x112px on desktop or docked in a smooth PiP/drawer).
   - In minimized mode (Bottom Bar), the video can either be docked in the corner (Picture-in-Picture / Mini-player) or positioned inside the bottom bar with valid dimensions (e.g. 160x90px thumbnail window with video stream), maintaining visibility compliance.
2. **NowPlayingModal Integration**:
   - When the user opens the full NowPlayingModal, the player element can be seamlessly moved or rendered full-size (aspect 16:9 video mode or lyrics/album art overlay).
3. **Autoplay & Audio Unlocking**:
   - The first user interaction on any "Play" button triggers `player.playVideo()` synchronously within the user gesture callback stack.
   - For consecutive playlist items, the player uses `player.loadVideoById(nextTrack.youtubeId)`. Because the player instance remains active and in the foreground, browser autoplay policies allow continuous progression.

### 2.2 Next Track Continuity (Bulletproof State Machine)
To ensure Next / Previous song progression never hangs:
1. **Event State Handling**:
   - Listen to `YT.PlayerState.ENDED` (`event.data === 0`).
   - Trigger `nextTrack()`.
2. **Timeout Safeguard**:
   - When a track switch occurs, set a 2.5-second watchdog timer: if the player does not emit `YT.PlayerState.PLAYING` or `BUFFERING`, invoke `player.playVideo()` directly or cue with fallback.
3. **Queue Radio Fallback**:
   - If the queue reaches the end, fallback to related YouTube Music recommendations via `ClientMusicService.search` or `PersonalDiscoveryEngine`.

### 2.3 MediaSession API Integration
- Maintain continuous lock screen / headphone remote controls:
  - `play`, `pause`, `previoustrack`, `nexttrack`, `seekto`, `seekbackward`, `seekforward`.
  - Update `navigator.mediaSession.metadata` on every track switch.
  - Update `navigator.mediaSession.playbackState` on `YT.PlayerState` changes.

### 2.4 Offline Support & Equalizer Strategies
1. **Offline Download Handling**:
   - YouTube Terms of Service & Browser CORS explicitly prohibit scraping and saving raw YouTube audio streams directly into Cache API without an authorized server-side backend or PWA media cache.
   - **Recommended Solution**:
     - Provide **Offline Metadata Caching**: Save track info, lyrics, and thumbnails into `IndexedDB` / `localStorage` so the user's Library, Playlists, Liked Songs, and custom mixes are 100% accessible offline.
     - For tracks attempted to be played offline, present an informative indicator: "Offline Mode: Cached playlist metadata available. Connect to internet for YouTube streaming playback."
2. **Equalizer Handling**:
   - Since cross-origin iframes cannot be routed into Web Audio `BiquadFilterNode`, the Equalizer should:
     - Clearly notify the user: "Equalizer applies to local/direct audio streams. YouTube video playback uses native YouTube audio processing and volume leveling."
     - Alternatively, use software volume ducking and preamp gain emulation where applicable.

---

## 3. Component Interaction Flowchart

```mermaid
flowchart TD
    UserClick[User Clicks Play / Track] --> PlayStore[Zustand usePlayerStore]
    PlayStore -->|Sets currentTrack & state=playing| Bridge[UniversalAudioBridge]
    Bridge -->|Calls YT.Player.loadVideoById| YTPlayer[Visible YouTube IFrame Player]
    YTPlayer -->|onStateChange: PLAYING| StorePlaying[usePlayerStore: setPlaybackState('playing')]
    YTPlayer -->|onStateChange: ENDED| AutoNext[nextTrack triggered]
    AutoNext --> PlayStore
    Bridge --> MediaSession[navigator.mediaSession: metadata & action handlers]
    LockScreen[Lock Screen / Headphone button] --> MediaSession
    MediaSession -->|play/pause/next/prev| PlayStore
```
