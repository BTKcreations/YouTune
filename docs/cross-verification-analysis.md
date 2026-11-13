# YouTune Comprehensive Feature & Functionality Cross-Verification Matrix

Date: 2026-11-13
Scope: Full front-to-back cross-verification of all pages, features, state stores, and user workflows.

---

## Page-by-Page Feature Audit & Verification Results

| Page / Route | Stated Capabilities | Current Verification Status | Discovered Gaps / Issues |
| :--- | :--- | :---: | :--- |
| **Home (`/`)** | Hero Daily Rec, Recently Played tracking, Dynamic discovery sections, Play/Pause. | 🟡 Partially Working | • Top banner says "Pure HTML5 Audio" while playback is actually driven by YouTube IFrame SDK.<br>• If search API fails or is slow, hero recommendation falls back silently without an error/retry skeleton. |
| **Search (`/search`)** | Debounced query, Filter pills (all, tracks, artists, playlists), Results grid, Direct play. | 🟡 Partially Working | • Clicking artist cards navigates to `/artist/:id`, but if no backend is running, `api.getArtist` only checks static mock artists.<br>• Filter pills work for tracks, but external YouTube playlists do not populate track rows when clicked. |
| **Discover (`/discover`)** | Regional trending charts (US, GB, GLOBAL, JP, KR, BR), Related artists, Categories. | 🟡 Partially Working | • Switching region triggers `api.getTrendingTracks(selectedRegion)` which returns fallback `MOCK_TRACKS` if backend isn't running, making region tabs feel unresponsive in standalone mode. |
| **Explore (`/explore`)** | Genre & mood grid, Card click navigation. | 🔴 Gap Identified | • Clicking any genre card navigates to `/search?q=...` instead of the rich dedicated `/genre/:genreId` page (`Genre.tsx`), leaving that entire detailed page unreachable! |
| **Genre Detail (`/genre/:genreId`)** | Curated track list, genre hero, color themes, Play All. | 🔴 Unlinked / Dead Route | • Fully built with rich UI, but never linked to from the Explore page. |
| **Artist Page (`/artist/:id`)** | Verified banner, Follow/Following state, Popular tracks list, Play All. | 🟡 Partially Working | • Follow state persists to `useLibraryStore`, but top tracks are hardcoded to mock list unless backend endpoint is reachable. |
| **Playlist Detail (`/playlist/:id`)** | Custom playlist title, track count, delete playlist, remove track, Play All. | 🟢 Working as Intended | • Tracks play in sequence, deletion works, track removal works, Zustand localStorage persistence verified. |
| **Your Library (`/library`)** | Tabs: Playlists, Liked Songs, Downloaded (Offline), Artists, History. | 🟢 Working as Intended | • Verified offline download tab with CORS-safe base64 thumbnails.<br>• Play all, liked track toggling, and history clearance verified. |
| **Settings (`/settings`)** | Display name, Preferred song languages, Genre preferences, Reset onboarding. | 🟢 Working as Intended | • Updates persist immediately into `usePreferencesStore` and trigger toast notification. |
| **Now Playing Modal** | Synchronized lyrics, 10-Band EQ presets, Sleep Timer, Download button. | 🟢 Working as Intended | • Lyrics sanitized and multi-tier fallbacks active.<br>• Sleep timer countdown and auto-fade verified. |
| **Queue Drawer** | Queue count, now playing item, clear queue, remove item. | 🟡 Minor Gap | • No visual drag-and-drop or reorder handle in the queue list. |
| **Bottom Player Dock** | Play/Pause, Seek bar, Volume slider, Mute, Repeat, Shuffle, Video preview toggle. | 🟢 Working as Intended | • All ARIA labels and focus rings verified; persistent watchdog auto-advances tracks. |

---

## Key Anomalies & Corrective Plan

1. **Dead Link to Dedicated Genre Page (`GenreExplorer.tsx`)**:
   - `GenreExplorer.tsx` line 35 currently routes to `/search?q=...` instead of `/genre/${genre.id}`. The dedicated `Genre.tsx` page with hero artwork, custom color gradient, and track list is effectively orphaned.
   - **Fix**: Update `GenreExplorer.tsx` to navigate directly to `/genre/${genre.id}` and update `api.getGenreDetails()` to use `ClientMusicService` so it fetches real YouTube tracks dynamically when no backend is running.

2. **Discover Page Region Switching in Standalone Mode (`Discover.tsx`)**:
   - In standalone mode (GitHub Pages), selecting UK, Japan, or South Korea was returning static US mocks.
   - **Fix**: Wire `ClientMusicService.getTrendingByRegion(selectedRegion)` so regional trending actually yields distinct YouTube music results.

3. **TrackRow Actions ("Add to Queue" & "Add to Playlist")**:
   - Currently, clicking anywhere on a track row triggers full queue replacement.
   - **Fix**: Add a lightweight 3-dot dropdown menu allowing users to choose **Play Now**, **Play Next**, **Add to Queue**, or **Add to Playlist**.
