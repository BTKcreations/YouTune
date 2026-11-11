# YouTune 🎵
> A high-fidelity, Spotify-inspired music streaming application powered by the YouTube IFrame Player API and YouTube Data v3.

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20TypeScript-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38b2ac.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ed.svg)](https://www.docker.com/)

---

## 🌟 Overview & Key Highlights

**YouTune** offers an authentic, premium music streaming experience combining the sleek, dark aesthetic of modern streaming platforms with YouTube's vast catalog of music tracks and official music videos:

- **Spotify-Inspired UI**: Dark theme, persistent bottom player, intuitive queue drawer, fluid navigation, and responsive layout for desktop and mobile.
- **YouTube IFrame Compliance**: Fully compliant with YouTube's Terms of Service and Developer Policies—playback is handled via the official embedded player with full video/artist attribution, without extracting raw audio streams.
- **Rich Music Discovery**: Curated genres, trending charts, artist profiles, personalized mixes, and instant search.
- **User Library & Playlists**: Custom playlist creation, track reordering, favorites/likes, and playback history tracking.
- **Instant Local Dev Mode**: Works immediately out-of-the-box with embedded fallback/mock music services if no `YOUTUBE_API_KEY` is provided, and SQLite fallback if PostgreSQL is not active.

---

## 🏗️ Architecture

```
                                  +-----------------------+
                                  |   React + Vite SPA    |
                                  | (TypeScript, Zustand, |
                                  |    Tailwind CSS)      |
                                  +-----------+-----------+
                                              |
                          REST API / JSON     |  Official IFrame API
                                              v
    +-----------------------------------------+-----------------------------------------+
    |                                         |                                         |
    v                                         v                                         v
+------------------------+        +------------------------+        +------------------------+
|    FastAPI Backend     |        |   YouTube IFrame SDK   |        |   PostgreSQL / SQLite  |
|  - Auth & JWT Service  |        | - Synced playback bar  |        | - User accounts        |
|  - YouTube Data Client |        | - Official mini-player |        | - Playlists & Tracks   |
|  - Music Discovery     |        | - Watermark & license  |        | - History & Favorites  |
|  - Playlists & Library |        +------------------------+        +------------------------+
+------------------------+
```

---

## 🚀 Getting Started

### Option 1: Docker Compose (Recommended for Production / Staging)

The quickest way to run the full stack with PostgreSQL, FastAPI backend, and Nginx-served frontend:

1. Clone or navigate to the repository:
   ```bash
   cd youtune
   ```

2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Fill in your `YOUTUBE_API_KEY` in `.env`. If left empty, the application automatically uses mock data.

3. Spin up the containers:
   ```bash
   docker-compose up --build
   ```

4. Open the application:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Backend Healthcheck**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### Option 2: Local Manual Setup (Development Mode)

#### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- *(Optional)* PostgreSQL (or default to local SQLite)

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend will be available at `http://localhost:8000`.

#### 2. Frontend Setup
```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 📜 YouTube Developer Terms of Service Compliance

YouTune is explicitly designed to operate within YouTube's Developer Policies:

1. **Official IFrame Playback**: Playback occurs exclusively through the official YouTube IFrame Player (`window.YT.Player`).
2. **No Stream Scraping**: The backend never downloads, scrapes, decodes, or separates audio streams (`.mp3`/`.opus`) from YouTube video streams.
3. **Attribution & Branding**:
   - Each playing track displays the official YouTube video title, channel name, and clickable external link to YouTube.
   - The embedded player maintains full YouTube branding, player controls, and policy overlays.
4. **Advertising & Monetization Integrity**: Native video ads rendered by the YouTube IFrame player are preserved without ad-blocking or tampering.

---

## 🔐 Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend listening port | `8000` |
| `DATABASE_URL` | Database connection string (Postgres or SQLite) | `sqlite+aiosqlite:///./youtune.db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Random string (set in `.env`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan in minutes | `60` |
| `YOUTUBE_API_KEY` | Google YouTube Data API v3 key | `""` *(uses fallback if blank)* |
| `YOUTUBE_CACHE_TTL_SECONDS` | In-memory cache duration for search queries | `3600` |
| `VITE_API_BASE_URL` | Frontend API endpoint URL | `http://localhost:8000/api/v1` |

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest tests/ -v
```

Run frontend build verification:
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License. Content and streams remain the property of their respective copyright holders on YouTube.
