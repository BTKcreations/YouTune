# YouTune - System Architecture & API Contracts Specification

## 1. System Architecture Overview

YouTune is a full-featured music streaming web platform powered by the YouTube IFrame API and YouTube Data v3 / InnerTube discovery services, wrapped in a high-fidelity Spotify-inspired user interface.

```
+-------------------------------------------------------------------------------+
|                                  Frontend                                     |
|             (React 18 + Vite + TypeScript + Tailwind CSS + Zustand)           |
|                                                                               |
|  [Sidebar Navigation]  [Header / Search]  [Main Content Area]  [Right Drawer] |
|   - Home / Explore      - Search input     - Dynamic Route      - Queue       |
|   - Library             - Filter Chips     - Grid / Tracklist   - Lyrics/Info |
|                                                                               |
|  ---------------------------------------------------------------------------  |
|  [Persistent Bottom Player]                                                   |
|   - Track metadata / Cover / Like button                                      |
|   - Controls: Play/Pause, Seek bar, Prev/Next, Shuffle, Repeat                |
|   - Embedded Official YouTube IFrame Player (Hidden/Synced or Picture-in-Pic) |
|   - Volume / Mute, Fullscreen / Mini-player toggle                            |
+-------------------------------------------------------------------------------+
                                      |
                            REST API / JSON
                                      v
+-------------------------------------------------------------------------------+
|                                  Backend                                      |
|                   (Node.js / Express / Fastify + TypeScript)                 |
|                                                                               |
|  [Auth Middleware (JWT)]       [Cache Layer (In-memory / Redis fallback)]     |
|  [YouTube Service (v3/Inner)]  [Music Discovery Engine]                       |
|  [Playlists & Library Service] [User History & Favorites Engine]              |
|                                                                               |
|                                   ORM Layer                                   |
|                          (Prisma / SQLite / Postgres)                         |
+-------------------------------------------------------------------------------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
                    v                                   v
             [YouTube Data API]                  [(Database)]
             [InnerTube / YT Music]             SQLite / Postgres
```

---

## 2. YouTube Compliance & Player Rules

> [!IMPORTANT]
> To comply strictly with YouTube Developer Policies and Terms of Service:
> 1. **Official IFrame Player**: Audio playback must occur strictly through the official YouTube IFrame Player (`YT.Player`). Direct streaming or downloading of `.mp3`/`.mp4` raw streams is strictly forbidden.
> 2. **Visual Attribution & Visibility**:
>    - The embedded YouTube player must maintain its official watermarks and controls accessibility.
>    - When minimized into the bottom bar, a mini-video canvas or synchronized popover must be provided so video attribution is available.
>    - Clear attribution with artist/channel title and link to original YouTube video must be visible.
> 3. **Ad & Royalty Compliance**:
>    - Native ads rendered by the YouTube IFrame player must not be blocked or altered.
>    - Background audio-only playback on mobile browsers should comply with iframe visibility rules.

---

## 3. Project Directory Structure

```
youtune/
├── architecture.md           # This document
├── schema.md                 # Database schema design & Prisma definition
├── backend/
│   ├── src/
│   │   ├── config/           # Environment & constants
│   │   ├── controllers/      # Route handlers (auth, tracks, playlists, etc.)
│   │   ├── middleware/       # JWT auth, error handling, validation
│   │   ├── routes/           # Express router registrations
│   │   ├── services/         # YouTube service, playlist service, cache service
│   │   ├── types/            # Re-exports / backend-specific types
│   │   ├── db/               # Prisma client / SQLite database connection
│   │   └── app.ts            # Server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Prisma data schema
│   ├── tests/                # Integration & unit test suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── assets/           # Logos, default covers, icons
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, Header, PlayerBar, MobileNav
│   │   │   ├── player/       # YouTubePlayer (IFrame wrapper), Controls, Volume
│   │   │   ├── tracks/       # TrackRow, TrackGrid, TrackCard
│   │   │   ├── playlist/     # PlaylistHeader, TrackList, CreateModal
│   │   │   └── ui/           # Buttons, Sliders, Dropdowns, Skeletons, Modals
│   │   ├── pages/            # Home, Search, Library, PlaylistDetail, Artist
│   │   ├── stores/           # Zustand: usePlayerStore, useAuthStore, useLibraryStore
│   │   ├── services/         # Axios / Fetch API client
│   │   ├── types/            # music.ts, api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 4. REST API Endpoint Specifications

Base URL: `/api/v1`

### 4.1. Authentication (`/auth`)
- `POST /auth/register`
  - Body: `{ email, username, password }`
  - Returns: `{ success: true, data: { user, tokens } }`
- `POST /auth/login`
  - Body: `{ email, password }`
  - Returns: `{ success: true, data: { user, tokens } }`
- `GET /auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, data: UserProfile }`

### 4.2. Tracks & YouTube Streaming / Metadata (`/tracks`)
- `GET /tracks/search?q={query}&type={track|artist|playlist}&pageToken={token}&limit={limit}`
  - Searches YouTube Music / YouTube Data API.
  - Returns: `{ success: true, data: SearchResult }`
- `GET /tracks/:youtubeId`
  - Retrieves track details, duration, high-res thumbnail, channel metadata.
  - Returns: `{ success: true, data: Track }`
- `GET /tracks/trending?genre={genre}&limit={20}`
  - Fetches top trending music tracks / charts.
  - Returns: `{ success: true, data: Track[] }`
- `GET /tracks/:youtubeId/related`
  - Fetches auto-play recommendation queue based on the current track.
  - Returns: `{ success: true, data: Track[] }`

### 4.3. Playlists (`/playlists`)
- `GET /playlists`
  - Retrieves current user's created and saved playlists.
  - Returns: `{ success: true, data: Playlist[] }`
- `POST /playlists`
  - Body: `{ title, description, isPublic }`
  - Returns: `{ success: true, data: Playlist }`
- `GET /playlists/:id`
  - Returns detailed playlist with ordered tracks.
  - Returns: `{ success: true, data: Playlist }`
- `PUT /playlists/:id`
  - Body: `{ title, description, isPublic, coverUrl }`
  - Returns: `{ success: true, data: Playlist }`
- `DELETE /playlists/:id`
  - Deletes playlist.
- `POST /playlists/:id/tracks`
  - Body: `{ track: Track, position?: number }`
  - Appends or inserts a track into the playlist.
- `DELETE /playlists/:id/tracks/:trackId`
  - Removes a track from the playlist.
- `PUT /playlists/:id/tracks/reorder`
  - Body: `{ trackIds: string[] }`
  - Updates track order index.

### 4.4. Library, Likes & History (`/library`)
- `GET /library/likes`
  - Returns list of liked tracks.
- `POST /library/likes/:youtubeId`
  - Body: `{ track: Track }`
  - Likes a track.
- `DELETE /library/likes/:youtubeId`
  - Unlikes a track.
- `GET /library/history`
  - Returns recently played tracks (last 50).
- `POST /library/history`
  - Body: `{ track: Track }`
  - Logs track play event for recommendations and history page.

### 4.5. Artists & Genres (`/explore`)
- `GET /explore/genres`
  - Returns available music categories & genre cards.
- `GET /explore/artists/:id`
  - Returns artist details, top tracks, and albums.
