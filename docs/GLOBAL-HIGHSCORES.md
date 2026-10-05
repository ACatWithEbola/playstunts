# Online edition

The stable local edition remains on GitHub `main` at `4c47c246ead21f31a09ca73e7ed8e1edc614c6af`. The online edition lives on `feature/global-highscores`, in a separate working folder, and publishes through the existing Sites project at playstunts.com.

## Original presentation

The original seven-row high-score table, time formatting, car/opponent columns and sixteen-character name entry remain intact. Browser file services provide the shared `.HIG` contents for both the track menu and results. Each complete 1,802-byte track has its own SHA-256 identity: filenames do not split a board, and terrain modifications do not share scores with the original track. Existing device-local scores are preserved and never imported into the global table automatically.

The game simulation, timing, controls, route penalties and replay functions are unchanged. A browser observer retains the complete input stream, including the original replay bank's 600-frame rollover. The server drives a fresh instance of the original simulation, with server-owned car and track resources, to verify the submitted finish time and derive its metadata. The original 30,000-tick race limit remains in force.

## Eligibility and limits

Normal clients retain an explicit replay-continuation marker, including continuation at the recording's end, where the original flag can remain eligible. Restart clears this marker. The endpoint rejects continued or replay-flagged submissions. Incomplete, crashed, fabricated-time or malformed recordings cannot verify a finishing time. Identical submissions are idempotent; D1 batches merge individual runs and retain the fastest seven per track without uploading/replacing whole tables.

This is not proof of human driving: a modified client can lie about which UI action was used, generate valid inputs, or choose another driver's name. Replay verification checks the race, not a person's identity. No accounts or new game screens have been introduced.

Submissions are limited to twenty per IP bucket per hour and track sharing to ten per day. Requests have bounded byte/input lengths. Expiring rate-limit keys are hashed; raw IP addresses are not stored. Driver names and score records are public. Replay bodies are verified in memory and are not retained in the database.

## Offline and personal files

`stunts-global-highscores` is a separate browser database containing cached boards and pending submissions. Network failures preserve pending records across reloads; rejected records are removed from the queue. Global score sync does not overwrite `stunts-native-files` `.HIG` data. Tracks, replays and supported JSON backups remain personal unless the player explicitly selects Share track.

Personal imports validate DOS filenames and original track/replay fields. Backups permit only validated `.TRK`, `.RPL`, 364-byte `.HIG`, and bounded text `SETUP.DAT` records. Unsupported extensions, malformed data, executable/resource payloads and replay trailing bytes are rejected. MIME types are not used as proof of binary format.

## Community tracks

Share track accepts original `.TRK` bytes only and requires a valid original start and complete route. The server validates file fields and analyzes the route before storing it. Identical content deduplicates across filenames. Other players can download the original bytes or add them to their private native game drive; conflicting local filenames are renamed without overwriting files. All shared tracks automatically use the same global-score integration.

## Storage and deployment

D1 binding `DB` owns `global_scores`, `shared_tracks`, and `score_requests`. Schema-only migrations are in `drizzle/`; apply them locally with Wrangler `d1 execute --local --persist-to .wrangler/state` using the built config. Sites applies hosted migrations when publishing. The production-preview command uses that same local persistence directory. `ASSETS` supplies immutable original physics resources; deployment does not use direct Wrangler publishing.

Tests cover native finished races, genuine races longer than ten minutes, replay-end continuation and Restart, incorrect times, offline persistence, simultaneous independent submissions, idempotency, terrain identity, shared-track deduplication/downloads, and upload restrictions. Production smoke verification uses `validateOnly: true` on the score endpoint to check a real generated race without inserting test scores.
