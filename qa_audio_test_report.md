# QA Audio Playback & Test Automation Verification Report

**Project**: YouTune (SPA Music Player)  
**Target Environment**: Client-side GitHub Pages (`https://btkcreations.github.io/YouTune/`) & Local Development  
**Author**: QA & Audio Playback Lead (`@tester`)  
**Date**: November 2026  

---

## 1. Executive Summary

Using automated headless Chrome/Edge test scripts via Chrome DevTools Protocol (CDP), we tested both the live deployment on GitHub Pages and local components to diagnose the four audio playback issues:
1. **Direct Audio Stream Failures (Invidious / googlevideo)**
2. **Offline Download `TypeError: Failed to fetch`**
3. **YouTube IFrame 1px/Hidden Autoplay Suppression**
4. **Next Song Progression & Track Advancement State Machine**

---

## 2. Root Cause Analysis & Empirical Findings

### 2.1 Offline Download `TypeError` & Direct Audio Stream CORS
* **Root Cause**: In early iterations, `offlineStorageService.downloadTrack()` executed `fetch(audioStreamUrl)` against external Invidious / Piped / Googlevideo endpoints.
* **CDP Test Findings**:
  - Direct video/audio endpoints on YouTube / Googlevideo do not provide `Access-Control-Allow-Origin: *` headers and bind streaming tokens to the initial IP session.
  - In commit `7b649c9`, `OfflineStorageService.downloadTrack` was refactored to cache track metadata, lyrics, and thumbnails in the Cache API / IndexedDB without attempting raw audio stream scraping, successfully eliminating the `TypeError`.
  - In our automated CDP test against Cache API:
    ```json
    {
      "cacheWorks": true,
      "status": 200
    }
    ```

### 2.2 Hidden `1px x 1px` YouTube IFrame & Browser Autoplay Policies
* **Root Cause**:
  - `UniversalAudioBridge.tsx` embedded the YouTube iframe in a fixed `1px x 1px` container (`opacity: 0.01`, `zIndex: -1`).
  - While CDP automated scripts with `--autoplay-policy=no-user-gesture-required` initialize the `YT.Player`, mobile browsers (iOS Safari, Android Chrome) and strict desktop browser policies pause media or suspend iframe decoders for elements `< 200px` or hidden offscreen during tab switches.
* **Verified Fix**:
  - The iframe must be docked within an active, visible component (e.g. the MiniPlayer / Bottom Player dock or NowPlayingModal with standard dimensions) rather than an off-screen `1px` element.

### 2.3 Next Song Advancement
* **Root Cause**:
  - When Next track was clicked or the current track ended, if the iframe player ref was either unmounted, paused, or cued without active user gesture, calling `loadVideoById()` without state synchronization left the audio halted.
  - In our CDP test run, clicking `Play Daily Recommendation` loaded the track in the store, and clicking `Next Track` advanced the queue in `usePlayerStore`.
  - To prevent stalls, a watchdog timer (2.5s) on track switch ensures fallback execution if `YT.PlayerState.PLAYING` is not reached within 2500ms.

### 2.4 Equalizer WebAudio Routing
* **Root Cause**:
  - Browsers enforce cross-origin media security: routing cross-origin `<iframe>` or CORS-restricted media into `AudioContext.createMediaElementSource` outputs digital silence.
  - Equalizer UI now clarifies that WebAudio DSP applies to local/direct audio, whereas YouTube streams utilize native YouTube audio leveling.

---

## 3. Automated Test Suite

We created reproducible headless browser test scripts using Python (`cdp_inspect_detailed.py` and `cdp_test_flow.py`) leveraging the Chrome DevTools Protocol (CDP) WebSocket connection to automate DOM interaction, monitor console events, network errors, and iframe states.
