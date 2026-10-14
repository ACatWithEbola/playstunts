# Mindscape December 1990 → February 1991 difference audit

Baseline: current PlayStunts legacy engine (`ms-1990`), based on Mindscape
4D Sports Driving v1.1, 13 December 1990. Target: Mindscape v1.1,
25 February 1991 (`ms-1991`). Do not confuse either with Brøderbund 1.0.

Status: **local release candidate, not published or approved for release**.
This is a behavioral difference audit and release-difference record, not a claim
that every executable byte differs or that every hardware configuration passes.
Compiler relocations or changed addresses alone are not behavioral differences.
Current gates are in `MS91-DETAILED-RELEASE-CHECKS.md`; current evidence is in
`MS91-CURRENT-RELEASE-STATUS.md`. Historical checkpoints below describe earlier
states and must not override those current records.

## Release differences and preservation contract

The following describes the current local compatibility build, not a change
already deployed to playstunts.com:

- **Fresh races:** both Mindscape editions have explicit engine identities.
  `play-engine` chooses a fresh launch; loopback-only `preview-engine` is a QA
  override. The release default remains `ms-1990`; its separately gated future
  switch must not choose the engine for stored recordings.
- **Existing races:** untagged historical recordings remain `ms-1990`. Tagged
  recordings retain their own engine and cadence across loading, verification,
  backup, download and future-default rollback. Unknown identities fail closed;
  relabeling a replay cannot convert its physics or make a failed run valid.
- **Cadence:** public scores and shared races require 20 Hz. Supported MS1991
  10 Hz recordings remain private, playable and downloadable. Menu simulation
  settings affect the next fresh race, not an already loaded recording.
- **Replay files:** December files use the 24-byte header; February files add
  the cadence word and use a 26-byte header. Conversion operates on a copy of
  canonical stored data, preserving embedded track and controls. Public
  downloads retain the existing hash-derived filename-label substitution;
  they are not raw database exports or lossless database backups.
- **Private files and tracks:** DOS-case aliases resolve without renaming or
  rewriting stored keys; ambiguous aliases fail without deleting either copy.
  Embedded replay tracks can be imported only without overwriting an existing
  different track, including DEFAULT.TRK. Public sharing still requires consent.
- **Presentation:** the February options and display paths retain their own
  graphics/video-management settings, result-time formatting and 10/20 Hz replay
  presentation. Shared updated graphics remain optional; their appearance does
  not change the recording's simulation identity.
- **Sound:** sound-driver edition is independent of a loaded replay's physics
  edition. Selecting MS1991 with Roland uses the versioned timed transport
  without requiring the temporary timing-preview flag. MS1990's ordinary
  Roland path remains unchanged. No MS1990 Roland fallback has been applied to
  MS1991; that exception remains conditional on proving an original-code defect.
  The MS1991 Original menu-to-race transition uses a web-output gain fade while
  its original note clock continues. This avoids repeated device-volume wait
  programs stretching the audible music in the web adapter. No notes, music
  resources or driver edition are replaced. Updated music retains its existing
  scheduled fade; MS1990's working fade is unchanged. User retest confirms the
  MS1991 slowdown is gone and other Roland behaviour works in both editions.
  Updated music uses the user's actual Suno recordings, with timing, loop and
  transition adjustments only. Do not replace them with reconstructed music.
  Original music continues to use the selected original sound driver; Suno
  recordings must never replace or leak into that mode. Historical harmonic
  experiments are disconnected from the local preview and are not release work.
  Browser Roland listening/persistence is accepted. Remaining full-score timing
  and whole-site regression gates are tracked separately; no release approval
  is inferred solely from the accepted loop auditions or transition.
- **Touch controls:** both editions retain simultaneous steering/throttle,
  gear and menu controls; recorded user checks cover replay download Cancel/OK
  and Setup navigation too. This is not certification of every mobile or vehicle
  browser. Vehicle-display tests must be performed while parked.
- **Database:** the engine sidecar migration is additive. Isolated tests show
  unchanged historical rows/schema and engine-scoped retention in both
  directions. These fixtures do not prove a complete production backup, an
  applied production migration or historical-data rollback safety.

### Release and rollback boundaries

Keep both versioned implementations and the newer compatible schema when
rolling back. Change only the fresh-race default to legacy; do not deploy an old
single-engine build, rewrite old records, downgrade the database or reinterpret
10 Hz files as 20 Hz. Explicit `play-engine` choices must be removed when testing
the default; deleting private browser data is neither needed nor permitted by
this procedure. See [the rollback procedure](MS91-ROLLBACK.md).

Source snapshots, external assets, browser-private saves and the production
database are four separate preservation scopes. All must retain their own
verified recovery evidence. A bounded Sites table preview with truncated replay
values cannot satisfy the complete database export requirement. Publication,
default switching and post-release historical byte/score comparisons remain
gated; this document is not authorization to bypass them.

Both reconstructed versioned implementations remain in source. Original game
installations, extracted assets and Roland ROMs must be supplied separately;
the base asset preparation currently validates the December installation rather
than merging files from two DOS installations. Generate the seven separate
ignored MS1991 resource modules from your own February directory/ZIP with
`tools/prepare_ms91_resources.py` before base preparation or compilation. The
checked-in recipes contain checksums and metadata only; the source publication
guard rejects generated modules that have been force-staged. Follow
[README](../README.md) for supported preparation and engine selection. Private
source checkpoints may contain these local generated inputs and must not be
published as redistributable source archives.

## Confirmed and implemented differences

Current policy and sound limitation: public scores/shared races require20Hz;
supported MS1991 slow10Hz recordings remain private, playable and downloadable.
Private upload/playback no longer needs a loopback preview flag. Ordinary
browser download/playback, duplicate rejection and fresh nonduplicate private
imports were verified, including retained MS1991/10Hz bytes across backup and
reload. Actual Munt
tests cover both generations' shipped scores, startup, sample-timed delivery,
pause/resume and fade. The existing hosted release remains legacy. In the local
compatibility source, timed adapters are wired to explicitly selected MS1991
music, demo, driving and replay sessions through OpeningSequence, without the
temporary MT32 preview flag. This does not switch the public fresh-race default;
the CPU/poll execution profile is virtual, not an original-PC timing acceptance.
Do not infer a
completed sound upgrade from passing isolated synthesis tests.

Current audio difference: the common legacy voice-duration helper decrements
zero to0xFFFFFFFF; MS1991 leaves zero unchanged. Both retain the original release
transition. This is independently verified by executing both original helpers
across80 boundary cases, not inferred from cross-edition equality. Routing now
preserves sound-driver identity separately from the race's effect/physics engine.
Under the declared5-clock polling fixture, all four MS1991 Roland scores match
original MIDI bytes, PIT timestamps and every46-byte voice record for6000
callbacks. The outer original IRQ and physical-PC timing are not established by
that fixture. Enhanced recording note/repeat alignment also remains open: Game
over's timed offset grows across repeats, so one fixed opening offset cannot
prove its alignment. Do not promote a guessed modern music calibration.

The full Tandy sampled path is still an explicit loopback-only test profile;
the shipped tone path and custom sampled paths have distinct verification.
Complete race/demo sample tests compare PCM, bus timing, memory and recorded
frames under explicit virtual hardware settings, not original analog fidelity.

Current integration checkpoint: the explicit localhost MS91 preview now has
the complete expanded graphics-choice menu in Options and the allocated-race
Display Options path. Slow/fast video-policy changes reset native retained
regions and enhanced overlays; EGA preserves its two-page redraw count.
Simulation speed is configured for the next fresh race. Actual browser checks
confirm a current 20 Hz session remains unchanged and the next race uses 10 Hz.
MS91's bundled unattended demo is its own original 10 Hz recording, not a
relabeled MS90 recording. Loaded legacy recordings still select legacy engine,
cadence, dialog resources and rendering policy regardless of the preview URL.

These are local integration results, not a completed release. Chronological
checkpoints later in this document describe earlier states; the release gate
is authoritative for remaining verification. Public defaults remain MS90.

