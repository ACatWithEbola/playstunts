# MS91 release verification checklist

Baseline: 2026-10-11. Scope: complete February25,1991 future-race upgrade,
legacy playback, unchanged stored scores/replays, working site, safe release.
50 fixed acceptance items;30 verified,20 open;60% verified. This is an item
count, not a time estimate: items have unequal effort. No production release.
Newly discovered acceptance requirements must be disclosed and added openly,
not silently excluded to preserve the denominator. An item needs evidence at
its stated scope; an implemented feature or attempted check does not count.

## Initial verified baseline (22)

Evidence details and limitations: MS91-CURRENT-RELEASE-STATUS.md and
BB11-COMPATIBILITY-RELEASE-GATE.md. Each row deliberately bounds its claim.

1. [x] Explicit engine identity; untagged recordings retain legacy identity.
2. [x] Versioned route/opponent resources survive allocated engine switching.
3. [x] All11-car bounded original engine/grip/contact corpus (33 cases).
4. [x] Original10/20Hz steering lookup table comparison.
5. [x] Original previous-position body-cache initialization and signed codec.
6. [x] Versioned checkpoint capacity/allocation/growth preserves input memory.
7. [x] Legacy1072/modern1120-byte snapshot serialization round-trips.
8. [x] Modern checkpoint capture/reset/restore retains both body caches.
9. [x] Five complete original MS91 player captures match10893 frames.
10. [x] Six original opponent captures match15336 frames, including both caches.
11. [x] Integrated original movement comparison,11cars/88roll cases/55crashes.
12. [x] Integrated original tunnel-height comparison,11cars/55cases/33crashes.
13. [x] Original underside288-case guard and tunnel1054-case selection comparison.
14. [x] Four-reference allocated growth/load/failure recovery and cross-engine playback.
15. [x] Genuine Marco legacy original-loop playback,2358frames including divider interval.
16. [x] Isolated0011 migration preserves all nine historical tables.
17. [x] Four-reference private save/backup/restore/reload lifecycle.
18. [x] Copy-only engine-labelled downloads preserve canonical recordings.
19. [x] Preview import lifecycle preserves cadence/identity; invalid normal imports reject.
20. [x] Renderer corpus, both policies/four finishes/222samples, unchanged simulation.
21. [x] Ranking/consent/offline queue/scoped legacy-retention regressions.
22. [x] Broad automated graphics/audio/replay/wall/setup regression suite.

## Remaining baseline items (status updated individually)

23. [x] Complete chassis exceptional/transitive branch difference classification. (Detailed23–25; original-capture acceptance recorded in MS91-DETAILED-RELEASE-CHECKS.md.)
24. [ ] Complete timing/input/initialization/result difference classification.
25. [ ] Complete resource/table/render/menu/audio difference classification.
26. [x] Moving tunnel/roof passage evidence beyond stationary height probes.
27. [x] Independent original loader/menu divider replay check, both relevant versions; tree collision inquiry concluded at user-clarified scope (detailed49).
28. [x] Audit all active/direct simulation callers for modern cache requirements.
29. [ ] Complete fresh10Hz browser race/result evidence.
30. [ ] Final10Hz public session/import/ranking policy implemented and verified.
31. [ ] Fresh desktop full-game/menu/Options visual and interaction QA.
32. [ ] Fresh mobile full-game/controls/layout QA.
33. [x] Browser replay import and engine-labelled download interaction QA.
34. [x] Browser replay rewind/restart/continue eligibility QA.
35. [x] Browser private save/backup/restore interaction QA.
36. [x] Browser track editor/track import/export QA.
37. [ ] Browser sound/setup persistence QA with muted test operation.
38. [ ] Representative language/layout QA for upgraded menus/site.
39. [x] Current-source restorable backup including latest collision changes.
40. [x] External deployment asset inventory/checksum preservation.
41. [ ] Complete production replay/score backup or proven equivalent recovery.
42. [ ] Production rollback/recovery procedure verified without historical rewrites.
43. [ ] Switch future-race default toMS91; stored identities remain independent.
44. [ ] Final-default legacy/new-engine automated regression run.
45. [ ] Final production build/type/migration compatibility checks.
46. [ ] Verified FAQ/README upgrade and replay-compatibility documentation.
47. [ ] GitHub source/docs update verified for intended repository.
48. [ ] Supported deployment preserving DB/assets/domain/audience.
49. [ ] Public-site new-race/menu/graphics/download smoke checks after deployment.
50. [ ] Post-deployment historical replay/score preservation and final completion audit.

Current next check: remaining engine difference classification and10Hz policy.

Item30 timing boundary audit: public score policy remains20Hz only; slower
runs may save privately, with M10 tables distinct from M91/HIG. New
test_public_score_cadence_guards.ts verifies both MS90/MS91 client proofs reject
history/session timing combinations10/20,20/10,10/10 and omitted/10 before
saveReplay is called. Server validation rejects10,0,15,30,string20 and null
cadence while preserving omitted/explicit20 identities. Existing private
score read/write/backup/reopen separation test passes. These checks are now
included in test:private-score-cadence. Policy unchanged; final fresh finish
and release-default checks remain outstanding.

