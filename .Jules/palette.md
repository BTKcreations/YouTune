# Palette's Journal

## Critical UX & Accessibility Learnings

## 2026-11-13 - Accessible Media Player Controls
**Learning:** In persistent media players and bottom playback docks, media action controls (Play/Pause, Like/Save, Shuffle, Repeat, Queue, Volume Mute) frequently use icon-only buttons (`lucide-react`) without explicit `aria-label` attributes. Screen readers and assistive tools report them as unlabelled buttons or read ambiguous SVGs, and keyboard users lack clear accessible names when tabbing through the playback dock.
**Action:** Always provide explicit, dynamic `aria-label` and `aria-pressed`/`aria-live` attributes on media player controls to indicate state (e.g., `aria-label={playbackState === 'playing' ? 'Pause playback' : 'Start playback'}`).