| Area | Legacy behavior retained | Target behavior | Code / evidence |
| --- | --- | --- | --- |
| Steering quartering | Signed division truncates toward zero | Signed arithmetic shift rounds negative values down | `engine-version.ts`, `chassis.ts`, `track-contact.ts`; original grip instructions and exhaustive signed-word checks |
| Sliding-angle blend | Wrapped signed `(3 × angle + initial) / 4`, truncating | Same wrapped word, arithmetic shift by two | `grip.ts`; original MS91 routine comparisons |
| Heading/spin damping | Wrapped signed `15 × value / 16`, truncating | Same word, arithmetic shift by four | `grip.ts`; original routine comparisons including both player/opponent branches |
| Force scaling | Unsigned long force/mass division, wrapped signed word, truncating half | Same long division and wrap, arithmetic signed half | `engine.ts`; original MS91 engine instruction and full-routine checks |
| Landing sound threshold | Signed fall-speed threshold 190 | Threshold 250 | `wheel-plane-contact.ts`; original MS91 contact disassembly |
| Landing crash threshold | Signed fall-speed threshold 931 | Threshold 23275 | `wheel-plane-contact.ts`; original MS91 contact disassembly; these are internal units, not a claimed degree angle |
| Twisted-pipe lateral acceptance | Reject absolute local lateral coordinate ≥130 | Reject ≥150; height cutoff remains 265 | `twisted-pipe-selection.ts`; original contact disassembly |
| Half-size model coordinates | Signed half truncates toward zero | Arithmetic half rounds negative odd values down | Versioned model transform and overview placement; exhaustive signed-word checks and original instruction execution |
| Primitive sort flags | Sort-mask bit 2 | Sort-mask bits 2 and 4 | Versioned primitive submission/header paths; all 65,536 flag words and original execution cases |
| Drawing-region handling | Legacy clipping/retained-region branches | Added version-specific region guards and slow/fast policy | Original model projection/dependency audit and primitive guard execution; final browser regression remains separate |
| Original circle height | `D - (D >> 2) + ((D >> 2) >> 1)` | `D - (D >> 2) + ((D >> 2) >> 2)` with original signed-word behavior | All eight display-driver instruction checks, exhaustive native calculations and original MCGA pixel comparisons |
| External replay header | 24 bytes; frame count at 22 | 26 bytes; cadence word 10 or 20 at 22, frame count at 24 | `versioned-replay-file.ts`; byte-level round trips and actual browser/HTTP downloads; 10 Hz remains private |

The arithmetic differences can cause accumulated replay divergence despite small
individual rounding changes. Header conversion cannot convert a legacy race's
physics. An exported replay is offered for its recorded engine only.

## Confirmed unchanged within the audited scope

- All fourteen packed scene/model banks and their 197 decoded models match
  between the audited original archives. Collision resources retain all 536
  planes and 191 walls. These resource identities do not mean the projection or
  collision-processing code is identical.
- The original-renderer geometry gate passed complete track-overview pixel
  comparisons for all 40 bundled tracks separately against each edition's
  original MCGA executable. Line, polygon, patterned polygon, wheel and circle
  pixel comparisons also passed. Enhanced presentation still needs its final
  browser regression; original pixels alone cannot prove that appearance.
- All eleven actual web car SIMD resources: all 776 bytes per car exactly match
  original MS91. All fourteen extracted powertrain/grip fields also match.
  Evidence: `audit_ms91_car_resources.py`, reading `public/game/assets.json`.
- Original BB11 and MS91 engine/grip routines produce identical outputs for the
  tested captured and deterministic synthetic states; their sine tables match.
  This is bounded evidence, not whole-executable equivalence.
- Track and recorded control bytes are preserved by export/import. Only the
  external header layout changes; public downloads retain the existing copied
  track-filename-label convention. Stored canonical bytes are never rewritten.
- Legacy scoring IDs, untitled/untagged engine defaults and existing stored
  records retain their established interpretation.

## Historical investigation checkpoints (not current release status)

The entries below preserve the investigation chronology. Statements such as
"disabled", "unavailable", "still legacy" or "build succeeds" describe their
individual earlier checkpoints, not the current implementation or final build.
Use the current contract above and the detailed release checklist for acceptance.

### Earlier community-reported differences and code confirmation

Slow-video audit checkpoint: configuredDS99f6 becomes activeDS9690 at entry and
changes trigger rectangle-cache reset imagec4ba. Its two15-rectangle banks
(A250/A65E) match100 original full-data-segment captures, including disabled and
nonzero flags. This is not the whole policy:28 confirmed word-compare sites span
menu/race presentation, world/render operations and status/replay overlays.
`audit_ms91_simulation_rate.py` inventories exact sites. Do not expose the option
based only on the reset helper; presentation/copy/drawing branches remain open.

Follow-up: MS91 rectangle union at1899a uses alignment globals9AD0/A1D8;
the mapped helper matches1000 original signed-coordinate/overlapping-pointer
captures. Presentation strip144ab..144e3 prepares[0,320,AEC6,A1B6] and optionally
unions intoDS009A; the branch plus original union matches1000 additional captures
including disabled flags and null pointers. Helpers remain isolated from the
active legacy-layout renderer. `test:ms91-video` collects their unit checks and
the copy-only version-label test. This does not establish full slow-video policy.

Browser checkpoint: muted local MS91 preview entered a fresh race and paused
at0:02.00 with matching replay times. Existing private MS91 replayRBB9A189 loaded
through Options/file chooser and reached its expected2:06.80 endpoint. Options
now visibly shows originalMISC version labelFeb25 1991; expanded rate choices
remain unavailable. Tests were stopped withRestart and browser error/warning
logs were empty. This is short timing/load evidence, not a completed fresh race,
score-save/reload proof, or complete gameplay/visual verification.

Explicit MS91 result panels now route to the six retained formatter words
verified against original captures (12156 words across4052 formatting cases).
Legacy panels retain their previous six-word layout and20 Hz division. The
preservation regression checks complete memory equality, final formatter-call
selection (player, penalty, opponent, or no call), and unsigned tick boundaries
at both rates. This bounded reconstruction does not establish all original
stack writes or slower-rate high-score insertion units;10 Hz sessions remain
disabled until those broader gates pass.

Current integration checkpoint: `npm run build` succeeds with492 translated
website messages checked. Build success is not gameplay or deployment proof.
`npm test`, `test:rankings` and `test:cadence-safety` passed after the recent
metadata work. The four Chocolate reference recordings (Audi2556, Porsche2264,
Indy1471, Countach3806:10097 frames) still have zero checked position/physics
field differences; full-state rewind and untagged20 isolation also pass.
These are Chocolate-derived captures, not complete originalMS91 frame evidence.
The independent opponent-wait path still contains fixed20 redraw timing and
the shared time formatter; originalMS91 comparison is required before enabling
slower sessions. Fresh release default remains legacy and no deployment occurred.

Session cadence plumbing checkpoint: session ownership now records explicit
cadence (default20) and supplies it consistently to both track resources,
input capture, recording timer and checkpoint restore/seek paths. Existing
Audi full-state rewind and type checking pass. **10 Hz sessions still fail
closed** before initialization: allocation/reset/header metadata/persistence
and score verification are not yet fully rate-aware. The negative session
guard test prevents partial10 execution from creating mislabeled20 recordings.
Do not expose the slower menu option until those remaining paths are integrated
and original-game/full-session tests pass.

Cadence integration follow-up: private file metadata and JSON backups now retain
optional `framesPerSecond` (10/20), rejecting unknown values and leaving old
untagged records unchanged. Missing cadence resolves to20 without persistence
writes. Selection, private replay saves and results replay re-entry carry that
metadata alongside the engine. The score-file wrapper forwards replay metadata
without contacting leaderboard services. Race/display checkpoint allocation and
initialization reset accept explicit cadence; direct initialization tests prove
40/20 valid-marker resets and byte-identical default versus explicit20 behavior.
Private10 exports deliberately reject rather than generating a false20 header.
This is integration progress, **not permission to enable10 sessions**: remaining
full-session timing, re-entry allocation, public proof/score interpretation and
original-game verification still need completion. Focused metadata, backup,
initialization tests, the compatibility/rate suites and type checking passed
at their respective checkpoints.

Crossing-intersection checkpoint: original MS91 `vector_op_unk` at image
`0x25440` matches reconstructed `intersectZ` for 1,000 deterministic ordered
above/below crossing endpoints with signed16 coordinates, including wrapped
large Z spans handled by logical half-shifts before division. No code change
needed. The oracle verifies the intersection helper, not subsequent remaining
motion scaling, height correction or the complete landing/crash sequence.

Non-aligned plane-motion follow-up: extended the oracle to vary car pitch/roll
relative to each of the 536 original planes. The harness constructs the car
orientation with original MS91 `mat_rot_zxy` at image `0x18622`, preserves
initialized original math constants, then executes plane-motion `0xbbd6`.
All 536 reconstructed outputs match, including the reprojection branch; no
game-code change needed. This verifies these sampled orientations/distances,
not every possible angle or the full crossing/contact/crash sequence.