Item30 routing preparation: graphicsSettingsForFutureEngine now supplies
expanded MS1991 options based on selected future engine, not hostname alone.
Existing browserPreviewGraphicsSettings export delegates to that capability
and selectBrowserFutureRaceEngine. Public query overrides remain ignored and
the configured release default remains MS1990; no public behavior switched.
When item43 eventually switches the default, modern menus and permitted slow
imports follow it without needing the localhost flag. Settings/options/import
lifecycle and typecheck pass. Fresh finish/ranking/final-default verification
remain outstanding, so item30 is not marked complete.

Item29 persistence extension: saved the actual unfinished browser race using
native Save Replay under new QA10T001.RPL (no overwrite). Browser backup
stunts-saves-2026-10-11 (4).json confirms physicsEngine ms-1991,
framesPerSecond10,286 recorded inputs and canonical length1826+286=2112.
Duration matches displayed28.60s. All ten prior private records from (3).json
compare unchanged, every field. The additional legacy import is also retained.
This establishes fresh10Hz browser save metadata, not a completed result;
item29 remains open, no website score submitted.

Item29 partial browser evidence (2026-10-11): retained IPv6 preview freshly
loaded latest source, selected Slow Simulation Speed in the original ten-choice
menu, observed the next-race notice, loaded private QA_LOOP, started a fresh
race. Rendered canvas explicitly reports preparedRaceEngine ms-1991,
preparedRaceCadence10 and raceMode0. Keyboard input advances recording;
frame191 displayed0:19.1, then paused recording at0:28.60. Enhanced WebGL
graphics/panorama active, Roland powerOFF and effectsOFF. No finish, replay
save or score submission: car drove off this test track. Item29 remains open.

Item39 refreshed source evidence (2026-10-11): local checkpoint
PlayStunts-backups/2026-10-11-ms91-car-contact-verified contains1695 entries,
archive SHA256 c46fc2ab6396f4f072c70ac531240a4640ab4dd5d07bfcdd297f2a84a5d0f623.
Checksum verified and extracted into fresh temporary directory
playstunts-source-restore-MDHmNP. Nine latest collision/passage/test configuration
files compare byte-identically after restore, alongside required core files.
No production DB/dependency contents included; external asset symlink retained,
not followed. This supersedes the earlier source checkpoint for rollback.

Item26 continuous evidence (2026-10-11): check_ms91_tunnel_passage.ts uses a
test-only valid-track tunnel substitution and executes40 successive original
chassis steps without reinitializing the car. Each of11 cars traverses rows
12→13→14 (entrance, tunnel, exit). Integrated web movement retains its own
state and matches original position, orientation, crash status and body cache
at all440 steps; all passages crash-free. Original replay unchanged and type
checking passes. This is bounded chassis evidence, not a full controlled race:
fixed speed32768, original initialized suspension and zero wheel-angle scratch;
engine/grip/input/route updates are outside this isolated movement comparison.
Together with99 moving roof probes/33 collisions, it completes item26 scope.

Item26 partial moving evidence (2026-10-11): added --moving-tunnel probe to
check_original_body_collision_exit.ts. All11 original car resources pass9
moving states each: heights80/120/140 and speeds4096/16384/32768,99 cases,
33 actual body-roof crashes. Original chassis output and integrated moveTrack
match body caches, crash byte, road speed, full position and rotation. Source
replay stays unchanged; type checking passes. These are single-step motion
probes, not a continuous entrance-to-exit passage. Item26 remains open.

Item33 completion: QA90R001.RPL copied from CTKFIN.RPL, imported through the
browser with explicit Mindscape1990 selection. Download confirmation correctly
names13December1990, even inside the MS1991 future-engine preview. Downloaded
2996-byte file compares byte-for-byte with its legacy source using cmp (exit0).
Combined with the MS1991 round-trip below, both supported engine-labelled
browser import/download paths are verified. This does not claim full mobile
QA, original game compatibility for all other editions, or public deployment.

Item33 partial browser evidence (2026-10-11): private QQALAP download displays
MS1991 compatibility, OK downloads a2624-byte external file matching
nativeFileDownload applied to the2622-byte stored canonical file exactly.
Copied export as QA91R001.RPL, selected Mindscape1991 in import dialog, imported
successfully. Fresh backup has10 files; the new canonical bytes match QQALAP
exactly and physicsEngine is ms-1991. All nine pre-existing records, including
every metadata field, compare unchanged. Evidence: QQALAP (1).RPL and
stunts-saves-2026-10-11 (3).json in Downloads. Legacy browser path still open;
this partial evidence does not complete item33 or justify production release.

