# Online edition

The stable local edition remains on GitHub `main` at `4c47c246ead21f31a09ca73e7ed8e1edc614c6af`. The online edition lives on `feature/global-highscores`, in a separate working folder, and publishes through the existing Sites project at playstunts.com.

## Original presentation

The original seven-row high-score table, time formatting, car/opponent columns and sixteen-character name entry remain intact. Browser file services provide the shared `.HIG` contents for both the track menu and results. Each complete 1,802-byte track has its own SHA-256 identity: filenames do not split a board, and terrain modifications do not share scores with the original track. Existing device-local scores are preserved and never imported into the global table automatically.

The game simulation, timing, controls, route penalties and replay functions are unchanged. A browser observer retains the complete input stream, including the original replay bank's 600-frame rollover. The server drives a fresh instance of the original simulation, with server-owned car and track resources, to verify the submitted finish time and derive its metadata. The original 30,000-tick race limit remains in force.

## Eligibility and limits

Normal clients retain an explicit replay-continuation marker, including continuation at the recording's end, where the original flag can remain eligible. Restart clears this marker. The endpoint rejects continued or replay-flagged submissions. Incomplete, crashed, fabricated-time or malformed recordings cannot verify a finishing time. Identical submissions are idempotent. Atomic D1 batches keep each named driver's best time per track/car, retaining seven drivers per car; the overall ranking selects each driver's fastest car and shows seven drivers.

Driver keys use the raw uncensored name, trimmed of surrounding spaces and ASCII-case-folded. They are not accounts. Unnamed runs use their canonical score IDs because independent anonymous racers cannot be identified reliably. Name changes can bypass grouping; identical names merge. Migration 0004 only adds the column and index; older rows resolve their names at read time without a bulk data rewrite. Ranking and replay queries hide superseded runs, and new submissions atomically prune their track's obsolete car records. Older runs already pruned by the previous seven-per-track rule cannot be recovered. Race results load a car-specific score file so a slower car can qualify independently; track selection loads the overall file.

This is not proof of human driving: a modified client can lie about which UI action was used, generate valid inputs, or choose another driver's name. Replay verification checks the race, not a person's identity. No accounts or new game screens have been introduced.

Submissions are limited to twenty per IP bucket per hour and track sharing to ten per day. Requests have bounded byte/input lengths. Expiring rate-limit keys are hashed; raw IP addresses are not stored. Driver names and score records are public. Normal score submission verifies replay bodies in memory; only explicit replay sharing stores a public recording.

## Website High Scores directory

Route categories are informational and never modify simulation, penalties or score eligibility. New submissions are classified server-side during the existing private replay verification; client labels are ignored. Sustained all-wheel grass travel between non-neighbouring road sections can prove a shortcut. Brief excursions, small corner cuts, mixed curb contact, normal jumps and ambiguous footprints do not prove one. Full-route classification instead requires positive coverage of ordered original geometric gates along a complete directed start/finish path; an unused fork is not required. Stunt navigation vectors that lack execution geometry cannot certify a full route, so those cases remain Unassessed. This conservative detector does not recognise every possible shortcut or certify every legitimate lap.

The public exploit label is **Shortcuts / exploits**. Exclusive arms of each route fork identify dual-way switches, including short transfers between arms near the fork. Other grass shortcuts need a substantial route-distance saving; parallel travel and small cuts on the same section are not labelled from duration alone. The grass-speed check requires two seconds of near-ceiling top-gear grass travel with repeated negative-force/positive-acceleration wraparound evidence from this edition's actual engine arithmetic. High-speed landings, ordinary deceleration, curb contact and downhill gravity alone do not establish that exploit. Suspicious but inconclusive high-speed grass travel cannot earn Full route classification.

Migration 0005 adds only the constant-default route category; existing scores remain Unassessed. Each category retains seven named drivers per car independently, so a quicker shortcut cannot erase that driver's full-route time. The unchanged in-game table combines categories using each driver's fastest time. Historical runs already pruned under former retention rules cannot be restored. Unassessed means the route is inconclusive, not that the finish time failed server validation. Public replay sharing remains opt-in and importing an RPL does not add a score.