Aligned plane-motion checkpoint: original MS91 `0xbbd6` compared against
`planeMovement` using every one of 536 original planes, varied signed distance,
yaw and wheel angle, with car pitch/roll aligned to each plane. All match.
The initial diagnostic used different SS/DS and yielded invalid zero vectors
because this routine passes near pointers to stack vectors; those outputs are
not counted. Corrected SS=DS original convention, reran all comparisons, and
added a nonzero-motion sanity guard. Reprojected pitch/roll branch and full
plane-crossing/contact execution remain separate unverified gates.

MS91 dialog-resource overlay checkpoint: added six native text overrides
(`emrl`, `emrs`, `emop`, `emdo`, `emen`, `erbf`) separately from original shared
asset files. Extended the original-resource audit to compare every literal with
MS91 source bytes through its first NUL: all six match. Overlay tests pass
legacy identity/input preservation, unchanged-resource sharing and ten compact
graphics choices. Type checking passes. The overlay is not yet connected to
browser menu hosts; expanded choices must use the new dispatcher and verified
rate/video management behavior before being exposed.

Dialog input/runtime checkpoint: `NativeDialogHost` supports optional engine
identity; `createNativeDialogRuntime` snapshots it once per dialog and passes
that same identity to both rasterization and interaction geometry. Runtime
test selects the third compact row by mouse location, confirms presented bounds
match the hit-test layout, and verifies complete backdrop restoration. Legacy
text-entry/color regressions and type checking pass. Browser menu hosts and
actual MS91 resources still need integration; this is not browser visual QA.

Modern dialog rendering checkpoint: `originalDialogLayout`,
`originalDialogContent` and `drawOriginalDialog` accept optional engine version.
Modern `}` terminates a line with 4-pixel measured/text spacing and 3-pixel
choice-parser spacing; raster borders use explicit content height. Legacy
defaults retain their prior returned shape and literal-`}` behavior. New spacing
tests pass menu choice positions/labels, bounds and default/legacy equality;
existing text-entry/color regressions and type checking pass. Input hit-testing
and native-dialog runtime still need matching engine propagation and browser
verification before substituting original MS91 resources.

MS91 dialog delimiter checkpoint: original show-dialog code compares `}` at
`0x19b48`, `0x19d20`, `0x19e8a`. Its measurement path adds 4 pixels at
`0x19b7e`, while choice parsing adds 3 at `0x19eae`; it terminates the current
line rather than displaying the character. `audit_ms91_dialog_spacing.py`
asserts these instructions. Therefore replacing `}` with a normal ten-pixel
newline would also be inaccurate. Implement and verify separate version-aware
measurement/text/choice geometry before wiring MS91 dialog resources.

GAME.PRE full resource comparison: only `emdo` (Display Options), `emen`
(Replay Menu) and `erbf` (buffer-full dialog) differ among its 20 resource
entries. Their visible wording is unchanged; MS91 replaces blank-line menu
separators `]]` with `]}`. `emen` also has a differing byte after its NUL
terminator, not visible text. Current legacy `dialog-layout.ts` explicitly
treats `}` as ordinary text, so original MS91 resources cannot simply be
substituted without version-aware dialog parsing/layout. Audit the original
MS91 delimiter semantics and selection geometry before integrating those
resources and the expanded graphics menu. The read-only resource audit now
asserts the complete changed-key set so additional differences cannot go silent.

Collision-resource parity checkpoint: independently decoded original MS90 and
MS91 `GAME.PRE` banks. All **536 planes and 191 walls** are byte-identical
between releases; current web JSON fields exactly match MS91. Plane SHA-256
`a6a65563b6e107f924e1de325ce53fa7cec9dd229d767fcda713c2ea46447100`,
wall SHA-256 `a52bc342bd6d51e5241765b5e68642f7ff5746658ff46b7771a651b62a803d8f`.
Extended original distance oracle to every original plane with separate cached
and table lookup cases: all 1,072 comparisons pass. Thus no collision-bank
replacement is needed; community-reported roof differences must be investigated
in selection/response code or other state, not assumed to come from these banks.
Resource equality plus distance tests still do not prove full collision response.

Plane-distance follow-up: extended original MS91 oracle to routine `0xbd68`,
including signed plane/tile origins, horizontal IDs0–3 and normal-based IDs4–7.
1,000 synthetic cases pass, including both direct table and cached active-plane
lookup paths. Reconstructed `planeDistance` matches all results; no change
needed. This covers distance computation, not wheel motion splitting, wall
response, the whole plane/resource bank or full original race execution.

Plane-normal arithmetic checkpoint: executed original MS91 routine `0xbdf4`
on 1,000 deterministic signed16 vectors and Q13 normal components bounded
−8192..8192. Reconstructed `normalProduct` matches all outputs. No arithmetic
change was needed; signed division here remains correct rather than blindly
replacing every division with a shift. The isolated oracle scripts preserve
this check. It verifies the sampled normal products, not full plane placement,
motion splitting, collision response or a complete original race.

Chassis mean audit: original MS91 has identical two-bit signed-long shift
loops at `0x85de`, `0x860f`, `0x8640` for X/Y/Z wheel-centre sums. MS90 has
the same loops at `0x860e`, `0x863f`, `0x8670`; therefore this is **not a
version difference**, but a previously shared reconstruction discrepancy.
Modern `reconstructPose` now performs the original signed32 shift; legacy
default retains existing truncation to avoid changing old stored replay
interpretation. Track and horizontal validation callers pass explicit engine.
Indy ZCT299 full-frame comparison and type checking passed after the change.
This check covers the mean instructions, not the entire pose reconstruction.

Original suspension oracle checkpoint: executed MS91 routine at image `0xab00`
for 1,000 deterministic synthetic suspension/distance states. This found a
previously missed signed-rounding difference in the negative-distance 3/4
correction: MS91 arithmetic shift rounds downward, unlike legacy signed
division. Added explicit engine routing to `stepSuspension`; legacy/default
keeps truncation, modern contact passes its engine and uses the signed shift.
The reconstructed MS91 suspension now matches all 1,000 original outputs.
This is component evidence, not complete landing/race coverage. The read-only
oracle generation and comparison scripts retain the diagnostic for regression.

Legacy suspension preservation follow-up: ran the same 1,000 synthetic states
through original MS90 at image `0x18e12` and compared both explicit MS90 and
omitted/default engine calls. All matched. The paired case9 (`rc2=244`,
`rc4=-273`, `rc5=-344`, distance−537) yields legacy rc2−158/height109 versus
MS91 rc2−159/height110; retained as `test_versioned_suspension.ts` so this
specific difference can be tested without the external binaries.

The horizontal-surface validation path now also accepts explicit engine routing
through `stepLevel` and `horizontalContact`, including engine/grip/chassis and
suspension. The paired suspension test verifies all four horizontal contact
wheels choose the matching legacy/MS91 correction; default equals explicit
legacy. This is a validation helper, not a substitute for full track collision
or original-game race verification. Type checking and rate-component suite pass.

Collision rate propagation checkpoint: player/opponent movement passes track
cadence to crash handling, and both directions of cross-car collision writes
pass the affected track cadence. Existing omitted cadence still defaults20.
Type checking, goalpost collision regressions and crash/finish helper tests
pass. Dedicated full 10 Hz cross-car collision comparisons against the original
remain necessary; these wiring edits alone do not establish that compatibility.

Recording-buffer follow-up: original MS91 `0x14c3f` computes total limit as
1500 × active rate, while `0x14c64` retains a fixed 12000-frame input buffer.
At `0x14d3b`, checkpoint shifting uses 12000 divided by the rate-dependent
chunk, minus one. This corrected an earlier provisional 10 Hz limit assumption:
10 Hz requires 40 slots, not 20. `captureOriginalRaceInput` now shifts 300/600
frames and 40/20 slots while retaining default20. Tests pass counters, input
history, shifted checkpoint frames and default equality. Session allocation
must accommodate 40 slots before any 10 Hz session is enabled.

Checkpoint allocation/reset helpers now accept optional rate, default20:
allocation requests 1,341 paragraphs for 20 canonical slots or 2,681 for 40,
including the allocator's extra paragraph. Reset clears the matching number
of validity markers. Reset tests pass all 40/20 marker checks and default20
equivalence; type checking passes. Actual 10 Hz allocated-session creation,
heap preservation and restart integration remain unverified, so no slower
session is enabled by this helper change.

