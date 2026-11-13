# Feature Proposals & Enhancement Specifications: YouTune 🎵

## Proposal 1: Resilient Lyrics Query Sanitization & Multi-Provider Fallback
- **Priority**: **P0 (Critical)**
- **Current Implementation**:
  - `lyricsService.ts` calls `https://lrclib.net/api/get` with raw YouTube video titles (e.g. `track_name=Neeli+Meghamula+lo+Full&artist_name=Aditya&duration=314`).
  - YouTube titles often contain noise like `(Full Video)`, `8K`, `Official Song`, `Lyrical Video`, `4K Remastered`, leading to 404 responses from LRCLIB.
- **Proposed Change**:
  - Implement a clean regex sanitizer that removes common YouTube tags (`[Official Video]`, `(Lyrics)`, `HD`, `8K`, `Full Song`, `Feat. ...`).
  - Add secondary fallback query using title-only fuzzy search `/api/search?q=...` if exact match with duration returns 404.
  - Suppress console error noise on 404s by catching not-found responses cleanly and displaying an unobtrusive empty state in `NowPlayingModal`.
- **Expected Benefit**: Increases lyrics match rate by an estimated ~60% across non-Western and soundtrack tracks while eliminating console 404 spam.
- **Affected Modules**: `frontend/src/services/lyricsService.ts`, `frontend/src/components/player/NowPlayingModal.tsx`.
- **Effort**: Low (approx. 25-35 lines).

---

## Proposal 2: Intelligent Queue Management ("Play Next" vs "Replace Queue")
- **Priority**: **P1 (High)**
- **Current Implementation**:
  - Clicking any track in Search or Discover automatically calls `playTrack()`, replacing the user's active queue.
- **Proposed Change**:
  - Add contextual actions to TrackRow and MusicCard hover/actions:
    1. **Play Now** (replaces queue with this track + recommended context)
    2. **Play Next** (inserts directly after currently playing song)
    3. **Add to Queue** (appends to end of current queue)
- **Expected Benefit**: Prevents frustrating accidental loss of curated queues and aligns with Spotify / Apple Music standard expectations.
- **Affected Modules**: `frontend/src/stores/usePlayerStore.ts`, `frontend/src/components/common/TrackRow.tsx`, `frontend/src/components/player/QueueDrawer.tsx`.
- **Effort**: Medium.

---

## Proposal 3: Native Offline Mode & Filtered Offline Library View
- **Priority**: **P1 (High)**
- **Current Implementation**:
  - Offline downloads are stored in IndexedDB via `offlineStorageService.ts`, but the Library page doesn't offer a quick filter for "Downloaded Only".
  - CORS errors can trigger on external CDN thumbnail requests.
- **Proposed Change**:
  - Add a dedicated "Downloaded Songs" tab/filter in `Library.tsx`.
  - Cache song thumbnail base64 data directly inside the IndexedDB record alongside the audio blob to eliminate external network image requests during offline playback.
  - Provide an offline status indicator banner when `navigator.onLine === false`.
- **Expected Benefit**: Seamless experience during flights, commutes, or connectivity dropouts.
- **Affected Modules**: `frontend/src/pages/Library.tsx`, `frontend/src/services/offlineStorageService.ts`.
- **Effort**: Medium.

---

## Proposal 4: Playback Bridge Consolidation & Dead Code Cleanup
- **Priority**: **P2 (Medium)**
- **Current Implementation**:
  - The repository has `UniversalAudioBridge.tsx`, `YouTubePlayerBridge.tsx`, and `HTML5AudioBridge.tsx`.
  - `UniversalAudioBridge` is the active master controller, leaving the other two partially redundant.
- **Proposed Change**:
  - Formalize `UniversalAudioBridge` as the single canonical player bridge.
  - Archive or remove deprecated bridge wrappers to reduce maintenance confusion and bundle overhead.
- **Expected Benefit**: Cleaner codebase, faster onboarding for new contributors, zero dead code paths.
- **Affected Modules**: `frontend/src/components/player/`.
- **Effort**: Low.

---

## Proposal 5: Audio Crossfade & Gapless Transition Simulation
- **Priority**: **P3 (Future Enhancement)**
- **Current Implementation**:
  - Tracks switch abruptly when auto-advance watchdog triggers next track loading.
- **Proposed Change**:
  - Implement a 2-second volume fade-out before track conclusion and smooth fade-in on start of the subsequent track.
- **Expected Benefit**: Polished DJ-like listening continuity.
- **Affected Modules**: `frontend/src/stores/usePlayerStore.ts`, `frontend/src/components/player/UniversalAudioBridge.tsx`.
- **Effort**: Medium.
