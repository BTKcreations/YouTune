# User Workflow Analysis: YouTune 🎵

## 1. Primary User Journeys

### Journey 1: Music Discovery to Continuous Playback

```mermaid
flowchart TD
    A[Launch App / Home Feed] --> B{First Time User?}
    B -- Yes --> C[Complete Onboarding: Genres & Artists]
    B -- No --> D[Browse Trending / Curated Mixes]
    C --> D
    D --> E[Click Track Card or Play All]
    E --> F[Load YouTube IFrame Stream]
    F --> G[Bottom Player Dock Appears]
    G --> H[Sync MediaSession to Lock Screen]
    H --> I[Track Ends -> Auto Advance to Next Queue Item]
    I --> J{Queue Empty?}
    J -- Yes --> K[Trigger Smart Radio to fetch similar tracks]
    J -- No --> G
    K --> G
```

- **Observed Friction**:
  - When the user clicks play on an isolated track from Search or an album, if the queue isn't pre-populated, the track plays alone and auto-advance halts unless Smart Radio is toggled on.
  - Video loading spinner in the bottom dock can occasionally obscure track metadata while buffering.

---

### Journey 2: Search, Filter, and Queue Management

```mermaid
flowchart TD
    A[Click Search in Nav] --> B[Enter Query in Search Box]
    B --> C[Debounced Client / API Search]
    C --> D[Display Results: Songs, Artists, Playlists]
    D --> E{User Action}
    E -- Play Now --> F[Replace Queue & Start Playback]
    E -- Add to Queue --> G[Append Track to QueueDrawer]
    E -- Like Track --> H[Persist to Liked Songs Store]
    G --> I[Open Queue Drawer: Reorder / Remove Items]
```

- **Observed Friction**:
  - Clicking a song directly in search results currently replaces the active playback context instead of prompting or asking whether to enqueue next or replace the current session.
  - Adding tracks to custom playlists from track rows requires navigating through multiple nested menu interactions on mobile screens.

---

### Journey 3: Offline Download and Playback

```mermaid
flowchart TD
    A[Now Playing View / Track Row] --> B[Click Download Button]
    B --> C[Fetch Audio/Metadata Stream]
    C --> D{CORS / Network Error?}
    D -- Yes --> E[Show Error / Fallback Notification]
    D -- No --> F[Store in IndexedDB via idb]
    F --> G[Badge Track as Downloaded in Library]
    G --> H[Offline Mode: Play directly from IndexedDB Blob]
```

- **Identified Workflow Gaps**:
  - Direct thumbnail image fetches from third-party CDN domains (e.g. `yt.chocolatemoo53.com`) can encounter CORS blocks if not routed through reliable proxy fallback URLs.
  - No clear visual banner or offline switch in the top navbar alerting the user when their internet connection drops, though PWA assets are cached.

---

### Journey 4: Audio Customization (Equalizer, Lyrics, Sleep Timer)

```mermaid
flowchart TD
    A[Bottom Player Dock] --> B[Click Expand / Now Playing Modal]
    B --> C[Tab 1: Synced LRC Lyrics with Autoscroll]
    B --> D[Tab 2: 10-Band EQ Controls & Presets]
    B --> E[Tab 3: Sleep Timer Countdown]
    C --> F{Lyrics Available on LRCLIB?}
    F -- No --> G[Display Clean Fallback Message]
    F -- Yes --> H[Highlight active line synced with currentTime]
    E --> I[Set 15/30/45/60 min timer]
    I --> J[Auto-fade audio volume and pause at 00:00]
```

- **Identified Bottlenecks**:
  - WebAudio API context creation requires an un-tainted audio element; when YouTube IFrame cross-origin restrictions apply, EQ adjustments may be bypassed to avoid audio silence.

---

## 2. Summary of Identified UX & Workflow Opportunities

| Opportunity | Workflow Stage | User Impact | Priority |
| :--- | :--- | :--- | :--- |
| **Play Next vs Replace Queue** | Search & Library | Prevents accidentally blowing away an active 20-song listening queue. | **P1** |
| **Visual Offline Mode Toggle** | Library / TopBar | Clearly shows which tracks are ready to listen without internet. | **P1** |
| **Contextual Menu on Mobile** | TrackRow | Long-press or 3-dot bottom sheet for faster playlist addition. | **P2** |
| **Persistent Volume Memory** | BottomPlayer | Restores last volume and mute state seamlessly across sessions. | **P2** |
| **Lyrics Search Fallback Refinement** | NowPlayingModal | Normalizes track titles (strips `(Official Video)`, `8K`, `HD`) before querying LRCLIB. | **P1** |