`test_ms91_checkpoint_allocation.ts` now exercises the allocator with explicit
bounded heap descriptors: both slot counts reserve enough bytes, record the
correct pointer, leave input memory untouched and return `space` on insufficient
heap. Default allocation equals explicit20. This passed, but a synthetic heap
fixture does not prove an entire loaded 10 Hz session has enough available heap.
`npm run test:ms91-rate` collects all current rate/menu/component/wiring checks
for repeatable regression testing; it is not a complete compatibility gate.

Recorded single-/two-car stepping now passes its track cadence to checkpoint
writing. Two-car stepping rejects mismatched rates before simulation; the
negative guard test confirms no input-memory changes. Two-car seek accepts
explicit cadence for restoration and checks prepared player resources agree.
Default20 Audi replay seek/regression still passes. These helpers do not yet
make the browser session cadence-aware; initialization, caller propagation,
recording metadata/export, navigation and complete 10 Hz reference verification
remain open.

Crash/finish timing follow-up: original MS91 handler reads active rate and
shifts it left twice at `0xbaF0`/`0xbb65` for post-crash timing, and reads the
rate at `0xbb8e` for finish timing. `updateCrashState` now accepts optional
cadence (default20), using four seconds after crashes and one after player
finish. Tests pass both rates, unchanged finish-tick sums, input-state
preservation and default20 equivalence. Caller propagation remains open.
The audit also found fixed penalty values in `playerRouteProgress` (60 ticks
per skipped section and 80 display ticks); these require rate-aware integration
before 10 Hz sessions can produce correct timing and penalties.

Penalty follow-up: original MS91 at `0x998d` multiplies by active DS:`0x96dc`
and then by three, while `0x999a` doubles the rate byte twice for display time.
The original rate audit asserts these instructions. `playerRouteProgress` and
`stepPlayerRoute` now accept optional cadence, default20, with 3 × rate penalty
ticks per skipped section and 4 × rate display ticks. Unit tests pass 10/20
durations, signed-word wrapping, route confirmation reset and default equality.
Higher navigation/session callers still need to propagate cadence.

Navigation propagation follow-up: `stepPlayerDriving` now supplies its track
rate to transient navigation state (10 only; default20 retains its old shape).
`playerNavigation` passes it to route progression, `advancePlayerNavigation`
retains it, and player finish dispatch passes it to crash/finish timing. A
rate change cannot retain stale10 navigation metadata when track cadence is20.
Type checking, Audi full-state rewind, penalty helper tests and the all-frame
Indy ZCT299 reference regression passed after these edits. Full 10 Hz navigation
and finish comparisons against original MS91 remain unverified.

### Confirmed in-game graphics-options resource change

`audit_options_releases.py` reads original `MAIN.RES` and decoded `MISC.PRE`.
Legacy `emrl` provides five graphic levels (full through fast, with different
cloud/scenery/horizon omissions). MS91 retains those five choices and adds:

- Slow video management OFF / ON.
- Slow simulation speed / Fast simulation speed.
- A Done item for the expanded dialog.

MS91 also introduces `emrs`, a notice stating that simulation speed changes at
the start of the next race. This establishes original UI/resource differences,
not the corresponding code behavior, default values, or frame cadence. The
existing web `options-actions.ts` handles only the five graphics levels; target
dispatcher and speed handling therefore remain a compatibility audit item.
These controls belong to the **in-game Options → Set graphic level** dialog,
not SETUP.EXE. Exact SETUP program comparison is recorded separately below.

### Original MS91 simulation-speed dispatcher checkpoint

Read-only disassembly of the unpacked original MS91 EGA image locates the
slow-speed assignment at `0x1c490` and fast-speed assignment at `0x1c49a`.
They write **10** and **20**, respectively, to the same word at DS:`0x9a56`,
then return to the expanded menu loop at `0x1c3b1`. On exit, `0x1c4a4`
compares that word with the value saved at BP−`0x212`; when changed, it calls
the notice dialog. This confirms different configured simulation rates, not
merely different labels. The reconstructed BB11 `show_graphic_levels_menu`
provides a matching investigation map, but the evidence above comes from the
original MS91 bytes themselves.

Still open: trace when this configured rate becomes the active race rate,
the timer/powertrain/contact consequences of 10 versus 20, and its replay
header handling. The web engine currently assumes 20 Hz; do not implement
the slow choice as a cosmetic playback-speed switch or advertise 10 Hz replay
support until those paths have been verified.

`audit_ms91_simulation_rate.py` now asserts the original instruction bytes at
both menu assignments and five transition sites (`0x140af`, `0x1458d`,
`0x146b0`, `0x148f9`, `0x16843`). Each copies configured DS:`0x9a56` into
active DS:`0x96dc` and the low byte into game configuration DS:`0x96c6`.
The audit passed against image SHA-256
`dc25ff4bd3fb040b4a1b9f647970cb159909086805c13cb1768308c6a630d635`.
This narrows the remaining work to enclosing transition conditions and rate
consumers; it does not establish that imported replay playback uses the current
menu preference, nor that 10 Hz and 20 Hz controls can be interconverted.

### 10 Hz component verification checkpoint

Extended the original-routine harness with an explicit `--fps 10|20` input
(default remains 20). Captured-state mode still rejects 10 Hz because its
existing recordings were validated at 20 Hz. At 10 Hz, 1,000 deterministic
synthetic states cycling through all eleven original SIMD car resources passed
both the original BB11/MS91 equality check and the reconstructed MS91
powertrain comparison. Another 1,000 states passed the same original and
reconstructed grip comparisons. Generated isolated diagnostics:
`ms91-allcars-engine-10hz-oracle.json` and
`ms91-allcars-grip-10hz-oracle.json`.

This proves those routines for the sampled states with their actual rate global
set to 10. It does not prove full 10 Hz races: steering-response tables,
chassis/contact integration, timers, finish times, replay routing and storage
of cadence still require verification. No 10 Hz import or fresh-race setting
was enabled by these component checks.

### Original rate initialization and steering-table checkpoint

The expanded rate audit matches original MS91 initializer instructions at
`0x914b`: 10 Hz selects response pointer DS:`0x650`, otherwise DS:`0x610`.
At `0x9160` it sets the checkpoint interval to `30 × rate` and timer ticks per
frame to signed `100 / rate` (300/600 frames and 10/5 timer ticks respectively).
Both 64-byte steering tables were verified directly at image offsets
`0x330a0` and `0x330e0`. Notably the slow table is **not** simply double the
fast table in every speed bin. Existing `steering.ts` already matches both.
`check_ms91_steering_tables.ts` passes left/right input lookup at both endpoints
of all sixteen speed bins for both rates. This validates table selection data
and lookup, not the complete steering routine or race scheduler.

### Expanded menu implementation checkpoint

Original MS91 instructions at `0x1c453` confirm signed-byte cancellation,
separate dispatch for rows 5–8, Done at row 9, and detail-level assignment for
the five graphics rows. Rows 5/6 write slow-video-management DS:`0x99f6` to
0/1. These instruction bytes are now asserted by the original-rate audit.
Added a separate `ms91-graphics-options.ts` generator rather than changing the
legacy dispatcher. Its tests cover all nine setting rows, three selection
marks, retained cursor, Escape/255/Done, changed-rate notice and a rate change
reverted before exit. Tests and type checking pass.

This is not yet browser-wired: rate-aware race/replay handling and the expanded
native dialog resources must be integrated before exposing the 10 Hz choice.
The live and local legacy options path therefore remains unchanged.

### Rate integration audit: concrete remaining sites

The initial audit found literal 20 in `stepTrack` and default-20 wheel proposals
and movement scaling in `trackContact`. Those sites now propagate optional
`TrackGeometry.framesPerSecond`, default 20, through engine, steering, wheel
proposals, motion scaling and falling contact. Wiring tests pass both front/rear
10 Hz fall increments and default-versus-explicit-20 equivalence. Wall and
goalpost regressions and type checking pass. Nevertheless, successful
standalone 10 Hz component checks do **not** establish an end-to-end 10 Hz
simulation. Before wiring the expanded menu, rate must be carried consistently
through the session, both cars, wheel/contact/suspension integration, timers,
navigation penalties, checkpoints, replay identity and verification. Cadence
must survive save/restore and export without rewriting any existing recording.
Current external import rejects non-20 Hz explicitly, preventing a 10 Hz replay
from silently running at 20 Hz. The new dispatcher and steering-lookup tests
are included in `npm run test:compatibility` so they are not one-off checks.

### Falling-contact implementation checkpoint