Before results name entry, the private replay is assessed using the score endpoint's score-read-only `validateOnly` mode, then the browser loads the matching car/category table. This prevents faster exploit times from blocking a slower Full route qualifier. Track selection still uses the combined table. Offline or unavailable assessment may queue a finish for later server verification; the browser never assigns a confirmed category itself. Assessment has its own bounded request bucket, separate from the twenty-score hourly limit. Sharing an already accepted replay re-assesses its existing score without creating a new score.

`/high-scores` reads the same current-rule top-seven car records as the game through `/api/leaderboards`. Driver, car, time, opponent metadata, posting date, track identity and public replay availability are displayed. Bundled track names are resolved by exact content hash; accepted new custom tracks retain their original label in `score_tracks`. Older unknown custom boards use a short hash label rather than inventing a filename.

Search and sorting run on the server. Requests return at most twelve track boards plus global counts; Load more tracks fetches the next page rather than downloading every score upfront. An open, visible page refreshes hourly, on return/focus, or through Refresh scores. This is a fresh database read, not a manually maintained page or scheduled publishing task.

Public names are filtered for common English/Norwegian profanity and basic obfuscation, with checks against innocent substring matches. The directory and shared-replay listings mask such names; public game score files use ASCII asterisks. Stored proof bytes and canonical IDs are not altered. This heuristic is not an exhaustive multilingual moderation system.

## Offline and personal files

`stunts-global-highscores` is a separate browser database containing cached boards, pending submissions and accepted replay proofs. Network failures preserve pending records across reloads; rejected records are removed from the queue. Global score sync does not overwrite `stunts-native-files` `.HIG` data. Tracks, replays and supported JSON backups remain personal unless the player explicitly selects Share track or Share replay.

## Opt-in high-score replays

After accepting a ranked score, the browser retains its proof under `VERIFIED:<canonical score id>`. The webpage's High-score replays panel offers Share replay; normal score submission never publishes the recording. `/api/replays` re-verifies the proof and requires its canonical id to exist in the current top seven per car. Only then is the canonical, complete recording stored in the `shared_replays` table. No arbitrary replay upload can be attached to a different score.

Public listings show driver, exact track identity, track label, car and time. Downloads retain the recorded inputs and embed the track; safe hash-derived DOS aliases avoid replacing personal files. Add replay to my game installs both files before game startup, and playback uses Options → Load Replay in the unchanged original viewer. Its existing 12,000-frame limit remains: longer proofs may qualify for scores, but cannot be published as watchable replays and are never silently truncated. Public replays are removed when the associated score drops out of the top seven per car; the webpage lists the latest 50 shared runs. Sharing is rate-limited and idempotent.

Personal imports validate DOS filenames and original track/replay fields. Backups permit only validated `.TRK`, `.RPL`, 364-byte `.HIG`, and bounded text `SETUP.DAT` records. Unsupported extensions, malformed data, executable/resource payloads and replay trailing bytes are rejected. MIME types are not used as proof of binary format.

## Community tracks

Share track accepts original `.TRK` bytes only and requires a valid original start and complete route. The server validates file fields and analyzes the route before storing it. Identical content deduplicates across filenames. Other players can download the original bytes or add them to their private native game drive; conflicting local filenames are renamed without overwriting files. All shared tracks automatically use the same global-score integration.

## Storage and deployment

D1 binding `DB` owns `global_scores`, `shared_tracks`, `shared_replays`, `score_tracks`, and `score_requests`. Migrations are in `drizzle/`; apply them locally with Wrangler `d1 execute --local --persist-to .wrangler/state` using the built config. Sites applies hosted migrations when publishing. The production-preview command uses that same local persistence directory. `ASSETS` supplies immutable original physics resources; deployment does not use direct Wrangler publishing.

Run `npm run test:rankings` for ranking, migration, native car-qualification and static CRT checks. With a local preview running, `node tools/test_car_leaderboard_http.ts http://localhost:3002` checks real score replacement against isolated D1. `tools/seed_ranking_preview.ts` inserts a clearly labelled DESIGN DEMO into local D1 only; these illustrative times are not verified races and must never be copied into production. Rebuild before restarting the preview server; rebuilding while Wrangler serves the previous asset manifest can cause temporary missing assets.

Tests cover native finished races, genuine races longer than ten minutes, replay-end continuation and Restart, incorrect times, offline persistence, simultaneous independent submissions, idempotency, terrain identity, shared-track deduplication/downloads, and upload restrictions. Production smoke verification uses `validateOnly: true` on the score endpoint to check a real generated race without inserting test scores.
