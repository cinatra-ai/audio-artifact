# Audio

The system audio player for the Cinatra artifact library. It renders any audio file — MP3, M4A, Ogg, WAV, WebM, FLAC, or AAC — inline with a native playback control, so recordings, voice notes, generated speech, and other `audio/*` content play directly in the artifact detail view without leaving the app.

Install from the Cinatra marketplace by searching for "Audio" and clicking **Add**. No credentials or configuration are required; the artifact is active immediately for all workspace members. Any audio file in the library opens with a standard transport — play, pause, seek, and volume. Playback streams the file with range requests, so seeking is responsive and only the header bytes are fetched up front to show the duration. Nothing plays until you press play. If a recording has no available preview yet, the player shows a short notice and, where possible, a download link, so the detail view is never blank.

## Works with

- Cinatra chat — attach an audio file directly in any thread
- The artifact library — open any `audio/*` item to listen inline

## Capabilities

- Play any `audio/*` file inline with a native transport
- Seek responsively via HTTP range requests, with metadata-only preload
- Download the original file
- Degrade to a clear notice when a preview is unavailable, never a blank view