Original MS91 contact code at `0x7596` selects motion divisor 7680 at 10 Hz
and 15360 otherwise. At `0x7dad`, the 10 Hz branch repeats the per-wheel
fall-speed increment and signed displacement before recalculating plane
distance. Those exact instruction bytes are asserted in the original audit.
Added an optional `framesPerSecond` input to `wheelPlaneContact`, defaulting to
the unchanged 20 Hz path, and the verified second gravity substep at 10 Hz.
`test_ms91_falling_contact.ts` passes front/rear increments, signed-word edge
cases, default-versus-explicit-20 equivalence and the unchanged inverted-pull
path. Track contact now propagates cadence, but the complete session does not;
it does not enable 10 Hz race or replay support on its own.

### Opponent powertrain rate wiring checkpoint

`opponentPowertrain` now accepts a trailing optional 10/20 rate (default 20)
and passes it to the engine. `opponentDrivingStep` supplies the track rate,
which already reaches movement/contact. `test_ms91_opponent_rate.ts` verifies
default-20 equivalence and both explicit rates through a crashed/braking
opponent fixture, including no route lookup and the expected engine output.
This is wiring evidence, not a full original-opponent oracle: route decisions,
steering and phantom-car paths still need rate audit and paired original tests.

### Recording timer rate checkpoint

Original MS91 `0x149e6` compares the audio interval with DS:`0x96a8`
(the initialized 100/rate value), and `0x14a6c` resets the recording countdown
from that same value. Both instructions are asserted by the original audit.
`tickOriginalRaceTimer` now accepts optional cadence, default 20, using 5/10
ticks for 20/10 Hz. Its tests pass audio intervals, recording callback counts,
guard release and omitted-versus-explicit-20 equality. Session callers still
need to pass recorded/configured cadence consistently; this does not change
the release default or enable 10 Hz replay imports.

### Post-rate-wiring full-recording regression checkpoint

Re-ran all-frame MS91-mode comparisons for ZCT299 `01-ARG` (Indy, 1,471
frames) and `20-STB` (Countach, 3,806), plus ZCT300 `25-MAR` (Audi, 2,556)
and `18-ERI` (Porsche, 2,264). All positions and the harness's independently
checked physics fields match their captured Chocolate BB11 references on
every frame; all four reproduce a finish. Added hard assertions to the
comparison harness: differences or a missing finish now cause failure rather
than merely printing diagnostics; source replay bytes are checked unchanged.
These are full-recording regressions against that captured reference, **not**
new original-MS91 full-frame or 10 Hz evidence.

### Replay seek/engine lifecycle regression checkpoint

Expanded `test_versioned_replay_session.ts` to seek to frames 50, 1,000 and
the recording end (bounded by length), rewind to zero, then seek again and
compare the **complete reconstructed car state**, not just its position.
Both explicit 1991 engine identities remain stable throughout, while untagged
replays still select MS90 even when supplied a modern caller default. Source
file bytes are checked unchanged. Passed for Audi/Porsche ZCT300 and
Indy/Countach ZCT299. This verifies headless factory/seek behavior at 20 Hz;
browser interactions and cadence-aware sessions remain separate release gates.

### Checkpoint selection rate checkpoint

Original MS91 checkpoint selection divides by initialized DS:`0xa704` at
`0x955b` (30 × rate, already verified above), rather than a fixed 600.
`restoreReplayCheckpoint` now accepts optional cadence and uses 300/600-frame
spacing over a fixed 12,000-frame buffer (20 slots at 20 Hz, 40 at 10 Hz). Tests pass
slot selection, the last-slot boundary, out-of-duration rejection, input-memory
preservation and omitted-versus-explicit-20 equality. This adapts our existing
canonical checkpoint layout, not original MS91 structure offsets; session and
checkpoint-writing callers still need consistent cadence propagation.

`beginReplayFrame` now uses the same optional 30 × rate spacing when writing
checkpoints. Original MS91 divisions by DS:`0xa704` at `0x9629`/`0x9635`
confirm the rate-dependent remainder/index path. Tests cover writing at frames
300 and 600, no write at the intervening 20 Hz frame, default-20 equality and
unchanged input memory. The bounded recording-buffer shift and session callers
remain to be integrated and verified before the slower rate can be exposed.