Item35 browser evidence (2026-10-11): IPv6 preview exported nine private files.
Separate localhost origin exported its three existing files before any import.
Importing the nine-file backup restored six missing files and explicitly kept
existing files. After page reload, a fresh export contained all nine files.
Byte payloads, physicsEngine and framesPerSecond matched the source for every
file; all fields of the three pre-existing files remained exactly unchanged.
The same-backup duplicate import on IPv6 previously imported zero files.
Evidence files: Downloads/stunts-saves-2026-10-11.json, (1).json and (2).json.
This verifies additive browser restore and duplicate protection, not deletion,
an empty-profile restore, or production database recovery (item41 remains open).
Item31 partial observation: fresh background IAB tab7 at IPv6 preview started
muted with Roland powerOFF, animated publisher logo advanced to enhanced main
menu, Options visibly shows Feb25,1991. Clicking Graphic levels opens all ten
choices with Full,slow-videoON,Fast simulation marked. Dialog fits desktop1280x720
viewport. No setting changed. This alone does not complete full-game desktop QA.
Do not publish solely because the numerical checklist reaches a high percentage.

Item36 partial browser evidence: retained IAB tab7 opened Track→New/Edit,
displayed the DEFAULT editor grid/palette, then opened Select Horizon. Five
horizon choices plus Cancel render correctly, with no leaked group delimiters.
Clicked Cancel and Done; visible status returned to track menu. No tile edit,
horizon change, save or public submission. Track import/export and save/load
interaction still require verification before item36 can be checked off.

Item39 evidence: PlayStunts-backups/2026-10-11-ms91-integrated-collision-checkpoint,
1685 entries, SHA2568af3f4a98eedd3ad63f309360222872ccc9a335951c892a0045e239de21b3fe9.
verify_compatibility_backup.mjs restored into a new temporary directory;12 latest
integration/test/checklist files compared byte-identically with current source.
External asset links remain links; production DB and external assets not included.
This checklist status update postdates the archive; captured checklist is22/50.

Item40 evidence: PlayStunts-backups/2026-10-11-ms91-external-assets-checkpoint,
1753 files/60852725 bytes, archiveSHA256
6aaf3d514890d131b929143df728801a80dff4ad2d5ee72450a0f789c8d21e05.
backup_external_assets.mjs hashes every file, creates a separate archive, restores
to a new temporary directory, then compares all restored and source hashes.
Sources remain unchanged. These public deployment assets are not a DB backup.

Item28: production stepTrack entry is stepDrivingCar; opponent movement enters
through opponentDrivingStep. Both reach moveTrack, which now rejects missing
modern caches before geometry (except original contact mode2, which skips this
phase). Native execution and both seek paths use recorded wrappers reading and
writing the owned cache tail; server verification uses the same native session.
stepLevel has no production caller and remains an explicitly horizontal-only
validation helper, not a substitute engine. test_ms91_body_cache_required.ts
proves native cache supply and rejection without source-memory mutation.
Lifecycle/10Hz rewind/renderer runtime/broad regressions and type check pass.
Latest fail-closed guard/test postdate item39's archive; refresh at final release.

Item36 browser round-trip: editor Save created new private QA91T001, listed and
loaded through editor Load. Browser file panel downloaded QA91T001.TRK to
/Users/svenanders/Downloads/QA91T001.TRK:1802 bytes, SHA256
4111e30379c39020d10f30eef15b7e46aca87a7716e499cde2e89c7c545388fd,
byte-identical to bundled DEFAULT.TRK. Reloaded before import, duplicate name
was rejected without overwrite, renamed identical test copy QA91I001.TRK was
accepted. Started muted game, Track→More Tracks listed it; selecting it showed
QA91I001 and the expected full DEFAULT layout. Existing tracks/scores/replays
not overwritten. Test-only private copies remain available, not published.
Coverage: editor open/horizon/cancel/save/load and track export/import/load;
does not assert every possible terrain/tile combination or platform.

Item34 partial: QQALAP loaded via original replay menu in retained browser7,
canvas reports MS91/20Hz. Keyboard selected Play, progressed0→233, Stop held
233, Beginning restored0. Held pointer forward button sought0→72 (3.60s),
held pointer backward sought72→2 (0.10s), each verified after seek finished.
The timeline itself is not an original seek hit target; prior click there
activated the retained Menu selection and is not evidence of a scrub failure.
Continue Driving eligibility/browser evidence remains open before item34 pass.
No replay saves or score submissions were performed; Roland power stayedOFF.

Item34 completion: browser Continue Driving opened original warning; Continue
returned to cockpit driving, mode changed2→0, input frame advanced to258,
then Escape paused. No save or score submission. Actual native history wrapper
and completedScoreProof gate are exercised by test_native_continuation_score_gate.ts
for both engines: loaded replay ineligible, fresh restart clears history, reset/
continuation marks history again and blocks an otherwise eligible proof, even
at recorded end. Type check passes. This combines browser transition evidence
with direct score-gate evidence; no production submission was used as a test.