The [Stunts Wiki version comparison](https://wiki.stunts.hu/wiki/Game_versions)
lists the following differences between **MS 1990 and MS 1991**. Treat them as
investigation leads, not proof that our implementation already matches them.

| Report | Audit status / next evidence needed |
| --- | --- |
| Left-corner bias appears in MS91 | Signed rounding paths confirmed; complete chassis/contact branch audit still needed to establish the entire effect |
| Steeper drops tolerated in MS91 | Landing threshold changes confirmed; remaining contact and collision branches need direct comparison |
| Tunnel roofs partially penetrable in MS90, not MS91 | **Open:** compare roof/underside selection and collision responses in both originals, then add targeted tests; not covered by landing thresholds alone |
| Split-as-first-element instant-finish behavior changes | **Open:** compare start/finish and branch-transition logic in both originals; successful ordinary laps do not prove this edge case |

The same table reports jump boost, powergear, the aerodynamic slowdown bug,
faster-Indy classification and fast rewind in both MS releases. These reported
similarities still need relevant code checks; do not borrow BB1.0→1.1 claims as
MS90→MS91 differences. Full replay/resource format documentation is another lead:
[Replay file format](https://wiki.stunts.hu/wiki/Replay_file_format).

### Tunnel selection code checkpoint

Located original tunnel branches at MS90 image offset `0x112f2` and MS91
`0x11266`. Their roof height 144, outer half-width 270, roof plane 133, paved
half-width 120 and side/end wall IDs match. MS91 caches absolute X where MS90
calls the signed-absolute helper; changed instruction layout is not by itself
a changed geometry rule.

`compare_original_tunnel_selection.py` executed both original branches for 1054
boundary/random point pairs. Surface, plane, wall and wall-height outputs match;
each branch reaches its common exit and diverse roof/wall/outside outputs are
asserted. Initial harness runs without an exit check were invalidated: CS=0 was
incorrect for instructions above 64 KiB. The verified run uses CS=0x1000.

This closes bounded tunnel **selection** parity, not roof underside collision.
The reported gameplay difference must be traced in later contact/response logic
or associated tables; do not remove that open item based on this test.

### Underside guard code checkpoint

Original MS90 guard at `0x7f57` and MS91 at `0x7f70` both test their underside
flag, old local Y below −12 and proposed local Y below −12. Proposed Y at/below
−24 takes the ground-plane fallback; the intervening range requests crash event
5. `compare_original_underside_guard.py` executes both guards for 288 signed
boundary combinations, stopping at identified normal/fallback/crash-call paths.
Every path matches the original-derived classification. All three outcomes and
both flag states are exercised, including extreme signed words.

This confirms the guard, not crash-handler side effects, full plane movement,
normal/rotation tables or tunnel traversal. Those remain open; no speculative
MS91 tunnel override was added to the web engine from the community report.

## Integration changes — not historical physics differences

- Immutable explicit engine identity for new records; absent old metadata means
  legacy. Unknown identities are rejected rather than guessed.
- Rankings, history and retention scoped by engine, preserving old rows.
- Private `.HIG` legacy tables remain untouched; newer test tables use `.M91`
  (experimental BB tables `.B91`). Native menus still request their usual names.
- Private imports require recorded-version selection; backups preserve engine
  metadata; public/private download notices identify the recorded engine.
- Future default remains legacy until release gates pass. Loopback-only
  `preview-engine` enables local fresh-race QA; public hosts ignore it.

## Remaining exhaustive-audit work

PC15 sample startup versioned (2026-10-11): beginOriginalPcSpeakerSample
and sample-note wrapper accept explicit engine, shift sample fields/table by10,
map sample divisor1ad→1af and install IRQ06dc→0701. Rate/divisor/table
arithmetic unchanged. Original routines076c/0791 executed for1000 cases per
release with varied rate/repeats/source lengths, active replacement, saved
vectors/masks and forced wrapped-end-zero early exits. Complete driver bytes,
ordered virtual ports and virtual IRQ-vector result match all2000 cases.
Evidence /private/tmp/pc15-sample-start-20261011-a.json. No playback/hardware
used. Full allocated startup/resource/host/scheduling and active sequencer
integration still outstanding; component completion is not release readiness.

PC15 sample IRQ versioned (2026-10-11): MS1991 sample fields/table move by10
bytes, IRQ entry06dc→0701. Both original lookup instructions explicitly contain
CS prefix2ed7 (Capstone rendering alone omits that detail); segment behavior
is unchanged. stepOriginalPcSpeakerSample accepts optional engine and maps
fraction/source/repetition/lookup/timer fields, forwarding sample restoration.
Original handlers executed in isolated RAM with distinct interrupted DS and
sample segment, intercepted ports and virtual IVT. All2000 driver/ordered-port/
vector results match;200 chained IRQs and327 sample restorations exercised.
Evidence /private/tmp/pc15-sample-irq-20261011-a.json. Full sample startup and
allocated host/resource pipeline remain outstanding; no hardware/audio used.

PC15 music/stop forwarding staged (2026-10-11): music seed optional engine
routes note masks, volumes, voice updates, output and track reset/stop; modern
seed rejects anything other than7 voices and complete2e9 driver state. Track
stop forwards sample restoration identity; effect stop forwards it through the
owned timer path. test_pc15_seven_slot_note.ts exercises common original note
allocator plus PC15 note adapter: modern bank mask96 allocates slot5/6 and
starts its retained flag, legacy5-slot masks return no voice. Test and typecheck
pass. Full original active music/effect sequencing, resource/host routing and
sample startup/IRQ remain open; this does not enable public modern PC15 audio.

PC15 callback forwarding staged (2026-10-11): optional physicsEngine now
travels with canonical engine/effect/voice state. Engine/effect note allocation
uses5 or7 masks; engine/live/effect-mute gains, voice-update/output and reset
silence/sample restoration forward identity. Engine/effect/voice results retain
explicit identity without adding fields to omitted/default legacy results.
The2000 original output corpus also runs through the timer wrapper with
inactive sequencer records: complete driver and ordered port writes match, and
engine identity survives. Typecheck passes. Active allocation/effect pipelines,
music forwarding, sample startup/IRQ and allocated host/resource routing still
need validation before modern PC15 playback is enabled.

PC15 sample-timer restoration versioned (2026-10-11): original modern06a8
restores shifted vector2dd/2df, timer2e1/2e2 and IRQ mask2e7; sample-active
flag1a8 stays unchanged. restoreOriginalPcSpeakerSampleTimer now takes explicit
optional engine and shifts these sample fields by10 bytes. Original near-return
routines compared for1000 cases per release, including active/inactive sample,
zero/nonzero saved vectors and varied timer/mask values. Complete driver bytes,
ordered virtual port writes and virtual IVT restore match all2000 cases.
Evidence /private/tmp/pc15-restore-20261011-a.json. Modern canonical driver
span corrected from initialization-only2e1 to2e9, covering late sample fields;
legacy2df unchanged, updated whole-memory codec tests pass. Full sample startup/
IRQ and allocated integration remain unverified; no physical audio/IRQ touched.

PC15 canonical state codec versioned (2026-10-11): read/write optional engine
keeps default/legacy5 voice records and2df driver bytes; explicitMS1991 carries
7 records and2e1 bytes, enough for the shifted timer words. Identity preserved
in the returned state. test_versioned_pc15_memory.ts verifies exact whole-memory
round trips, owned last-slot/last-driver-byte writes, every unrelated byte
unchanged, and partial-bank rejection before writes for default/MS90/MS91.
Typecheck passes. This is canonical adapter coverage, not independent original
global-data relocation evidence or an enabled modern audio pipeline. Allocated
host forwarding and remaining sample/pause/reset dependencies stay open.

PC15 voice/volume callbacks versioned (2026-10-11): original modern voice
update0423..0536 differs in divisor storage1af+2×slot versus legacy1ad;
volume callback03b8 stores1bd+slot versus legacy1b7. Explicit optional engine
added to updateOriginalPcSpeakerVoice/setOriginalPcSpeakerVolume, preserving
legacy defaults. check_original_pc15_update.py executes both originals for
1000 seeded cases each (active/inactive voice, signed offsets/bends, modulation
flags, wrapped values, available melodic slots) plus volume callbacks.
check_pc15_update_oracle.ts matches complete driver/voice output in all2000
cases and full driver output after volume. Evidence
/private/tmp/pc15-update-20261011-a.json. No audio/hardware invoked. Seven-slot
allocated state, resource-bank routing, sample/pause/reset remain unfinished;
component implementations are not yet the enabled MS1991 PC15 pipeline.

PC15 output callback implemented (2026-10-11): explicit MS1991 branch in
stepOriginalPcSpeakerOutput matches original05df..06a7. It masks six melodic
flags by volume, prioritizes slot6 then5, otherwise retains alternating1/2
and3/4 groups; sample slot0 suppresses tone writes. Divisors use1af+2×slot,
filtered flags1c4..1ca and phase1cb. Legacy/default path unchanged. Original
callbacks executed for1000 cases per release with varied enabled flags,
volumes, divisors, phase and port61; reconstruction matches entire driver bytes
and ordered virtual writes for all2000 cases. Evidence
/private/tmp/pc15-output-20261011-a.json. No hardware/audio played. This is
output-component parity, not allocation/note/update/memory integration; the
full MS1991 PC15 path remains gated pending those dependencies.

PC15 initialization component implemented (2026-10-11): explicit optional
engine on initializeOriginalPcSpeaker/silenceOriginalPcSpeaker preserves
legacy/default; MS1991 clears six melodic flags1a9..1ae, zeros timer words
2dd/2df, initializes the original five volume bytes1bd..1c1, returns7 slots.
Isolated originals captured by check_original_pc15_init.py --output and
check_pc15_init_oracle.ts compare the complete loaded driver bytes and virtual
port writes exactly for both releases. Evidence /private/tmp/pc15-init-20261011-a.json.
Typecheck passes. This component is not yet wired to the modern allocated
audio path; output callbacks/voice masks/memory layout still require completion
before enabling seven-slot playback. No physical sound was played.

PC15 channel-layout difference confirmed (2026-10-11): original PCENG1
entry offset12 is the instrumentMask word consumed by note-start hardware
voice allocation. The new20 and96 masks select different logical slots from
old10; not sound-duration changes. Original PC15 initialization0000→02e8
returns5 channels; MS91 0000→02f2 returns7. check_original_pc15_init.py executes
both original drivers in isolated RAM and intercepts IN/OUT: both return the
expected count, emit only virtual43:B6 and61:00 writes, no hardware/audio.
Modern volume storage moves1b7→1bd; note-start flag base1a8 stays identical.
Current pc-speaker-control/output runtime remains the older fixed-channel
layout. MS1991 PC15 path therefore needs explicit layout/callback routing and
original execution comparison; do not classify the audio upgrade complete.
Other output modes are separate; this finding does not imply their regression.

PC-speaker resource audit (2026-10-11): PCENG1.VCE declares1049 bytes in
both releases; MS90 has39 trailing FF bytes (actual1088), MS91 actual1049.
Within the declared ten-entry bank, six93-byte entries change only offset12:
STAR/STOP10→20; CRAS/BLOW/SCRA/BUMP10→96. Other entry bytes match. The
reproducible decoded-package tool now distinguishes raw declared payload and
trailing bytes rather than treating the legacy parse-length mismatch as parity.
native-audio.ts's AdLib path reads ADENG1.VCE, not PCENG1.VCE; allocated PC15
is a separate supported path. Driver interpretation and corresponding changes
remain unverified; do not replace voices or declare complete audio parity yet.

Retained Jaguar bank follow-up: same-car replay loads can skip resource
reload, so metadata must also be applied at allocated replay initialization.
Helper now restores136,148 for legacy/default and0,0 forMS1991; experimental
BB remains untouched. Dashboard-disabled races skip absent/stale instrument
banks. Expanded allocated startup test cyclesMS1991→MS90→MS1991→MS90 from
both initial engines, checks coordinates and renders after seek0; replay
bytes unchanged. Four-layout isolation/disabled-dashboard tests, pretest and
typecheck pass. This closes this retained-bank metadata gap, not all visual QA.

Jaguar metadata integration (2026-10-11): bitmap header words8/10 are draw
coordinates, confirmed by packed/indexed/planar bitmap routines. ins3 is the
right-turn instrument OR layer (cockpit-frame.ts pointer5482), not the gear
window. applyVersionedCockpitMetadata now changes only its owned loaded
MS1991 Jaguar header from136,148 to0,0; original resource files/pixels remain
untouched. Engine is forwarded through fresh MCGA entry, alternative display
startup and replay reload. Actual allocated Jaguar startup renders with the
verified coordinates for both versions. Four-layout helper checks prove only
two differing bytes and no legacy/experimentalBB/pixel mutation. Broader visual
QA and complete resource audit remain open; this is not all-car visual proof.

Decoded distribution bitmap audit (2026-10-11): new reproducible
audit_original_decoded_packages.py reads untouched ZIPs, compares changed
shared packed resource entries, and explicitly leaves other formats
unclassified. STDAJAGU.PVS differs only in ins3:1648 bytes both, exactly two
changed bytes at offsets8 and10 (136→0,148→0). All bytes after the16-byte
bitmap header match; no Jaguar image-pixel replacement is justified by this
difference. SDTITL.PVS changes titl:64016 bytes both,372 changed bytes,
including2 header bytes and370 payload bytes; remaining entries identical.
Title changes are presentation, not physics. GAME/MISC/TEDIT and opponent
bank changed-entry sets match the earlier text/sped audit. Executable/audio
driver formats remain explicitly unclassified; item25 remains open.

Paired-car overlap extension (2026-10-11): --paired in
compare_original_divider_overlap.py executes the complete MS90 ae4a and MS91
b50e overlap routines, with original identity/right-angle caches initialized.
1000 seeded cases cycle all11car dimensions with independent pitch/roll/yaw
for both vehicles, varying signed separations. Original releases agree in all
cases; check_paired_car_overlap_oracle.ts matches the web result (18 hits,
982 non-hits). Evidence /private/tmp/ms91-paired-overlap-20261011-a.json.
No gameplay change needed. This adds two-rotated-car coverage beyond previous
car/tree probes, not proof of all possible signed positions or branch inputs.

Car-contact response correction (2026-10-11): MS90 helper187a:04ee at
image18c8e subtracts the signed truncated quarter of wrapped768×relative
speed without a low-speed guard. MS91 helpera990 uses signed arithmetic shift
at aa78/aa7a, stores reduction, and unsigned comparison aa82 clamps road speed
to zero when below reduction; otherwise subtracts. Earlier reconstructed
carContactResponse always used the legacy response. Added MS1991-only routing
through raceCarContact and moveTrack; missing identity/MS90 and experimental
BB behavior remain unchanged. check_original_car_contact.py executes complete
paired original helpers with original data/math for1000 seeded cases. Both
versions match reconstruction exactly;681 paired results differ. Evidence:
/private/tmp/car-contact-original-20261011-a.json. Dedicated collision wrapper
test, type checking and broad npm test pass. This is response-helper evidence,
not all overlap-selection branches or complete two-car race verification.

10Hz component audit follow-up (2026-10-11): compare_original_1991_engine.py
executed complete original grip and engine routines with1000 synthetic states
each, cycling all eleven original SIMD car resources. BB11 and MS91 outputs
matched at10Hz. check_ms91_grip_oracle.ts and check_ms91_engine_oracle.ts then
matched reconstructed MS91 results to all1000 original outputs in each bank.
Evidence: /private/tmp/ms91-grip10-20261011-a.json and
/private/tmp/ms91-engine10-20261011-a.json. This covers those component states,
not whole-race timing, every exceptional state, or fresh browser10Hz finishing.

Decoded menu classification: emdo/emen/erbf, edos/efex, emid/emop and all four
changed editor dialogs replace the old adjacent delimiters with the newer
spaced-group delimiter; wording is otherwise unchanged before NUL. gver updates
the release date. emrl adds video-management and simulation-rate controls;
emrs is their next-race notice. emer expands out-of-memory guidance; new ejox
reports incomplete joystick calibration. The current MS91 overlay now includes
both texts; editor emen is separately bank-scoped because GAME uses that ID for
a different dialog. Original-text comparison verifies all15 changed/new texts.
Complete interaction and executable/driver classification remain separate
unfinished checks; resource text parity is not physics equivalence.

Decoded original-ZIP bank audit is reproducible with
audit_original_resource_banks.py (no source writes). GAME20 entries:17 identical,
only emdo/emen/erbf differ (1/2/1 bytes). MAIN32→34:28 identical; edos/efex each
change1 byte, emer22→107 and emrl118→237, plus new ejox/emrs. MISC161:158
identical, only emid/emop/gver differ (1/1/5 bytes). TEDIT74:70 identical, echl/
echx/emen/emss each differ1 byte. Each opponent bank27:26 identical, only sped
changes (one byte for1..5,three for6). This establishes entry-level identity;
it does not infer behavior from compressed size or omit staged decompression
tails already required by the verified opponent-resource loader.
Collision tables remain among unchanged GAME entries; the meaningful body
collision change is executable logic/cache lifecycle, not altered plane assets.
Display/menu text and resource descriptors still need complete classification
alongside the changed executable/driver/image files; item25 remains open.

Original distribution inventory (not the extracted test directories) is now
reproducibly compared by audit_original_package_inventory.mjs. MS90 ZIP SHA256
bbbfa96c9a1199ce67ee63716cfb1a95c2fd820c73cdbff523f8ba39566e4ed1;
MS91 ZIP SHA256747b31004d7df962d02e2167ec9e5191f597f370463f86cd0c56dd8cc27c80a7.
131 versus129 files:91 byte-identical,37 changed shared names,3 old-only and1
new-only. All11 CAR*.RES and all11 ST*.P3S car shapes are byte-identical; so
are the panorama files, fonts, MT32 patch bank and most audio voices/music.
Changed groups include display code/header/difference files, GAME/MAIN/MISC/
TEDIT banks, all six opponent banks, audio drivers and PCENG1 voice, SETUP/LOAD,
title image, Jaguar showroom image and four standard tracks/default replay.
CHERRY.TRK versus CHERRIS.TRK and old icon files are package inventory differences,
not proof of engine behavior. The preliminary extracted-directory comparison
also included test replays added locally; it is not distribution evidence.
This closes inventory identity, not semantic classification of every changed bank;
release checklist item25 therefore remains open.

2026-10-11 integration update: body-plane logic is now connected to native
player/opponent movement, initialized from each retained previous position,
and preserved by explicit1120-byte checkpoints plus an owned48-byte live tail.
Five original full-race captures match10893 frames including player cache bytes;
six opponent captures match15336 frames including both caches. Controlled
movement agrees for all11 cars/eight rolls (88 cases,55 collisions), comparing
final pose, speed, crash and cache. Older disconnected/component-only notes
below are historical and superseded, not current blockers.

The complete chassis structural diff was rerun unchanged:2421 legacy versus
2400 modern instructions,85 changed groups. It still is not a semantic proof:
address normalization can hide relocated constants, and register-load changes
need live-range reasoning. Known meaningful groups include cadence scaling,
signed rounding, landing thresholds and body-cache/sign guards. Tunnel roof
and underside exceptional branches remain an explicit next audit target.
Both web engines also pass768 divider-top selection/height-filter cases again;
that bounded test does not replace full original-version passage evidence.

Direct full original body-phase tests now cover eight Countach roll poses,
five producing event5. The initial isolated component stopped cache updates
at the first collision; original execution disproved that assumption. Original
event5 returns to the loop, processes remaining points and commits all four
body-cache vectors (including colliding points). The component now follows that
order and all eight collision decisions/cache banks match. Earlier language
about a collision exit retaining a partial cache is superseded. Component
remains disconnected; retained pose/crash response and checkpoint integration
still require explicit tests before activation.

Body component non-collision corpus now passes all five original captures,
10788 eligible frames, not just AUDI. The original chassis harness now records
body-loop entry, actual crash-event requests and proposed (pre-commit) pose
from the exact original final-commit source fields. Stationary Countach confirms
body phase reached, proposed[690432,512,805760], no crash request. This supplies
observability for collision-exit/partial-cache tests; those tests are not yet
passing merely because the instrumentation works.

Isolated `bodyPlaneContact` now implements the inferred current/previous plane
selection and cache-write sequence but remains DISCONNECTED from races.
Its sign guard matches243 original-verified boundary/intro cases. On the
AUDI original capture,2535 non-crashed frames match retained body caches and
non-collision outcomes. This does not prove collision exits, partial cache
writes, scene-global retention or replay/checkpoint integration. Those remain
requirements before activating the component.

Body-height geometry now has direct capture evidence: `bodyPlanePoints`
matches all four retained original MS91 cache vectors in10788 non-crashed
frames across the user's QA_LOOP and the four competition captures (COUN,
AUDI, PC04, PMIN). It uses wheel-local X/Z, height<<6, proposed pose rotation
and signed world-coordinate conversion. Post-crash cache-retention paths are
explicitly excluded from this geometry-only comparison. This helper is NOT
yet wired into simulation or checkpoint state; plane lifecycle remains open.

Body-plane cache update order is now located: MS91 8AB6 selects at the new
body-height point while supplying the retained point as the selector's output
buffer; 8ACF computes its plane distance. Plane IDs below4 take an immediate
nonpositive-distance collision path; IDs4+ additionally select the previous
point and compare plane identity before sign crossing. Cache writes occur on
the non-collision path at89D5..89F3. The bypass byte AAB6 corresponds to the
runtime-mode role (original update96B0, versus MS90 EGA A81E at96EA), not a
plane-selector output: selector105C8 does not reference AAB6. Keep this separate
from the per-race state byte9595. Corresponding web state currently represents
runtime mode at nativeDS A3C2. Direct lifecycle tests still required.

Cached-plane lifecycle refinement: original MS91 89F8..8A75 loops four
vectors sourced from SIMD+D2 (wheel-local X/Z) but REPLACES local Y with
SIMD+CA (car height) shifted by6 before transforming with the proposed body
orientation/position. Thus the added car+8C bank is not simply the wheel
contact history; treating it as such would be incorrect. The web contact
history and existing landmark overlap are distinct. This body-height plane
crossing/cache path must be integrated only after its selection/cache update
semantics are verified, preserving legacy memory/layout and replay checkpoints.

Direct original cached-plane guard evidence:243 signed-boundary/flag cases
pass in `compare_original_cached_plane_guard.py`. MS90's isolated guard requests
event5 for distance crossings strictly beyond±6; MS91 uses strict opposite
signs around0 and bypasses this guard when DS AAB6 is exactly1. Zero boundaries
do not request the event. There are56 differing combinations in this bounded
grid. The probe stops before event side effects and does not establish the
enclosing plane selection/cache lifecycle. That lifecycle and corresponding
web integration still need verification before declaring the chassis complete.

Chassis changed-block review has now identified these concrete instruction
groups (not yet a semantic classification of every normalized block):

- MS90 7550..755C sign/absolute/truncate steering quartering becomes MS91
  7585/7587 arithmetic right shifts, consistent with implemented signed rounding.
- MS91 7596..75A5 selects movement divisor1E00 at10Hz versus normal3C00;
  the slow fall path at7DAD..7DC9 adds a second fall increment/displacement.
- MS90 7C05..7C11 signed truncation around an eight-bit shift becomes MS91
  7C19's direct signed shift, another rounding site to cross-check.
- Landing comparisons change190→250 and931→23275; direct boundary probes and
  implementation already cover these thresholds.
- MS91 8953..8AAC replaces temporary long-coordinate selection with a retained
  extra car+8C coordinate bank, invokes original plane selector105C8, and changes
  comparisons formerly using ±6 to sign/zero checks, with DS AAB6 influencing
  acceptance. This enclosing cached-plane/reselection path needs direct branch
  tests; ordinary replay parity must not substitute for those tests.

Removed register reloads, changed local-stack offsets and call relocation remain
review items until dataflow/targets are checked, not assumed physics changes.

Complete chassis structural inventory now decodes every byte of MS90
74DE..8F7C (2421instructions) and MS91 751C..8F4A (2400instructions), with
validated prologues/final epilogues. `audit_original_chassis_structure.py`
identifies85 changed blocks after address normalization, retaining raw operands
for semantic review. This includes compiler/register differences:85 is NOT a
count of physics changes. Stack allocation changes1E2→1E4. Full branch review
is still open; this inventory is a targeting aid, not an equivalence proof.

### Split-first-element investigation: finish gate located

Original MS90 controlled execution now matches the complete184-byte retained
player car for all400 fresh inputs on the same split-first course. It runs the
original9640 update loop with explicitly prepared memory, input-bank writes and
muted driver boundaries; preparation itself is supplied by the web fixture,
so this is not independent original-loader verification. Together with MS91's
independently prepared original run, this shows no observed difference on this
one incomplete passage. Full completed branches and other layouts remain open.

Actual MS91 original execution on `SPLIT-CLOSED.TRK` now covers400 fresh
acceleration inputs with no finish (finish ticks0, crash0). The web MS91 engine
matches every compared position/physics field through endpoint
[690424,477,1428348]. Temporary probes are not stored/published races.
`compare_external_replay.ts --no-finish-expected` explicitly requires zero
original/web finish time and no player finish, while retaining all trajectory
assertions; ordinary completed-race comparisons remain unchanged. This tests
one incomplete first-split passage only. MS90 comparison and completed branch
routes are still required to settle the claimed version difference.

Fixture construction now succeeds: route traversal stores the fork's alternate
link on its preceding start node, not the first fork record. Corrected generator
requires BOTH arms to return to start rather than accepting a dead-end branch.
Selected isolated `SPLIT-CLOSED.TRK` uses fork75, merge81, corners6/8,
23route nodes and alternate node16; nine arrangements satisfy the requirements.
This is prepared-course evidence only; original gameplay remains to be tested.

Initial isolated fixture construction attempted a side loop around the start
using all single-cell two-record descriptors and corner orientations. The
generator correctly refused to emit a course: none met valid prepared routing
with a first-element secondary branch. `create_split_first_probe.ts` is currently
an unfinished fixture generator, not a passing regression. Next inspect the
route rejection diagnostics and construct a valid fork/merge course; do not
infer game behaviour from this unsuccessful fixture search.

`compare_original_player_route_progress.py` directly executes both original
changed-route branches over2304 combinations of route status, confirmations,
lap-byte wrap, previous/current route and signed lookup delta. Lap, route,
penalty and display outputs match at20Hz. The modern total-penalty address is
DS92EA, confirmed by the ADD instruction at99A5; DS92E6 is not that field.
This rules out a difference in these bounded transition cases, not in the
earlier route lookup/initialization or an actual split-first track.

Current original EGA disassembly locates the player finish gate at MS90
`9D9D` (lap byteDS9149) and MS91 `9D6F` (lap byteDS93BF). Both skip the
finish test when that byte is zero, then compute the signed start-line crossing
from position>>6 and the start heading. Both dispatch player finish event3
only for a negative crossing. This identifies the enclosing gate; it does NOT
explain whether a split as the first element changes the lap byte earlier.
The differing addresses are not by themselves a behaviour change. Next inspect
the route-transition/lap increment and reproduce an actual split-first course.

### SETUP.EXE — explicitly included

The user also reported setup changes. The original package copies confirm:

- MS90 SETUP.EXE: 15072 bytes, SHA-256
  `abd0de414c44a2563165f2560f1c2cbf9dfc2361378f38a4520e5f366392ab86`.
- MS91 SETUP.EXE: 15065 bytes, SHA-256
  `fa3b53a43e37ddc11c62c40cfb98fa5b61fd158250a6b84155785273b54c9454`.
- Their bundled SETUP.DAT bytes compare identically. Executable inequality does
  not establish a particular setting or menu behavior change.

`tools/audit_setup_releases.py` then decoded and relocated both EXEPACK programs
at the same base. All **14736 initialized program bytes match exactly**, SHA-256
`50c15b74337ec6178c039c956fc88d538623a36fbf642001dce12134896e59fd`.
EXEPACK entry metadata matches, and the MZ headers differ only in the final-page
file-byte count. Extracted sound/video/main menu data and both help sections also
match, including their offsets. No SETUP code/data change is established between
these exact packages; the seven-byte packed-file difference is not evidence of a
settings change. The web setup should not be altered on that basis.

Scope limitation: initialized program equality under the same relocation base
does not test every hardware/DOS-environment-dependent outcome. Paired setup
interaction runs remain useful regression evidence. Reports referring to other
publishers/releases or repacked packages need their exact source identified.

### Remaining checklist

1. Compare complete chassis, suspension, wheel/plane, wall, tunnel/underside,
   elevated track and stunt-selection routines, including their tables and all
   exceptional branches. Record unchanged areas as well as changed ones.
2. Compare race initialization, timing/input cadence, opponent paths, start/finish,
   route transitions, replay continuation/rewind and result classification.
3. Compare resource inventories and relevant raw physics tables across originals;
   document display/audio/menu differences separately from physics. The browser
   UI/enhanced rendering is not automatically replaced by original MS91 artwork.
4. Reproduce each confirmed difference with a bounded test and link its original
   evidence; obtain precise original MS91 finish/contact evidence for full races.
5. Complete browser fresh-race/result, legacy playback, restore and language QA,
   then update public documentation from verified findings only.

Do not mark this audit complete while any of these areas is unexamined. No
production deployment or old replay/score conversion is authorized by this file.
