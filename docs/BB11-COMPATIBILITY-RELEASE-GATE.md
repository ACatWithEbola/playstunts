# Mindscape February 1991 compatibility release gate

Target: Mindscape 4D Sports Driving 1.1, 25 February 1991 (MS91).

## Latest release audit status

2026-10-11 current corrected harness passes `check_ms91_chassis_car_corpus.ts
--combined` across all11 original car resources and33 engine/grip/contact
cases. This revalidates targeted hooks/cache changes without calling bounded
single-step coverage exhaustive physics verification. Resources unchanged.

Current consolidated scope and remaining requirements:
[`MS91-CURRENT-RELEASE-STATUS.md`](MS91-CURRENT-RELEASE-STATUS.md).
2026-10-11 renderer corpus passes all four complete references in both video
policies, with sampled pixels/enhanced calls/wheels/masks/state and mid-race
switches checked through each finish. This is not fresh browser visual QA.

2026-10-11 current four-reference server-verification corpus passes actual
isolated reassessment, original source preservation and unchanged legacy route
tables; four race/save/backup/download/reload/private-score lifecycle references
pass; `test:cadence-safety` passes including legacy identity and rejection of
false engine relabeling. No production database accessed. Cross-engine load
initial invocation rejected its missing original-reference argument before
running; corrected invocation includes the original reconstruction and is
being checked separately. Do not count the rejected invocation as a pass.

2026-10-11 fresh source checkpoint captures1663entries including recent original
engine probes and Buffer fixes: `PlayStunts-backups/2026-10-11-ms91-original-corpus-checkpoint`,
SHA256 bd5d7b59aa516f126e2f4f105ff28edb86013121c00653b0f7f264d168ba9008.
Checksum verified, safely restored into a new temporary directory, asset links
remain links, eight recent critical files compare byte-identically to current
source. Future-race rollback tests pass; public default remains MS90. This
SOURCE backup excludes production database/replay data and external asset
contents; those need separate preservation for a production release.

2026-10-11 broad current-tree regression run PASSES: `npm test` including
pretest original-renderer identity, MS91 car/fireball region adapters and128
EGA software sprite cases; baseline audio/replay controls/results/enhanced
graphics/shadows/chase/wall/post/MT32/default-setup regressions all exit0.
`test:ms91-import-lifecycle`, `test:ms91-time`, Buffer-isolation regression and
`npx tsc --noEmit` pass. `npm run build` completes all five environments and492
language messages; chunk-size/deprecation/static-classification warnings remain,
not build errors. This is code/build evidence, not fresh browser visual QA or
authorization to publish. Public defaults remain legacy; stored/live data untouched.

2026-10-11 cadence regression resolved: stale experimental-session assertion
now checks MS91 download cadence/canonical byte preservation instead of expecting
all10Hz downloads to reject. No cadence policy changed: normal10Hz session entry
still rejects. `test:ms91-slow`, native slow download versus original MS91
DEFAULT.RPL, native download tests and TypeScript checks pass. Buffer copy
isolation now also covers native legacy replay/track downloads, preserving the
copy-only contract for sliced Node Buffers. Stored/live data unchanged.

2026-10-11 Buffer-offset replay regression fixed locally: canonical header
DataView now respects byteOffset/byteLength; legacy versioned export/import
returns independent Uint8Array copies even for Buffer inputs. New
`test_replay_buffer_offset.ts` passes both version round-trips and mutation
isolation. Existing cadence/header checks pass, but `test:ms91-slow` currently
FAILS an expected-exception assertion at experimental_slow_session.ts:34
(`10 Hz replay downloads`). Investigate current policy versus stale test;
do not treat the suite as passed or change policy simply to satisfy it.

2026-10-11 controlled Marco divider passage now matches original MS91 player
physics for46 sequential recorded inputs, starting from unchanged legacy replay
frame1504. `create_divider_controlled_probe.ts` creates isolated208-byte modern
car-state and26-byte-header format copies in `/private/tmp/ms91-divider-controlled.KEpMp7`;
these are explicitly non-publishable probes, not replay conversion. Original
player physics and web match position, rotation, engine/grip/suspension, wheel
coordinates and crash-free status at EVERY step through frame1550. Endpoint
[325707,1996,1340589]. This closes the controlled MS91 physics passage only;
whole original MS90 replay and surrounding full race/navigation remain separate.
No stored replay/score changed. Test exporter normalizes Node Buffer to a plain
Uint8Array before calling the replay codec because Buffer.slice retains its offset.

2026-10-11 corrected direct original MS91 opponent corpus PASSES all six
AUDI/ZCT300 cases, 2556 frames each (15336 total), including compared player
and opponent position/physics/route fields, with finish2536 in every case.
Fresh captures: `/private/tmp/ms91-opponent-corrected.oWYLqf/OPP1.BIN`–
`OPP6.BIN`. Sources unchanged; original compressed staging tails retained.
This closes these six full-race cases, not all cars/tracks/opponent branches.
No production physics change was needed. Broader release gates remain open.

2026-10-11 OPP5 frame381 discrepancy resolved as an isolated harness loader
omission, not a production physics change. Original lookup received route
entry68 while the web received entry5: the host boundary had omitted surviving
compressed VLE bytes beyond the sixteen-byte sped resource. The harness now
stages packed bytes at the original paragraph-aligned high end before writing
the unpacked bank. New `OPP5-TAIL.BIN` matches all compared player/opponent
fields for2556frames and finish2536. The earlier OPP5.BIN remains an explicitly
invalid missing-tail capture. Re-run all six with this corrected loader before
clearing this gate; no source replay/resource or production logic was changed.

2026-10-11 direct original MS91 two-car capture comparisons: OPP1–4/AUDI
each pass all compared player/opponent fields over 2556 frames, finish2536.
Captures are `/private/tmp/ms91-opponent-full.WSvGnB/OPP1.BIN` through
`OPP5.BIN`. OPP5 player trajectory/finish also matches, but opponent fields
first diverge at frame381 (route vectors, X/Z, steering/speed); therefore the
two-car gate remains FAILED/under investigation. OPP6 has not run in this
batch, which stopped on OPP5's assertion. Do not substitute earlier independent
C passes for this original-executable failure. Targeted diagnostic hooks now
avoid whole-replay Python tracing; OPP1 retained its original slower full trace.

2026-10-11 all six original MS91 opponent preparation cases now pass: each
original loader returns, all 16 speed bytes and all 67 selected path words
match the web implementation, using captured 256-byte adjacent-memory costs.
All source files remain unchanged. The full OPP1/AUDI 2556-frame original
two-car capture has been launched separately; it is not yet a passing result.
The harness explicitly rejects opponent checks without original preparation
or with mismatched player/opponent car types until separate SIMD support exists.

2026-10-11 opponent setup failure tracing identified missing original language
selection: locate_text_res1aedc prefixes the name with DSb162. Static DS leaves
it zero, while original OPP1 contains enam rather than plain nam. Harness now
validates that original instruction/resource and supplies English selector'e',
without bypassing resource lookup. Opponent setup still fails elsewhere and
remains unverified; recent original calls are retained for diagnosis.

2026-10-11 direct opponent setup harness is incomplete: original loader13bf2
was identified and attempted with matching OPP1.PRE and opponent-selected Audi
recording. It currently reaches BIOS keyboard instruction22e51 and fails in
Unicorn, so no opponent preparation or two-car original parity pass is claimed.
The host file/resource boundary and initialization need diagnosis. Existing
single-player original captures and six C-reference opponent passes are
separate evidence; no production code, stored replay or score was changed.

2026-10-11 corrected Carrera original MS91 full-loop capture passes2264
frames/2244 original finish ticks with zero compared field differences.
ERI300-PC04.BIN supersedes the explicitly invalid wrong-car artifact, not the
unchanged source replay. All four competition recordings now have actual
Mindscape full-loop evidence:10097 frames on two tracks; with QQALAP796 this
totals10893 compared frames. Opponent, remaining branch/render/platform and
release/default/deployment gates still need completion before publication.

2026-10-11 actual MS91 full-loop competition captures pass Indy ZCT2991471
frames/1451 finish, Audi ZCT3002556/2536 and Countach ZCT2993806/3786. Every
compared player position/physics field agrees; endpoint and original stored
finish ticks match. Artifacts ARG299/MAR300/STB299.BIN under
/private/tmp/ms91-full-race.g2KSc3. The first Porsche attempt used P962 instead
of replay headerPC04 and failed from frame1; ERI300.BIN is invalid evidence.
Added fail-closed car/header identity guard for recorded controls. Correct
Carrera rerun uses a new ERI300-PC04.BIN path and is pending; old recording
bytes are untouched. No wrong-car result is counted toward parity.

2026-10-11 first actual MS91 full-loop replay differential passes: original
update_gamestate9606 runs input/start gating, checkpoint copies, frame clock,
complete player navigation/finish and per-frame tail. All796 QQALAP states
captured from actual DS91a0 in a new exclusive artifact
/private/tmp/ms91-full-race.g2KSc3/QQALAP.BIN. Existing differential comparator
reports zero differences across all compared position/physics fields and
original finish776. Endpoint689078,560,848237 matches full native playback;
the prior physics-only endpoint difference is explained by omitted loop gating.
Original checkpoint arena is isolated atb0000. This closes one actual original
single-player full-race case, not all cars/tracks/opponents/display release gates.

2026-10-11 original finish-clock integration yields correct776 ticks for
QQALAP. Before complete player_op, harness now executes original update_gamestate
frame increment9677..967b and asserts the retained frame word92e0. Original
finish routine records92e2=776 at finish frame776 (0:38.80 at20 Hz), not a
host-supplied finish value. This is finish-clock/player-op evidence; full
enclosing update_gamestate input/start gating, navigation-state differential
and complete car endpoint equality remain unverified. No IRQ/audio timer runs.

2026-10-11 complete original MS91 player_op now executes all796 QQALAP
controls after actual race initialization. It detects finish/crash3 at frame776,
matching the web accepted input count, and ends at689343,548,849894. This is
not yet full-race parity: the external clock/timer stage is not stepped, so
stored finish ticks remain0. Also full-navigation car state must be compared
with the complete web player step, not the physics-only stage. --full-player
requires --race-init and a proper far return; no partial routine is relabeled.

2026-10-11 actual original race initializer9100 executes successfully in the
combined context with mode0 and actual SIMD globals/drag/resource/track data.
It returns with correct far-return stack and prepares player/opponent route
targets. Following accelerated original physical stage yields the expected
Countach position690432,512,805774/crash0. --race-init records execution but
does not claim route-state equality, full navigation or finish parity yet.
This provides original initialization for the next complete player_op test.

2026-10-11 direct original MS91 physical trajectory now matches all796 actual
controls from the user's QQALAP download. Original and web retain independent
state; every frame's decoded engine/grip/pose/rotation/suspension/wheel fields
agree with full landmark/start-post context. Input bytes are checked against
the source and never rewritten. This runs the physical player_op prefix only:
without navigation/finish handling the endpoint689343,548,854772 differs from
the completed-race endpoint, so it is explicitly not a finish-time/full-race
claim. Full original navigation/result integration remains required.

2026-10-11 frame181 mismatch resolved as incomplete probe collision context,
not a production physics change. Original chassis uses start column96a6,
terrain row96aa, hill96a7, height table0180 and headinga21a. Harness now returns
these original values; web direct stage receives actual SIMD dimensions/radius,
landmarks and matching start posts, as the real native session already does.
The complete300-step input5 sequence now matches every asserted frame through
the post collision and stopped-crash early return. End pose693450,540,816189,
yaw955 and all wheel/engine/grip/suspension fields agree. No collision was
removed or bypassed to make it pass. Full original navigation/race still open.

2026-10-11 longer steering harness failure diagnosed: frame213 legitimately
takes player_op's stopped-crash early far return at9e13 to sentinel1000.
The harness previously waited only for9897 and ran into unused bytes/BIOS.
It now stops on1000 and validates far-return SPf004 as an allowed terminal.
With this diagnostic error fixed, the300-step differential test reveals a
real comparison mismatch at frame181: web position693642,540,816429 versus
original693280,540,815810. It remains FAIL, not waived. Need align full track
collision context (the web probe currently omits landmark/start-post context)
before attributing this to production physics. No live or stored-data change.

2026-10-11 retained-state combined driving comparison:100 consecutive
Countach acceleration steps match actual original MS91 at every frame in all
decoded engine/grip, pose/rotation, suspension and wheel fields. Both sides
retain their own state rather than reseeding from expected output. A longer
300-step input5 steering probe FAILS inside original execution at frame213,
loaded22e65 with CPU exception; no partial-prefix pass is claimed for that run.
Harness now reports exact failing frame/instruction. Need inspect that original
operation and missing context before diagnosing game code. Type checking passes.

2026-10-11 combined physical-stage corpus passes33 direct original MS91 cases
across11 original cars: input1 from stationary, input5 at road speed10000 and
input10 at30000. Complete decoded engine/grip fields and contact/pose/rotation/
suspension/surface/flag outputs match. --combined mode asserts exactly33 cases
and unchanged car source bytes; default22-contact case mode remains. These
are one-step probes, not sequential replay/race verification.

2026-10-11 direct combined MS91 physical-stage comparison passes three cases:
Countach stationary/input1, road speed10000/input5 and30000/input10.
Actual player_op prefix97e6..9897 includes original engine/steering/grip/chassis;
web stepTrack matches every decoded engine/grip field plus pose/rotation,
wheel points, suspension, surfaces and flags. This avoids start gating and
checks acceleration/braking with opposite steering directions. It stops before
navigation/penalty processing and is not complete player_op/race verification.
Type checking passes. Source recordings and public defaults remain unchanged.

2026-10-11 original combined physics stage located/executed: MS91 player_op
97e6..9897 runs engine a072, steering ac7a, grip a556 and chassis751c before
navigation/penalty processing. Harness supplies actual SIMD globalsab5e/a344,
cadence steering-table pointer and the previously audited quadratic drag bank.
Input1 from stationary Countach completes this original stage at expected
instruction9897, yielding position690432,512,805774 and crash0. This is a
combined-stage execution diagnostic, not yet a differential pass or full
player_op/navigation/race. --driving-step preserves that distinction.

2026-10-11 exact original MS91 landing sound boundary instrumented/passing:
height128/fall229 yields evolved front-wheel word250 at83f5, no83fc sound-bit
path; fall230 yields251 and executes83fc, setting bit32. All four wheels reach
the comparison and web soundFlags bit/pose/wheels/suspension/surfaces/speeds
match. No sound is played (Unicorn memory only). This complements the exact
23275/23276 crash boundary, not all original audio-device behavior or races.

2026-10-11 actual landing boundary branches now instrumented and passing.
Original840a compares the evolved fall word, not the supplied initial word;
front wheels add21 during this probe. Initial23254 yields compared23275,
does not execute crash path8411 and crash0. Initial23255 yields23276,
executes8411 and crash1. All four wheels reach comparison. Web pose/rotation,
wheel points, suspension, surfaces, flags and speeds match both actual original
branches. This verifies a precise MS91 threshold boundary in the initialized
Countach case, not every landing/contact context or full race trajectory.

2026-10-11 direct MS91 elevated/falling chassis probes pass: Countach initial
height1024, road speed1000 and four equal fall words1200,23274,23276. Complete
compared pose/rotation/wheels/suspension/surfaces/sound flags/wheel angle/road
speed/crash match actual original751c for each. These input values surround
the known landing constant but alone do not prove its branch was taken;
branch instrumentation is required before calling this a threshold-boundary
test. Full moving trajectories and collision side effects remain separate.

2026-10-11 stronger direct chassis corpus passes22 bounded MS91 cases across
all11 original car resources: stationary and30000/-81/64 speed/front/wheel
angle on flat QA_LOOP. Assertions now include pose/rotation, all four resolved
wheel points, all exposed suspension fields, surfaces, sound flags, wheel angle,
road speed and crash. Source car bytes remain unchanged. Runner explicitly
reports fullRaceVerified:false; stationary/moving contact probes do not cover
all stunt pieces, body collision globals or complete race trajectories.

2026-10-11 direct moving MS91 chassis probes pass three additional Countach
states on QA_LOOP: road-speed/front-angle/wheel-angle1000/-9/16,
10000/37/-32 and30000/-81/64. Web direct contact/reconstruction matches actual
original complete chassis position, all rotation axes, four resolved wheel
points and crash0; each uses one contact pass. These are controlled one-step
states, not full replays or proof of all collision/suspension fields. The
comparison now asserts rotation as well as position/wheels/crash. Originals,
stored recordings and website default remain unchanged.

2026-10-11 first direct stationary MS91 chassis contact comparison passes.
check_ms91_stationary_chassis.ts bypasses session start gating and compares
trackContact/reconstructPose with actual original751c output in combined
initialized context. Countach QA_LOOP position690432,512,805760, four distinct
resolved wheel points (Y2), crash0 and one web contact pass agree. Original
SIMD comes from the executed harness, not guessed geometry. This is a bounded
stationary contact/pose/wheel check, not a full moving race, all chassis fields
or collision-branch audit. Full direct MS91 trajectory remains required.

2026-10-11 first stationary comparison diagnostic: fresh web Countach starts
at690432,512,805760 and retains that pose/crash0 after the first zero-input
captured session frame, matching original chassis pose superficially. Web
wheel history remains all four initial centres while direct original chassis
updates four distinct wheel points. This is not equality: session start gating
must be aligned with a direct physical step before comparing wheel fields.
No pose-only agreement is counted as chassis parity. Initialization coordinates
are now independently confirmed through the actual allocated web session.

2026-10-11 initialized-context chassis diagnostic executes original751c for a
stationary Countach at explicit QA_LOOP starting coordinates690432,0,805760.
The full routine returns normally with crash0/current position690432,512,805760
and updates both wheel banks. Original resource banks and startup matrices
remain intact. --chassis-step reports before/after bytes and explicitly
comparisonVerified:false; no web-state differential assertion exists yet.
This is not a passing chassis gate: remaining collision globals/dimensions and
full-step state equality must be checked before using it as an oracle.

2026-10-11 original startup rotation caches added to combined context:
actual MS91 rotate-Y routine2df9c generates identity and256/512/768 matrices
at6554/5bb4/5ba2/5bce. Every row has exact Q14 unit norm and orthogonal axes;
all four complete matrices remain unchanged after resource loading and
successful track analysis. This supplies real original cached matrices rather
than substituted web math. Full chassis output comparison is still pending.

2026-10-11 combined original initialization context passes: track allocation
harness --game now locates original plan/wall resources in the same Unicorn
memory as original row tables, replay buffers and successful track_setup.
Resource storage8000, track9000 and temporary workspacea000 are disjoint;
complete plan/wall banks remain byte-identical after track analysis. This
removes separate-machine context ambiguity, but does not yet run chassis with
initialized matrices/car dimensions/all collision globals. No source edits or
real-game processes occur during execution.

2026-10-11 full-memory wheel-cache regression passes32 synthetic integration
cases (four headings/two hills/two transmissions/two cadences). Both player
and opponent caches match their pre-offset starting coordinates. Default and
explicit legacy results are deeply equal, and every modern memory difference
is confined to the two intended24-byte cache regions. Caller memory stays
unchanged. This uses zero synthetic SIMD/route targets for isolation; the
separate44-case original initializer audit uses all actual cars. Type checking
passes. New regression: tools/test_ms91_initial_wheel_cache.ts.

2026-10-11 post-initializer regression rerun passes: cadence-safety suite,
all six opponent C-reference races (15336 frames) and all four allocated slow/
normal/legacy growth/reload cases. The latter cover10->20->10, small-bank growth,
failed-load memory rollback, rewind, source preservation and legacy endpoint
equality to independent sequential playback (not a claimed legacy finish where
the fixture reports status0). Original DOS complete opponent/chassis verification
is still separate. No public cadence/default or database change was made.

2026-10-11 modern car-initializer mismatch corrected with explicit engine
routing: MS91 now initializes the24-byte retained wheel-coordinate cache from
the original pre-offset starting position (signed shift6); legacy/default
initialization preserves its prior bytes. Engine selection reaches player and
opponent initialization through native-race-session/RaceCarsSetup. All44
direct original cases across11 cars/four headings now match all184 common
car-state bytes; modern inserted second-wheel cache remains separate. Legacy
cache preservation is asserted for every case. User QA_LOOP download still
finishes776 with reload/rewind/ineligibility/unchanged bytes. Type checking and
all10097 original-assembly corpus frames pass after the correction. Full MS91
chassis integration and broader regression remain open; no live changes.

2026-10-11 direct complete MS91 car-initializer comparison added and currently
FAILS on first randomized NSX state: original8f4a returns normally, but common
state comparison differs in vector/cache bytes preserved by initializeCar.
Harness runs44 original cases across11 cars/four cardinal headings with
original SIMD and signed initial coordinates. This is not yet a confirmed
production physics defect: the web initializer has surrounding initialization
stages, and modern inserted vector layout must be checked before altering code.
New tools check_original_ms91_car_init.py/check_ms91_car_init_oracle.ts retain
the failing assertion. Full chassis gate stays open; no live/data changes.

2026-10-11 direct original MS91 route comparison passes both competition
tracks: ZCT29901-ARG yields71 active route entries and ZCT30025-MAR78.
All active tile IDs/directions/columns/rows match web versioned preparation;
both901-word link banks match active graph entries and every unassigned tail
slot remainsFFFF. Together with QA_LOOP16, this verifies three courses via
actual MS91 track_setup, not BB11 or C emulation. Original input bytes remain
unchanged. Type checking passes. Full original chassis integration still open.

2026-10-11 direct MS91 track analysis succeeds for user QA_LOOP replay.
check_original_ms91_track_allocation.py --analyze executes original12afc
track_setup after original row tables, pointer partition and replay-header
copy. Only host allocation/release boundaries are supplied: original requests
exact896-byte tcomp, receives isolateda000:0000 and releases that pointer.
Routine returnsAX0 with the proper far-return stack. Checker requires success
and exactly those two boundary events. This closes track-analysis execution
for this course, not route-output differential comparison or chassis parity.

2026-10-11 original MS91 track-pointer partition executes successfully:
check_original_ms91_track_allocation.py runs actual28f2..2a4b instructions
with an isolated allocator return9000:0000. Final local offset equals27635
allocation bytes. Header7290/26 bytes, element map7316/901, terrain8217/901,
input bank9118/12000 and last object27587/48 all match independent layout
sizes and stay in bounds. Original image remains unchanged. This verifies
the post-allocation pointer stores, not original allocator internals or loaded
track contents; the latter and full chassis parity are still open.

2026-10-11 track allocation initialization located in original startup, not a
separate named init_trackdata assembly routine. Preserved seg000 allocates
0x6bf3 bytes named trakdata and partitions its far pointers sequentially;
the replay header slot is0x1a bytes in this modern layout, followed by the
901-byte element/terrain maps and12000-byte replay bank. Original MS91 name
string DS005d has startup reference at loaded28e6; other references are file
manager operations. This supplies the initialization block to execute next
instead of guessing modern map offsets from the legacy web layout.

2026-10-11 repeatable direct resource-locator check added and passes:
check_original_ms91_resource_locator.py validates original loader signature,
resource-name offsets, exact locator return context, complete bank bytes and
the actual plan/wall far-pointer stores. Both source image and GAME.PRE are
checked unchanged afterward. It explicitly reports chassisParity:false.
This makes the verified resource initialization reusable; track-map and full
chassis execution context remain the next required harness work.

2026-10-11 direct MS91 resource initialization is executable: its actual loader
at15d19 calls locate_shape_alt (198d:15f6), storing the base plan pointer at
DSa1ca/a1cc and wall pointer atDSb164/b166. This clarifies earlier notes:
a1ca is the base plane-bank pointer, not just a selected current-plane pointer.
Executing the original locator with unpacked MS91 GAME.PRE at8000:0000 returns
plan8037:000e (18224 bytes) and wall84aa:000e (1146 bytes); both complete banks
match the extracted original resource bytes exactly and return normally.
Static DS32a90 copied to6000:0000 provides the original resource-name strings
31dc/31e1. This closes locator/pointer initialization only; track maps,
transitive startup tables and chassis output parity remain required.

2026-10-11 original plane initialization trace locates the resource path in
preserved seg005 assembly at loc_238DE: file_load_resfile("game"), then
locate_shape_alt("plan") writes planptr, and locate_shape_alt("wall") writes
wallptr. Chassis subsequently selects current_planptr from planptr. Therefore
setting a current-plane pointer alone is insufficient; the original GAME
resource allocation and selected-plane bank both need valid pointers, alongside
track-map allocations. This narrows the direct harness initialization work;
no incomplete-context return is promoted to a pass.

2026-10-11 bounded direct MS91 chassis diagnostic executes0x751c through its
real far return (sentinel0x1000, SPf004) using one captured Countach car state,
original SIMD and static original DS image. This establishes callable register/
argument context only. Original DS has zero plane pointers a1ca/a1cc and other
startup globals before runtime initialization; a normal return under that
incomplete context is explicitly NOT parity evidence. Next required work is
initializing original track/resource globals and validating state against an
original baseline before running full trajectory comparisons. No files/data
were changed by the diagnostic and no audiovisual process was started.

2026-10-11 MS91 chassis dependency inventory now decodes the full6702-byte
routine (2400 instructions), validates prologue/epilogue and complete byte
coverage, and records direct global memory access widths/read/write sites.
It identifies51 absolute global locations,972 indirect memory operand sites
and25 distinct call targets. audit_ms91_chassis_calls.py distinguishes unknown
operand access from reads/writes and explicitly limits its scope to the direct
routine; transitive callees/pointer allocations still need initialization.
This is a preparation artifact, not passing execution or physics parity.

2026-10-11 direct main chassis-entry identification: unchanged disassembly
update_player_state has stack-local size0x1e4. Its exact11-byte prologue is
unique in each unpacked original: BB11 loaded0x75a2, MS91 loaded0x751c.
MS91 disassembly immediately copies player position/rotation to globals at
0x96ca onward, versus BB11's0x96aa bank. This identifies the complete routine
entry for a future original execution harness; it does not establish output
parity. Calling it requires initialized world/resource globals and segment/
stack context, not just the engine/grip car-state buffer used previously.

2026-10-11 direct original resource audits reran: all536 collision planes and
191 walls are byte-identical between MS90/MS91 and match active web JSON.
Only the three expected GAME.PRE dialog resources differ. Route-table audit
compares all198 tiles and confirms differences are restricted to40..47 with
sample/direction vectors unchanged. These directly validate original geometry
banks and the bounded route adapter assumptions; they do not prove complete
MS91 chassis/contact execution. No shared asset was edited.

2026-10-11 oracle negative guard tests pass with disposable copies: substituted
executable, one-byte-short capture, zero frame count and altered staged replay
are each rejected with the intended diagnostic. Original archived executable,
capture and source replay bytes are verified unchanged. Relative paths also
fail before reading inputs. Type checking passes. These tests protect evidence
integrity; they do not add Mindscape full-game coverage or close its gate.

2026-10-11 repeatable original-assembly corpus checker added and passed:
check_original_assembly_replay_corpus.ts requires both absolute directories,
verifies the archived executable SHA256, byte-identical staged replays,
expected frame counts/full dump sizes/finish ticks, and all four differential
comparisons. It checks source/capture bytes remain unchanged and reports each
capture SHA256 plus total10097. It explicitly reports directMS91Capture:false;
the tool does not convert a BB11 oracle into MS91 proof. Type checking passes
after replacing unsupported Buffer typing with bounded DataView access.

2026-10-11 approved original-assembly four-reference corpus now passes in full:
ZCT300 Audi MAR3002556 frames/2536 finish and Porsche ERI3002264/2244 both
match every compared player physics field with zero differences. Muted DOS
checker generated both .BIN captures and exited0 automatically. Combined with
ZCT299 Indy1471 and Countach3806, this is10097 original BB11 assembly frames,
not C-only evidence. Actual MS91 executable full-game equivalence is still a
separate gate. npm run test:compatibility reran and passed all included routing,
copy-only export/import, legacy ID preservation, metadata, rollback, ranking,
backup, file-download and scoped-retention checks. No default switch/publish.

2026-10-11 original-assembly Indy second-track check passes: unchanged ZCT299
01-ARG.RPL copied to ARG299.RPL, muted repldumo ARG299 1, normal emulator
exit0. ARG299.BIN matches web MS91 across all1471 compared frames, finish1451
(1:12.55). Together with the Countach result this now provides two original
BB11 assembly trajectories on the second track, not just C captures. Direct
MS91 executable equivalence remains separate. Both engine-scoped retention
audits also reran successfully against isolated fixtures; no live DB used.

2026-10-11 approved original-assembly second-track Countach comparison passes.
Unchanged competition/zct299/20-STB.RPL was copied as STB299.RPL into the
isolated mount. Muted archived repldumo STB299 1 produced complete4262722-byte
STB299.BIN and exited normally with the emulator (exit0), avoiding the earlier
interactive completion prompt. Web MS91 matches every compared player field
for all3806 frames, with original-assembly finish3786 (3:09.30). Artifact:
/private/tmp/ms91-original-assembly.hPUIwy/STB299.BIN. This corroborates the
prior independent C result with original BB11 assembly on a second track;
it is still not a direct original MS91 full-game capture. No production action.

2026-10-11 user approved the archived checker execution. Muted DOSBox ran
repldumo QQALAP with only /private/tmp/ms91-original-assembly.hPUIwy mounted.
It generated complete891522-byte QQALAP.BIN (796 frames). The web MS91
comparison reports zero differences across all compared player fields and
finish776. This is a full original-assembly BB11 trajectory, materially
stronger than the C reference but not a direct MS91 executable capture. The
checker remained open after writing output; its exact process49516 was
identified and terminated to avoid a leftover background emulator. Legacy
stored files, production DB and website defaults were not changed.

2026-10-11 actual user download reload/checkpoint regression passes. The
fresh-race checker now loads QQALAP.RPL through createNativeReplayRaceSession
with an explicitly legacy caller default and modern replay metadata. The
session selects MS91, reaches exactly the same entire car state as the fresh
input simulation, and flags playback4 (ineligible). Midpoint/back-to-zero/end
checkpoint seeking reproduces that full endpoint state again. Source download
bytes and shared legacy route tables remain unchanged. Type checking passes.
This closes this recording's automated reload/rewind identity, not every
browser load interaction or original DOS collision parity.

2026-10-11 archived oracle static identity check: its MZ header is10752 bytes;
the original BB11 grip entry's first32 bytes match uniquely at loaded offset
32726, while the MS91 grip prefix does not match. Neither engine32-byte prefix
matches verbatim (relocation/layout differences are not behavioral proof).
This supports treating the archive as a BB11 baseline, not naming it an MS91
executable. Original MS91 whole-game verification therefore still requires
version-difference coverage or direct MS91 capture. Requested explicit approval
before running this third-party archived executable in the muted, isolated DOS
mount; no execution has occurred while that approval is pending.

2026-10-11 stronger-oracle discovery corrects the preceding missing-executable
note: rg --files had excluded ignored archived DOS binaries. The source tree's
tools/oracles/borland contains repldumo.exe and pixldumo.exe; both pass the
archive SHA256SUMS verification. Documentation identifies these as unchanged
original-disassembly/Borland-wrapper references, separate from native C dumps.
Prepared isolated /private/tmp/ms91-original-assembly.hPUIwy with copied MS91
resources, the verified physics oracle and byte-identical QQALAP.RPL. Nothing
has been executed from this new directory yet. Baseline identity and wrapper
effects still need validation; checksum equality alone is not MS91 parity.

2026-10-11 fresh QA_LOOP grip check: complete original BB11/MS91 routines
agree on all796 Countach captured states, and reconstructed MS91 grip matches
each original output (340 states change). Artifact qqalap-grip.json alongside
QQALAP.BNI. The routine harness supplies its bounded track context; this does
not establish complete chassis/contact trajectory parity in the DOS game.
Investigation found Chocolate's separate TARGET=original repldump build links
unchanged original assembly rather than the C simulator. It is a potential
stronger oracle, not the already-built native bin/repldump used above. No
repldumo.exe was found in the inspected compatibility tree; wcc/wlink are not
on PATH. Its original assembly is the Brøderbund baseline, so even a successful
build would still require explicit MS91 whole-routine identity/difference
validation before it could count as a Mindscape full-game oracle.

2026-10-11 user fresh QA_LOOP download now also matches the independent
Chocolate headless reference across all796 recorded frames: compared position,
rotation, steering, RPM, speed and surface fields have zero differences and
finish776 agrees. Capture: /private/tmp/ms91-slow-oracle.t1zGH5/QQALAP.BNI.
Complete original BB11/MS91 engine routines were then executed on each of
those796 Countach captured states with matching next input and original SIMD;
both originals and reconstructed MS91 engine outputs agree. Original capture:
qqalap-engine.json in that directory. These are original powertrain routine
outputs on independently captured reachable states, not an original DOS
full-frame trajectory; contact/chassis/full-game parity remains a release gate.

2026-10-11 user-completed fresh browser QA_LOOP Countach race passes the local
finish/results/verification/save/download chain. The user completed0:38.80
(776 ticks); the browser reports Run verified. Native Save Replay produced
C:\QQALAP.RPL (the custom text field retained an extra Q; no file was overwritten).
The actual download notice identifies25 February1991 and OK downloaded
/Users/svenanders/Downloads/QQALAP.RPL. Read-only check_fresh_browser_replay.ts
decodes20 Hz, round-trips the external format exactly, replays all controls to
the same776-tick finish and passes the actual server verifier as MS91. The
download remains byte-identical. Stored canonical length2622 becomes2624 only
in the external-format copy. This is isolated IPv6 localhost, not production;
it does not prove original DOS state parity or a fresh10 Hz browser finish.

2026-10-11 isolated browser QA_LOOP import/start: the private track-upload
control imports the new course, original Track -> More Tracks loads QA_LOOP
and renders the rectangle. A fresh Countach race reports MS91/20, mode0,
frame0 before driving, then accepts held Up/Down input with enhanced graphics
and Roland off. The first attempt coasts beyond a corner between observations;
it is not a completed-lap or results/save test. Restart stops the runtime.
No replay save or score submission occurred. The separate IPv6-profile tab5
is retained for further work; original localhost saves remain untouched.

2026-10-11 fresh browser-finish QA preparation: a new isolated QA_LOOP.TRK
contains a flat16-node rectangle with one original start tile. The generator
validates a unique corner arrangement (8/9/6/7) through the real route analyzer
under both engines before exclusive creation, and refuses overwrite. Artifact:
/private/tmp/ms91-browser-finish.xYNZmR/QA_LOOP.TRK, 1,802 bytes. Type checking
passes. No shared/public asset or existing track was changed. This is a valid
test course only; no keyboard-driven browser finish is claimed yet.

2026-10-11 divider height-boundary oracle additionally covers31,185 aligned
original MS90/MS91 cases across all eleven car shapes, heights-20..60 and
horizontal edge offsets. Both originals agree and every web result matches.
At centered horizontal poses, the last positive collision height equals each
car's original height word (17..25), with first clearance one unit above it.
This follows the original asymmetric base-corner test, not a generic box/box
height sum; no collision code or car dimensions were changed. This complements
the14,256 rotated cases. Capture: /private/tmp/ms91-divider-cars.4q6SYl/aligned.json.
Whole suspension landing and original full SKIDS trajectory remain separate
unverified gates; routine passes must not be relabeled as gameplay completion.

2026-10-11 original divider-tree overlap coverage now uses all eleven original
SIMD car dimensions rather than only PMIN. Both complete original MS90/MS91
overlap routines agree across14,256 rotated synthetic cases (1,296 per car),
and the web overlap implementation matches every original result. The checker
validates each captured dimension/radius against prepared car data and requires
all eleven equally sized case groups. Existing single-Indy mode is retained.
Artifacts: /private/tmp/ms91-divider-cars.4q6SYl/angled.json. Type checking passes.
This closes the all-car bounded body/tree overlap comparison, not a complete
suspension landing or Marco's original DOS SKIDS trajectory through the trees.

2026-10-11 empty-origin browser restore passes without clearing existing saves.
The running server listens on IPv6::1 (confirmed listener); an initial127.0.0.1
attempt failed and was not treated as a stopped server. The separate [::1]
origin exported0 saved files, imported the existing three-file localhost backup,
then exported three files whose complete decoded bytes/metadata/directory equal
the source backup. These are two modern replays (one10 Hz) and SETUP.DAT, not
a mixed-engine saved corpus; bundled legacy DEFAULT remains separately listed.
After page reload both restored recordings appear in the download list. QA_SLOW
shows the February1991 compatibility notice and its actual browser download
matches original MS91 DEFAULT.RPL byte-for-byte. The temporary successful tab
was closed without starting a game; localhost saves and production data were
not changed. This proves empty-profile browser restore/list/download, not a
fresh-race finish or every restored file's gameplay/hardware behavior.

2026-10-11 paired original Setup menu smoke now observes the same main menu,
five video choices (MCGA/VGA, EGA, Tandy, Hercules, CGA) and six sound choices
(none, PC speaker, Tandy, AdLib, Sound Blaster, MT-32) from both MS90 and MS91
packages. Both identify the Setup utility as Version1.0, independently of the
game's1.1 release date. Menus were inspected/cancelled; no setting selection or
save was performed. Emulator sound remained disabled. Both utilities were
quit; SETUP.DAT copies still compare equal. The first MS91 launch became
unavailable (procNotFound); application inventory confirmed no test process
before reopening the isolated target. This corroborates the initialized-code
equality audit for these menus, not every hardware option or install/save flow.

2026-10-11 FAQ wording now follows each replay's recorded engine instead of
describing every download as MS1990. It identifies both Mindscape dates and
explicitly says downloading does not convert physics. Backup guidance now
distinguishes unchanged stored canonical bytes/engine metadata from versioned
external replay encoding; the old blanket filename/byte identity claim was
inaccurate for exports. Spanish/Italian translations and regression wording
checks pass with492-message coverage. The compatibility answer was expanded
and read in the actual local FAQ. No default switch or release-complete claim
was added; no GitHub push or publication occurred.

2026-10-11 actual local leaderboard download flow: selecting Mindscape1991,
expanding MS91 TEST and clicking yellow uppercase DOWNLOAD REPLAY opens the
compact panel naming25 February1991. OK produces an observed browser download
at /Users/svenanders/Downloads/RBB9A189 (2).RPL. The differential comparator's
new explicit --accepted-prefix mode validates this actual file against the
longer independent C Audi reference: all2,536 accepted frames, compared car
physics fields and finish ticks match; default comparison still requires equal
frame counts, and empty/malformed captures fail. This is not a DOS state oracle.
At measured CSS width388 the panel bounds are left19/right369/top311/bottom530
inside388x840, and a browser screenshot confirms readable text and buttons.
The native screenshot initially showed a stale/cropped viewport after resizing;
the browser screenshot resolved that contradictory observation. Cancel closes
the dialog (open count0). Default viewport and the stopped local engine-preview
page were restored. No score/replay upload or production database action occurs.

2026-10-11 accepted-download integration passes all four modern references:
the actual GET endpoint runs against each migrated isolated SQLite database,
returns MS91 identity/20 Hz format and unchanged accepted controls, then its
response reloads under a legacy caller default into MS91 playback. The entire
retained car state equals the independently captured first accepted finish;
playback remains ineligible and database/source/legacy bytes remain unchanged.
An initial test falsely compared this accepted endpoint with the source's
additional post-finish tail motion. The corrected test explicitly captures the
first finish and asserts canonical input count before comparison, rather than
weakening equality or modifying replay data. Type checking passes. This is
real route-handler/SQL/native integration, not a browser-click or network-hosted
download test, original DOS state oracle or a live data migration.

2026-10-11 muted original MS91 DOSBox second-track playback observation:
the unchanged ARG299.RPL copy equals competition/zct299/01-ARG.RPL byte-for-byte.
The original executable loaded it via Replay Menu -> Load REPLAY, displayed
total1:13.55, advanced from0:00.85 through0:16.80 with normal then fast replay,
and reached stopped displayed1:13.55 with a road/loop overview. No application
crash occurred. This extends original-game visual playback evidence to ZCT299,
not only the previous ZCT300 Audi/Porsche examples. It does not capture exact
car/finish memory or prove every intermediate frame matches the web engine.
The initial coordinate click unexpectedly started a fresh race; Escape and
keyboard menu navigation were used afterward instead of assuming the target
was opened. Emulator audio was disabled by nosound/none configuration. Quit
returned procNotFound and subsequent application inventory had no running
compatibility emulator. No replay-save or score submission was performed.

2026-10-11 post-server-fix regression checkpoint: complete npm test (including
pretest renderer/region/scaled-sprite checks) and all five production build
stages pass. The build checks492 translated messages and retains known
deprecation/chunk-size/route-classification warnings. Current crash handling
also matches all2,000 retained original MS91 crash/finish state and particle/
audio-request cases at10/20 Hz; the comparison checks unchanged input state.
This revalidates existing original captures, not newly executed original DOS
gameplay. The broad suite covers its named audio, enhanced backgrounds/models,
replay/camera/shadow/crash presentation, collisions and Setup checks; it is
not every browser workflow or the complete release audit. No publication.

2026-10-11 actual-verifier reassessment integration now passes for all four
external modern references. Each completed proof is inserted into a separate
in-memory SQLite database using all migrations and an explicit MS91 sidecar;
reassessNextPublicReplay invokes the real native verifier and actual retention
SQL, rather than a mocked verifier result. Identity validation succeeds, pending
count becomes0 and a second request is idle. Original replay payload, score
fields other than assessment and engine sidecar remain exact. Same-driver,
same-track/car legacy score/history/replay sentinel rows are fully unchanged.
Source recordings and shared route tables remain unchanged; type checking
passes. This closes the bounded isolated reassessment integration cases, not
production data verification or browser submission/refresh flows.

2026-10-11 server route-data consistency fix: verifyGlobalScore already routed
race simulation to the selected engine, but constructed diagnostic route gates
from caller tables without engine selection. It now selects copy-only versioned
tables once and uses the same data for the session, graph and evidence gates.
Four required external references pass actual fresh-session finish/save/server
verification with ticks2536/2244/1451/3786. Verification with legacy input tables
and already-selected modern tables produces identical results; shared legacy
tables and source recordings remain unchanged. The regression also asserts
modern hash-domain separation and rejects altered finish times. Legacy server
verification/continuation/invented-time/long-input tests and type checking pass.
No database is contacted; this does not establish live submission or browser
fresh-race completion, and the production default remains unchanged.

2026-10-11 expanded original executable engine/grip checks use independent
seed20261011, 2,200 synthetic states per routine and all eleven actual SIMD
resources (200 states per car). Complete original BB11/MS91 engine routines
agree at both10 and20 Hz; reconstructed MS91 stepEngine matches all2,200
original outputs at each rate. Original grip routines agree for2,200 cases,
and reconstructed stepGrip matches their exposed state outputs. The original
drag and sine-table initialization remains enabled. New case-count/seed
arguments support repeatable coverage expansion; empty captured-state banks
and empty engine/grip oracles now fail rather than report a vacuous pass.
Artifacts are in /private/tmp/ms91-engine-audit.KKsHBX. Type checking passes.
This is routine-level verification with synthetic state sampling, not a
complete original DOS race, contact geometry or every reachable state proof.

2026-10-11 local preview narrow-layout smoke: the viewport capability request
390 produced measured CSS width582, so assertions use observed DOM dimensions,
not requested device dimensions. A narrower request260 produced CSS width388.
At388, document scrollWidth equals clientWidth in English/Spanish/Italian;
the opened navigation fits and language selection updates rendered labels.
CRT was toggled on/off successfully and restored off; Roland power remains
off and runtime Ready to play. English, closed navigation and default viewport
were restored afterward; warning/error logs are empty. This is desktop-browser
responsive UI smoke, not real touch-device gameplay, all page layouts, mobile
replay downloads or the complete website regression gate.

2026-10-11 slow fresh-session lifecycle coverage now persists the actual
completed 958-frame recording through the native file store and JSON backup,
then exports that restored file with the real download function. Previously
this test backed up the score tables but only round-tripped the replay format
directly in memory. The restored canonical replay bytes and MS91/10 metadata
now remain exact; downloaded header cadence is10, decoded inputs are exact,
and reloading under an MS90/20 caller default explicitly selects MS91/10 and
reproduces the finished car state. Playback flags remain4 (ineligible for a
new score). The original external recording is unchanged. The test passes
with finish948 ticks. This is automated fresh-session/storage evidence, not
an actual keyboard-driven browser finish/save/dialog/download flow.

2026-10-11 actual browser normal-speed MS91 Audi playback now passes from
rewind frame0 to recorded endpoint2536 / 2:06.80. The local RBB9A189 file is
MS91/20 despite its filename; canvas engine/cadence diagnostics confirm this.
Playback starts at frame9 immediately after the measurement origin, reaches
frame1386 after68.946 seconds and is stopped at2536 when observed after128.431
seconds. Enhanced WebGL/panorama rendering remains active and warning/error
logs are empty. Restart then returns Ready to play, stopping the runtime.
No score submission or file-save action occurs. This closes this full modern
20 Hz browser playback case, not fresh driven-race results/save/download,
mobile/alternate displays or original DOS whole-race trajectory verification.

2026-10-11 independent C opponent coverage now includes all six profiles on
the complete 2,556-frame Audi reference race, not only opponent1. The new
required-path `tools/test_ms91_all_opponent_reference.ts` checks fixture opponent
identity, runs the differential comparator and verifies unchanged replay and
reference bytes. All six pass: zero differences in compared player/opponent
positions, retained physics fields and opponent route vectors; each player
finish is 2,536 ticks. Missing fixtures or comparator failures fail the suite.
These 15,336 two-car frames are independent C reference evidence, not original
DOS executable whole-race evidence, every car/track combination or browser QA.

2026-10-11 restore-build verification exposed an omitted globally ignored
`public` asset symlink in the source snapshot. The backup routine now includes
the link itself without following or modifying external assets. The corrected
checkpoint has 1,645 entries and SHA-256
03e37f40e4cd6aef91c63773b6e7f53a8be1bd3e39a69fe0bda9aaf12779dfb8.
It was checksum-verified, extracted into a new temporary directory and built
successfully through all five production build stages, with 492-message
translation coverage. Dependencies were linked from the current checkout and
external assets remain required at their existing location. This proves a
same-machine source restore/build, not a standalone backup of assets/database,
fresh dependency installation or hosting rollback. The active checkout and
live website were not replaced.

The bidirectional isolated retention audit now snapshots every field of the
other engine's score/history/shared-replay rows and all engine sidecars before
cleanup. Both MS90-initiated and MS91-initiated cleanup preserve these complete
rows exactly, including distinct modern replay payload bytes. This is stronger
than the earlier surviving-row counts. `test:engine-retention` collects both
directions; type checking passes. No production database is accessed.

Compatibility and cadence/physics-rate suites pass after the latest loader
fixes. Current source wiring confirms highscores submission, replay submission
and reassessment each use engineScopedRetention. The isolated SQLite retention
audit now supports an explicit closed-enum engine and passes cleanup initiated
from both MS90 and MS91, retaining the cross-engine score/history/replay fixtures.
This is local SQL/source evidence, not an observed production database write.

Full real-time browser playback of bundled legacy DEFAULT now rewinds to frame
zero and plays to frame 2357 / 1:57.85 after the deferred-snapshot fix. The
midpoint observation is frame 1177 at 58.563 measured seconds after Play;
the endpoint is observed at 123.833 seconds, consistent with nominal 20 Hz
and stopping at the recorded end. Enhanced graphics remain active, warning/
error logs are empty, and Restart leaves Ready to play. The viewport changed
during setup, so controls were re-derived from fresh screenshots. No score
submission or file saving occurred. This closes this bundled legacy browser
playback check, not all legacy recordings or original DOS trajectory parity.

The latest production build passes after allocation-order, forced-reload and
legacy snapshot fixes, with 492-message translation coverage and existing
build warnings. A fresh source checkpoint contains 1,644 entries with SHA-256
01b8cba7f71dd20387d3b057c5b90c4636066ba4eaecc08fcf5192040ffa792c.
The new restore verifier checks archive checksum/path safety, extracts into a
new temporary directory and confirms five required source files plus retained
asset symlinks. Production database data is excluded and external assets are
not followed. This verifies source extraction, not a complete restored build
or restoration of separately owned assets/database; those remain distinct.

Legacy deferred-seek regression now includes the real bundled DEFAULT loaded
through the original resource catalog, not only CTKFIN. Both match independent
sequential controls at frames 0/1/20/100/end, retain MS90/20 identity and preserve
source bytes without fresh-score eligibility. DEFAULT explicitly reaches finish
status 3. Missing catalog data fails the test, not a skip. Type checking passes
after adding explicit fixture typing to the controlled-divider diagnostic.

The controlled Marco SKIDS divider segment now asserts actual moving car bodies
approach original scenery collision points, not merely remain crash-free far
away. Both engines traverse frames 1504->1550 from the same legacy-captured
divider state, cross multiple tiles, approach tree points within collision
radius on six frames, and remain non-colliding at their actual raised poses.
Source bytes are unchanged. This verifies a bounded controlled passage; it
does not claim the legacy recording plays from start under MS91 or establish
original DOS collision/landing equivalence.

Divider-tree tests now use all eleven original SIMD collision dimensions and
four body yaw directions under each engine/divider orientation. Synthetic
horizontal bodies resting above the raised surface clear the ground-height
tree volume, while each corresponding ground-level body still collides. The
existing 768 divider wheel-selection/wall-height cases also pass, as does type
checking. These are contact-volume tests, not full suspension landing or Marco's
saved SKIDS replay passing the tree; that explicit gameplay gate remains open.

Actual reverse browser replacement now loads QA_SLOW as MS91/10 at frame 958,
then Load REPLAY -> DEFAULT selects MS90/20 at frame zero in the same page.
The legacy replay shows total 1:57.85 and advances to frame 289 after about
14.315 seconds from Play (including a few initial frames before measurement),
consistent with 20 Hz. Enhanced graphics remain active, logs are empty, and
Restart leaves Ready to play. No saved file or score is written. This is short
reverse-route progression, not full legacy browser playback/finish evidence.

Actual browser warm replacement now verifies bundled DEFAULT as MS90/20 at
frame 2357, then Replay Menu -> Load REPLAY -> QA_SLOW changes the allocated
runtime to MS91/10 at frame zero without restarting the page/audio owner.
The slow replay displays its 1:35.80 duration and plays to frame 127 with
enhanced graphics active. Warning/error logs are empty. Restart stops the game
and leaves Ready to play. No file-save/score-submit occurs. This proves short
browser progression after the growth/engine switch, not its complete playback
or the reverse slow->legacy browser route.

Forced reload sequencing now skips the retained-opponent refresh when checkpoint
growth has already released the old resource graph. Full resource startup
prepares the opponent once; ordinary original sequencing is unchanged.
Dedicated forced/non-forced and opponent/no-opponent dispatch tests pass,
along with all four allocated-load corpus cases and type checking. An actual
original slow replay with an opponent is not covered by this dispatcher test.

The new explicit allocated-load corpus runs all four external car references
through 10->20->10 reload, small-bank growth, injected read/analysis failure
rollback and legacy20->MS9110->legacy20 playback. All four pass after the
allocation-order and deferred-snapshot fixes. Source files remain unchanged;
legacy endpoints match independently stepped controls and loaded replay
eligibility remains disabled. Type checking passes. This closes the bounded
four-reference allocation regression, not browser warm-switch verification or
full original DOS trajectory comparisons.

After the deferred legacy snapshot fix, the complete `npm test` regression
suite, cadence/storage/proof safety, original slow import/backup/download/reload
and CGA/Tandy/EGA settings-switch integration all pass. The explicit
`test:legacy-replay-seek` script now retains the independent sequential reference
check in a named regression entry point. These results do not close the
remaining browser legacy/20 Hz full-playback, original DOS trajectory/contact,
mobile/language/default-switch and production release verification gates.

Deferred legacy replay seeking now snapshots the initialized replay state after
entry, just as required for MS91. Previously the legacy deferred snapshot kept
pre-entry checkpoint memory, causing seek(1) to restore unrelated state. The
change is scoped to deferred replay entry; non-deferred snapshots and physics
are unchanged. New independent sequential-control comparisons pass at frames
0/1/20/100/end with unchanged source bytes, MS90/20 identity and no fresh-score
eligibility. The mixed allocated slow-load test and type checking also pass.
Browser legacy playback and broader regressions must be repeated after this fix.

The reverse-load mismatch was a reference-lifecycle error: fresh legacy deferred
playback retains its pre-entry snapshot, whereas allocated loading snapshots
the initialized recording. At frame zero they agree; seeking the fresh legacy
snapshot to frame one restores unrelated retained state. The independent
reference now initializes explicitly and steps the source controls sequentially
with the original replay caller stack, rather than using that seek snapshot.
The returned legacy session's entire endpoint car state matches this reference
(status 0; CTKFIN is not asserted to be a finish). Legacy20->MS9110->legacy20,
MS91 rate switches, grown allocation, failure rollback and source preservation
now pass. This does not resolve or change the separate legacy deferred-entry
seek behavior; investigate that independently without silently changing old
recording interpretation. No production data or physics change occurred.

Correction to the mixed-load diagnosis: the failing assertion was the RETURN
to legacy20, not the forward legacy20->MS9110 load. The forward route reaches
the MS91 finish and matches a freshly initialized slow session at all sampled
frames. A fresh legacy interpretation of CTKFIN ends crashed (status 2), not
finished (3), so the test now compares complete car state against that reference
instead of assuming a finish. This stronger assertion still FAILS: retained
MS91->legacy playback diverges substantially from fresh legacy interpretation.
Keep the reverse-route failure open; previous forward-failure wording is stale.

Cross-engine slow-load diagnostics show matching parsed car state against the
previous successful slow-load runtime at frames 1/20/100/958; frame zero differs
only in retained wheel-position scratch, as documented for original replay
initialization. Nevertheless the final parsed finish status is 0, not 3, in
the new route. This narrows investigation toward checkpoint/initialization
snapshots or replay resource state rather than immediate physics divergence.
The diagnostic is opt-in (`SLOW_LOAD_DIAGNOSTICS=1`) and does not relax the
failing finish assertion. Do not count the mixed-engine route as passed.

Checkpoint growth now releases the prior graphics resources before allocating
the larger retained bank, and explicitly reloads them afterward even if the
car selection is unchanged. This avoids pinning freed resident holes below
the new bank. The previously failing Audi small-bank20->10 path now passes,
including injected failure rollback and finish. The subsequent new legacy20
->MS9110 test still FAILS: after seek(958), crash/finish status is 0 rather than
expected 3. Engine/rate assertions pass, so investigate loaded initialization
or retained state before enabling release. Type checking passes; mixed-engine
completion remains unproven and the reverse legacy assertion has not run.

Mixed allocated replay reload verification is currently FAILING for the Audi
reference `competition/zct300/25-MAR.RPL` combined with original MS91 slow
DEFAULT. The existing small-bank 20->10 growth path fails while loading cockpit
PVS resources with `Original PVS allocation failed: space` at test line 48.
The newly added legacy20->MS9110->legacy20 assertions therefore have not run.
Investigate retained heap capacity/resource cleanup before claiming this warm
reload route complete; do not drop the failing reference to get a green check.
Production storage is unchanged and deployment remains prohibited by the gate.

Download endpoint tests confirm engine-tagged external header formats and
canonical/metadata responses without changing stored replay bytes. Compatibility
labels pass EN/ES/IT checks. The UI notice source check was stale after adding
the localhost-only slow-upload capability; its assertion now explicitly requires
that guarded profile argument rather than accepting an unrestricted upload.
The notice check passes. `test:replay-download-safety` now groups endpoint,
labels, UI routing and private copy-only download checks. The UI source check
does not substitute for desktop/mobile modal interaction evidence.

Replay-buffer modal cleanup is now protected by nested finally blocks. Injected
pause/dialog/resume-audio/counter failures still attempt audio restoration,
counter reset and input/cursor restoration; a failed prompt stays pending and
does not invent a Continue/Replay choice. Explicit retry succeeds after host
recovery. The cleanup test joins `test:replay-buffer-boundary`; all three engine/
cadence boundary cases and type checking pass. This closes a potential failure
path but does not establish the cause of Marco's reported live ten-minute freeze.

The allocated stationary buffer-boundary test now covers MS91/10 as well as
both 20 Hz engines. The 12,000-frame capacity prompts at 600 race seconds for
20 Hz and 1,200 race seconds for 10 Hz. Continue Now rolls history by 30 seconds
(600/300 frames respectively) and continues through frame 12,005 without crash;
checkpoint/counter assertions and type checking pass. Thus “ten-minute buffer”
is speed-dependent in the reconstructed runtime, not a universal time limit.
Original DOS and live-browser long-race behavior remain separate checks.

Real-time browser playback of imported original MS91/10 QA_SLOW now runs from
frame 0 through the full 958-frame endpoint (1:35.80), with enhanced graphics.
After Play, measured frames 3 -> 376 over 37.313 seconds and -> 766 over
76.359 seconds agree with 10 Hz; the final observation at 106.03 seconds shows
frame 958, final time and stopped replay control. Browser warning/error logs
are empty. The game was then stopped with Restart and left Ready to play.
No replay save or score submission was performed. This proves this recording's
browser progression/end, not a newly driven full race or original DOS parity.

The four-car full-race renderer corpus now toggles video policy at captured
ticks 500 and 1000, then continues to finish under both initial policies.
All eight runs pass sampled native pixels, enhanced calls/wheels/masks and
full simulation-state comparisons (28/25/17/41 samples per recording per
initial policy, 222 samples total). Original source replay bytes and fixture
memory remain unchanged. The control receives the same initial redraw request
at each switch; later samples exercise retained frames. This is reconstructed
runtime rendering parity, not independent original DOS trajectory evidence.

The geometry oracle now rejects all-zero returned rotation matrices, and its
checker compares captured intermediate matrices as well as final motion,
rejecting empty input. Explicit fixed yaw 256 and 768 each pass all 536 planes
with randomized tilt/distance/wheel values: 1,072 additional original-code
comparisons at the formerly problematic quarter-turn branches. This is a
routine-level regression lock, not whole-game trajectory verification.

The four external MS91 lifecycle cases now change video policy and render at
captured frames 0/128/1024 before continuing to finish. Each switch preserves
complete live state and 20 Hz identity; all four complete their existing
save/backup/restore/download/reload/private-score assertions. Reference files
remain byte-identical and no production board is contacted. The updated
`test:ms91-lifecycle` corpus and type checking pass. This exercises settings
changes within complete reconstructed races, not original DOS trajectory parity.

Independent suspension oracle coverage now includes signed-word extrema and
random values across the full signed range (seed 20261011), rather than only
the earlier ordinary-value probes. Reconstructed suspension matches 1,000
original MS91 cases and 1,000 original MS90 cases; the latter also verifies
the untagged/default legacy calculation. These are isolated arithmetic tests,
not evidence that every sampled synthetic state occurs in a race or that full
landing/collision behavior is verified. No gameplay calculation was changed.

The three cardinal-angle failures are resolved as an oracle initialization
error, not a physics mismatch. Original disassembly selects startup-generated
Y matrices at 0x5bb4/0x5ba2/0x5bce for quarter/half/three-quarter turns; the
unpacked-file-only harness left those banks zero. The harness now populates
them by executing the original rotate-Y routine at 0x2df9c, without using web
math to generate expected values. Seed 20261011 now matches all 536 original
plane-motion results. No game physics or saved data changed. Earlier failure
notes below document the investigation rather than a remaining known mismatch.

Intermediate capture narrows the new geometry failure to three of 536 cases
(planes 219/379/529), all at exact cardinal yaw 768 or 256. Their oracle car
matrices are all zero, while the other 533 original matrices match rotateZXY.
The reconstructed motion mismatches are exactly those same three cases.
This points toward the oracle's optimized matrix-return preparation rather
than justifying a physics edit. Added read-only originalCarMatrix capture;
inspect the original cardinal-angle return path next. No physics was changed.

Original-executable geometry verification now supports an explicit independent
probe seed. A fresh seed 20261011 executes original MS91 matrix reprojection
and plane-motion code for all 536 plane records, varying car pitch/roll, yaw,
wheel offset and signed distance. Comparison FAILS at plane 219: reconstructed
motion [2287,8676,9424] versus original [-2403,-9113,8972]. This new probe
contradicts a broad parity claim and requires investigation before release.
The emulator requires unsandboxed execution (sandbox
attempt exits 132); source executable/resources are read-only and the oracle
is a fresh temporary JSON file at
`/private/tmp/ms91-plane-motion-audit.Mr01lr/reprojected.json`. Determine whether
the cause is reconstructed arithmetic or oracle setup before changing physics.

After allocated settings integration, the EGA fix and joined preservation tests,
the complete `npm test` suite passes again (audio, replay controls/progression,
results, enhanced backgrounds/cameras/shadows/crashes, wall/goalpost contact,
MT-32 and setup regressions). The production build passes with 492-message
EN/ES/IT coverage and the previously recorded build warnings. The original
MS91 DEFAULT slow reference completes at 948 ticks, saves 958 recorded frames,
round-trips versioned download and reload, and writes only its isolated test
M10 score table; existing test HIG/M91 files and reference bytes remain intact.
This is reconstructed runtime/results evidence, not execution of the original
DOS game or production database verification. Remaining release gates stay open.

The import/backup/download/reload lifecycle now additionally changes the loaded
MS91/10 recording's video policy three times and rewinds/seeks/renders at
0/100/600/958 after each switch. Pixels and full simulation state match a
control runtime; engine/rate remain MS91/10 and downloaded bytes remain exactly
the original file. Mixed private persistence, legacy replay and HIG are
unchanged. `test:ms91-import-lifecycle`, `test:ms91-settings-switch`,
`test:cadence-safety`, `test:private-score-cadence` and type checking pass after
the browser menu integration and EGA fix. These use private in-memory storage,
not a production write or complete browser IndexedDB round trip.

Joined manual-runtime/display switching exposed and fixed an EGA regression:
the setter's forced redraw overwrote the native two-page redraw count with one,
leaving the second page's cockpit stale. It now preserves the greater current
count and requests the display's native pass count. The new
`test:ms91-settings-switch` entry joins modal cleanup and actual CGA/Tandy/EGA
manual-display/enhanced-renderer switching. Four switches with four subsequent
frames each now match control pixels, enhanced calls/masks and full simulation
memory in every mode. The original demo display suite and type checking pass.
This corrects the earlier narrow standalone-renderer evidence; browser testing
of alternate modes and the remaining release gates are still required.

Actual local-browser MCGA/enhanced interaction now verifies the allocated
MS91 expanded menu: Replay Menu -> Display Options -> Change Graphic Level
shows all ten choices and marks. Selecting slow-video OFF and slow simulation
updates the marks; Done shows the original next-race speed notice. The active
session remains MS91/20. Returning to Main Menu and starting a fresh race
prepares MS91/10 and advances to frame 35 with enhanced graphics active.
Browser warning/error logs are empty. The game was stopped with Restart and
left Ready to play; no replay save or score submission occurred. This is not
whole-race timing/finish evidence or alternate-driver browser verification.

The local-preview browser changeGraphics action is now connected to the
allocated MS91 selector and runtime video-policy setter. Both native dialog
drivers forward setting marks and take parser identity from the actual loaded
session. Legacy sessions still use the original one-selection handler; modern
cadence choices only update future-race configuration. A changed video policy
is applied even after a partially completed dialog fails, matching the retained
choice state. Type checking, allocated selector tests, the MS91 options suite
and renderer regressions pass. Actual browser menu interaction remains to be
verified before treating this integration as complete.

Alternate-display video-management reconfiguration now resets detached history,
retained-window seeding and diagnostic state, and requests a full first redraw
in the display's own memory. CGA/Tandy/EGA tests switch four times and compare
four moving samples per switch against control output, including subsequent
non-full-redraw frames. Existing 22 samples through the MS91 demo finish also
pass. The native manual display forwards the setter, and the runtime preflights
engine/policy/display support before updating either renderer. Type checking
and MCGA runtime regressions pass. Browser marked-dialog forwarding and menu
wiring remain incomplete; these checks are not browser interaction evidence.

The allocated MCGA renderer/runtime now supports MS91 video-policy changes
without reallocating the race or modifying session identity/cadence. Switching
resets detached repaint history, forces a full redraw and invalidates enhanced
overlay caches; renderer options are copied so the caller's profile is not
mutated. Runtime tests switch false/true policies three times, comparing three
subsequent frames per switch against control pixels, enhanced masks/calls and
complete simulation memory. Legacy engines reject the setter. The renderer
regression suite passes. Alternate-display reconfiguration is deliberately
rejected until its independently allocated repaint/window state is handled;
the browser menu is still not wired to this new setter.

An allocated-race MS91 graphics selector now handles repeated detail/video/rate
choices, original marks and the delayed-rate notice on the existing modal
services. Tests prove race counters remain unchanged and audio, callback
suspension and cursor state recover after an injected dialog failure; legacy
selector tests and type checking also pass. This adapter is not yet connected
to the browser changeGraphics action: active renderer video-policy changes and
marked-dialog forwarding must be integrated together before enabling it.

The browser's allocated-race dialogs now select the MS91 resource overlay by
the actual session engine, rather than always using legacy race-dialog text.
Legacy playback within an MS91 preview therefore retains legacy resources.
Read-only comparison of original GAME.PRE confirms identical replay-buffer
warning wording in MS90/MS91 but different compact layout delimiters; MS91
also changes the Replay Menu and Display Options delimiters. This routing fix
does not change replay bytes, scores, cadence or physics. Type checking and the
complete MS91 options suite pass. Buffer-boundary tests pass both engines beyond
12,000 ticks and now cover Continue Now, See Replay and Escape lifecycle paths.
Actual browser warning rendering and the reported live freeze remain unverified.

The production build passes after the demo, alternate-display-policy and modal
cleanup integration, including complete 492-message EN/ES/IT coverage. Build
warnings include the existing module.register deprecation, large client chunks
and unclassified routes; a successful build is not runtime verification.

Release remains incomplete. Required next evidence includes real-browser
10/20 Hz race timing, completed race/results/download/reload, legacy replay
switching and mixed backup restoration; complete in-race settings integration;
original DOS trajectory/contact/opponent/divider-tree checks; complete model and
display sequencing; desktop/mobile and language interactions; final source/data
preservation snapshot, README/FAQ changes and validated default-engine switch.
No live deployment or stored-score/replay mutation has occurred. Chronological
notes below may describe earlier integration states; do not read an old pending
item or narrow passing test as the current whole-goal completion verdict.

## Repeatable regression entry point

`npm run test:ms91-import-lifecycle` joins original10 Hz upload normalization,
private file-store metadata, mixed backup encoding/decoding, exact original-file
download and replay-runtime reload/seek/render to finish. An existing legacy
replay and private HIG remain byte-identical, storage receives no replay-load
writes, and loaded playback does not gain fresh-score eligibility. Persistence
uses an in-memory adapter; browser IndexedDB/file-picker/download verification
is still required and is not implied by this passing joined test.

`npm run test:ms91-sample-clock` joins the browser's actual sample-clock stream
to a native manual runtime with a silent chip stub: five seconds at 44,100 and
48,000 audio samples/second advance 50 frames at 10 Hz and 100 frames at 20 Hz.
The MS91 engine/cadence stay intact and the stationary test does not crash.
The same stream driven by `audioBufferBatch` at simulated 60/120/240 Hz refresh
produces identical frame counts across refresh rates: 51 at 10 Hz and 102 at
20 Hz over five seconds plus the scheduler's bounded audio look-ahead (476
blocks at 48 kHz). No actual audio is emitted. Refresh scheduling does not
change simulation cadence in this deterministic joined-runtime check.
This verifies sample scheduling and native timer integration, not browser
wall-clock scheduling, actual sound hardware or a complete driven race.

`npm run test:ms91-demo` runs recorded-demo lifecycle and alternate-display
comparisons from the bundled versioned resource, without depending on a temporary
download directory. It validates the captured original SHA-256; an optional
original DOS replay path still enables direct byte comparison. The broader
`npm test` suite passed after demo/display integration, covering existing audio,
replay controls/presentation, enhanced graphics/cameras/shadows, collision,
results, MT-32 installation and Setup checks. This is automated evidence only,
not proof of all browser workflows or independent full DOS trajectory parity.

## Automatic demonstration integration gap

Alternate display preparation now forwards explicit MS91 video policy through
`nativeDisplayRendererPolicy`. `test_ms91_display_policy_startup.ts` has been
extended to 22 moving raster samples across the complete original 10 Hz DEFAULT
recording/finish in CGA, Tandy and EGA. Both settings match the unconfigured
renderer; CGA/Tandy assertions require retained-window and partial-background
execution without recapturing every frame. Live simulation/source snapshots
remain unchanged. EGA retains its existing page-flipping path, so this check
does not independently prove EGA retained-window copying. Browser testing and
broader car/track coverage through this preparation path remain required.

An explicit `demoReplay` canonical-input path is now available. Its recorded
engine/cadence override future defaults before allocation; only the unattended
load callback uses its bytes. `test_ms91_recorded_demo.ts` passes original MS91
10 Hz playback to finish, native cleanup and restoration of the prior menu
configuration/track, and rejects a second release. The omitted-input legacy
demo still selects its bundled recording at MS90/20 Hz and restores its menu
state on exit. Input bytes/base memory remain unchanged. Browser asset selection
now uses the separate embedded MS91 DEFAULT via `versionedDemoResource` only
when the future-engine selector chooses MS91. It round-trips byte-for-byte to
the original DOS file and passes the same runtime finish/cleanup test.
Real-time browser playback and audio/alternate-display behavior remain unverified.

The demo renderer now forwards actual recorded engine/cadence to cockpit layers
and forwards MS91 selective-copy hooks using the same renderer policy as manual
races. Browser demo input receives local preview video preferences without
overriding recorded cadence. The original 10 Hz demo passes sampled pixels and
complete simulation-memory comparisons for both management settings through
finish, followed by cleanup/menu restoration. These are comparisons against
the existing rendering path, not independent original DOS frame evidence.

Earlier integration finding: OpeningSequence passed the bundled resource catalog and unversioned demo
data to `runBrowserNativeDemo`. The unattended entry loads its recorded resource
through `loadNativeCatalogReplay`, whose loader assumes the legacy header layout.
The bundled DEFAULT.RPL is 4,183 bytes; the original MS91 DEFAULT.RPL is 2,786
bytes and records at 10 Hz. Therefore selecting the future engine alone would
incorrectly relabel a legacy control stream and cannot complete this path.
Before release, provide a separately versioned, copy-normalized original MS91
demo resource with its recorded cadence, route it explicitly, and verify native
allocation, playback, rendering, clock/audio and menu-state restoration. Keep
the bundled legacy resource and old recording playback unchanged.

## Local browser menu observation

Actual warm browser engine switching passed: existing saved RBB9A189 loaded as
MS91/20 Hz (frame2536/time2:06.80), so it must not be presumed legacy from its
name. From its replay menu, Load REPLAY > bundled DEFAULT replaced the session
and prepared MS90/20 Hz at frame0 with the legacy total1:58.35, despite the page
remaining `preview-engine=ms-1991`. The original startup/track appeared, logs
were empty, and Restart stopped the session. This proves modern-to-legacy
in-race replacement identity and initial rendering, not full legacy playback
or reverse10 Hz replacement. No replay-save or score submission was performed.

Keyboard/hover investigation: the original pointer routine reselects a hovered
control before each keyboard activation. A paused controller test confirms
Right then Enter resumes Play when the pointer is outside controls; a separate
test confirms hovering Stop reselects Stop before Enter, overriding the previous
keyboard highlight. Both pass in `test_replay_frame_presentation.ts` together
with existing hidden/visible control tests. This explains a plausible source of
the prior browser observation; it is not fresh browser keyboard confirmation.
Original input precedence is retained, not changed based on automation alone.

Browser replay rewind/Play now observed for QA_SLOW: rewind-to-start moved
frame958/time1:35.80 to frame0/time0:00.00; activating the visible Play control
advanced to frame61/time0:06.10 with MS91/10 Hz identity retained. Keyboard
activation after rewind did not start playback in this attempt; direct visible
Play did. Investigate keyboard focus/selection separately before marking all
controls verified. Restart stopped playback, logs contained no warnings/errors.
This is partial continuous playback, not a complete browser replay to finish.

Browser restore preservation passed on the populated local store: imported its
previous three-file backup, observed Imported0 files / existing files kept,
then downloaded a fresh backup. Decoded files, bytes and engine/cadence metadata
were identical before/after (`stunts-saves-2026-10-10 (3).json` versus `(4).json`
in Downloads). This verifies non-overwriting restore into an occupied store,
not restore into an empty browser. No game was running during the restore.

In-game file selection passed for persisted `QA_SLOW`: Options > Load replay
listed DEFAULT, QA_SLOW and the existing legacy user replay. Selecting QA_SLOW
prepared actual MS91/10 Hz playback, sought to frame958 in replay mode2 and
displayed1:35.80 in both replay-time fields. Captured warning/error logs were
empty and Restart returned Ready to play. This verifies file selection,
recorded-identity reload and initial end-frame presentation, not continuous
rewind/Play playback or full enhanced-mode visual parity.

Actual browser download/backup passed for imported `QA_SLOW.RPL`: Downloads
displayed the canonical2,784-byte file, its notice correctly named MS1991, OK
downloaded2,786 external-format bytes, and comparison with original DOS DEFAULT
returned byte-identical. Browser backup exported3 saved files; decoding the
downloaded backup retained MS91/10 Hz metadata and re-exported exact original
bytes. Output paths: `/Users/svenanders/Downloads/QA_SLOW.RPL` and
`/Users/svenanders/Downloads/stunts-saves-2026-10-10 (3).json`.
No game was started. Restore and in-game replay selection remain gates.

Actual browser private import passed: uploaded a byte-identical copy of original
MS91 DEFAULT named `QA_SLOW.RPL` through the file picker, explicitly selected
Mindscape1991, and observed the successful imported message. This creates one
separately named local-only QA file; merge does not replace existing names.
The game remained stopped. In-game loading/playback and browser download of
this persisted file are still required; do not infer them from upload success.

Private replay upload now passes the experimental slow-import option only for
the explicit localhost MS91 preview. `test_ms91_preview_upload.ts` validates
original10 Hz DEFAULT upload normalization and retained MS91/10 Hz identity,
unchanged input bytes, and rejection on public/default routes. Public 20 Hz-only
guards are not relaxed. Browser upload/file selection/save/reload remain gates.

Private menu-score cadence gap fixed: outside results, the score store and track
score-time formatter formerly defaulted to20 Hz even after selecting a slow
MS91 future race. Both now use the same configured next-race cadence, while
an active results context still takes its actual recorded engine/cadence first.
Legacy remains20 Hz. Future-settings and private-score-cadence suites pass,
including separate tables, backup/reopen and exclusion of20 Hz public proofs
from10 Hz private scores. Browser visual private-table checks remain required.

The explicit browser preview's Slow simulation selection was then exercised
through a fresh race: after the timed notice and return to main menu, the
actual prepared session reported `ms-1991` and `10`, with advancing frame35
and upgraded driving graphics selected. Restart stopped the race and returned
Ready to play; captured warning/error logs were empty. Together with the prior
20 Hz observation this verifies both menu-to-fresh-session routes. It does not
prove full-race finish, save/reload, browser wall-clock accuracy or public 10 Hz
score support; those remain separate gates.

In-race graphics audit found a failure cleanup gap: a rejected detail-selection
dialog could leave callback suspension and cursor stack active. The existing
selector now restores audio/callback/cursor state in finally after that dialog,
preserving normal selections and cancellation. `test_allocated_graphics_cleanup.ts`
passes selection0/4, cancel and injected dialog rejection; type checks pass.
The in-race selector remains detail-only, not the complete MS91 future-settings
menu. Active renderer reconfiguration and future-speed controls require explicit
integration; no recorded timing is changed by this cleanup fix.

Fresh browser race identity observation: `allocatedRacePresentation` records
read-only `preparedRaceEngine`/`preparedRaceCadence` canvas attributes from the
actual session, including replacement sessions. The local MS91 preview entered
a fresh race and reported `ms-1991`, `20`, with advancing race frame60 and
Upgraded driving graphics selected. Restart returned Ready to play. This proves
the prepared/default session identity, not wall-clock cadence accuracy or a
complete race. Attributes describe the last prepared session, not current
running/stopped status, and are never read to choose physics.

Additional browser interaction: selected video management OFF and Slow simulation
speed, observed both selection marks, exited graphics settings and observed
the original notice that speed changes at the start of the next race. Reopened
the graphics menu and both marks remained selected in the same session. Restart
returned Ready to play; captured warning/error logs remained empty. This does
not establish persistence across Restart/reload or actual race cadence. Rapid
batched key events skipped some selections; paced keys with intervening state
observations worked. Notice acknowledgement was followed by the input submenu;
key propagation was investigated afterward: this notice uses mode4, which draws
and waits eight game-counter ticks, then returns without reading an acknowledgement
key. Enter sent after its timed return legitimately selects the first Options
item. `test_ms91_speed_notice_lifecycle.ts` verifies the draw/delay/return sequence
and exactly one notice on cadence change. No input behavior was changed based
on the earlier observation. Browser actual race cadence remains unverified.

The explicit localhost `?preview-engine=ms-1991` now supplies the expanded
graphics-settings profile to OpeningSequence. Browser verification reached the
Options screen displaying `Version 1.1 (Feb 25 1991)` and its Graphic levels
submenu: five detail levels, Slow video management OFF/ON, Slow/Fast simulation
speed, and Done. Initial marks were FULL, slow video management ON and Fast
simulation speed. Captured warning/error logs were empty. Setup showed No sound
and Roland power remained OFF. Restart returned the game to Ready to play,
stopping the test session. This verifies menu presentation/navigation only;
changing each setting, persistence, browser race timing and reload remain gates.
Public and legacy-preview profiles do not enable this expanded settings object.

## Recorded cadence and ten-minute boundary checks

The original MS91 10 Hz DEFAULT recording reloads through the same
`replayVideoSettings` helper used by the explicit local browser QA profile,
even when that profile configures future races at 20 Hz. Both video-management
settings pass rewind/seek/render comparisons at frames 0, 1, 100, 600 and 958,
reaching the recorded finish with matching simulation memory, pixels and enhanced
output. Loading retains MS91/10 Hz identity and does not gain fresh-score
eligibility; source replay bytes remain unchanged. This is a runtime integration
check, not a real-time browser playback test. Public settings remain unchanged.

Fresh stationary races in both reconstructed MS90 and MS91 pass 12,005 ticks:
the replay-buffer prompt appears once at 12,000 ticks (600 seconds at 20 Hz),
Continue Now resumes input/audio and recording, and neither simulation crashes.
This does not reproduce or disprove a crash in the live browser or original DOS
game. Those claims require separate observation.

Commands: `npm run test:replay-buffer-boundary`,
`node tools/test_ms91_slow_renderer_reload.ts <original-MS91-10Hz-DEFAULT.RPL>`,
`npm run test:future-race-settings`, and `npm run typecheck` pass.

## Repaint pipeline verification and integration boundary

Selective presentation integration is diagnostic-only in
`native-display-race-renderer`. Required sampled comparisons now pass through
the complete OPPAUDI2556, OPPFAST1471 and OPPCOUNT3806 recordings and finishes:
54/32/79 raster samples respectively, each in CGA/Tandy/EGA. Source recordings
and render snapshots stay unchanged. Tests require non-startup selective-copy
frames, and EGA explicitly allocates a non-page-flipped graph so its copy hook
must execute. The retained window is captured only on entry/full redraw, not
on every ordinary frame; the regression checks capture counts.
Earlier Tandy/EGA failures were resolved by keeping the newer region collapse
detached from the legacy graph, mapping the complete901a..9091 working bank,
and using the maximum panorama height9ae2 rather than minimum7fe4.
These are sampled comparisons with the existing renderer, not every-frame
original DOS raster parity or browser QA. Forward/rolled background plans and
active/disabled car-region policies now have diagnostic integration and bounded
original checks, described below. Default MCGA partial background now has
diagnostic race-owned state and selective presentation; complete model sequencing
and complete Options/browser wiring remain
required. Do not enable publicly yet.

Additional integration finding: slow-video policy affects world drawing before
presentation, not merely the final bitmap copy. Original E01A redirects the
model descriptor's region pointer to9730 and sets descriptor flags0c; its
disabled paths instead use a caller-owned empty rectangle or flags04 according
to948b. Original E4F2 also selects working region9728 on the slow-video path.
The available independent C skybox implementation confirms forward-horizon
dirty-region collection/restricted drawing and heading-based suppression occur
before frame presentation. Its names are interpretive corroboration, not a
substitute for executable verification. Integration must implement both the
region-producing world/background branches and the final retained-bank copy.
The diagnostic `experimentalMs91WindowCopy` seeds the allocated window on
entry/full redraw. Ordinary frames retain it. Optional selective presentation
uses detached previous/current banks; it is not publicly enabled.
The two routing blocks now have a mapped helper and200 original-executable
comparison cases (`test_original_ms91_model_region.ts`), covering both blocks,
active values0/1/2/ffff, visibility0/1/2 and checked descriptor/local writes.
Their working region indices are3 and4 relative to9710. The existing player/
opponent submissions use the same indices relative to the legacy working bank:
9032/903a relative to901a. Thus those region pointers can remain display-mode
mapped rather than writing original MS91 bank addresses into the older graph.
The default queued car records retain04. The diagnostic versioned policy uses
0c when management is active, and local empty bounds for status1 cars when it is
disabled; other disabled car statuses retain04. Both policies now have mapped
checks and sampled rendering comparisons. This does not yet prove every
original descriptor write or full world submission parity.
Projection-policy gap located: original MS91 image17360 tests descriptor flag08
and only then loads the active bounding-rectangle pointer into658e. The
independent C implementation names08 `SHAPE3D_USE_BOUNDING_RECT_FLAG` and gates
primitive bound updates with it. Current `renderOriginalModelMemory` always
loads the record's region pointer into the mapped5f32 and unconditionally
writes projected primitive bounds on its legacy path. The diagnostic projection
policy now gates those writes with08 while preserving default legacy behavior.
Changing queued car flags alone was insufficient; original primitive/region
write-trace comparisons still remain before public enablement.

The detached MS91 repaint pipeline is now implemented in
`ms91-repaint-plan.ts`, `ms91-rectangle-list.ts` and
`ms91-clip-rectangle.ts`. Silent bounded executable comparisons pass:
1,000 clipping cases; 200 list-insertion cases; 200 indexed-order cases;
and 200 combined cases containing fifteen current/retained regions each.
The latter executes original18e7a followed by18f72 and compares exact region
and index order, not just covered area. Signed extremes, ties and aliased
clipping records are covered by the separate checks. Type checks pass.
List insertion and the combined operation also pass original comparisons at
1/2/4/8-pixel alignment, including unaligned horizontal clip edges. The
renderer-owned state and presentation adapter pass focused state/order/error
tests and actual clipped bitmap-copy tests through native CGA, Tandy and EGA
drivers. These raster tests use detached synthetic surfaces, not complete game
frames. They do not prove all dirty-region producers or live integration.
The helpers are connected to the diagnostic race renderer but not enabled in
the public/browser path.

Current integration boundary inspected directly: `native-display-race-renderer`
prepares independently owned legacy-layout display resources. Its full-redraw
layer host's `present` only selects the display window; its alternating EGA
host's `present` intentionally does nothing before the final page swap.
`resetOriginalWorldRegions` clears fifteen legacy regions at901a plus the
display-mode offset. These are not original MS91 working9710/currenta250/
retaineda65e banks. Writing the MS91 offsets directly into this renderer would
target unrelated legacy-layout state. Integration must explicitly bridge
dirty-region producers, per-page retained bounds/identity, and the actual
driver copy or swap operation. Returning unchanged full-frame pixels or
merely calculating a repaint plan is not evidence of slow-video completion.
The empty merged-list presentation fallback is full horizontal width0..320
with the requested vertical clip; combined oracle checks cover calculation,
while this presentation fallback currently has a focused host-level test only.
The live default and public slow-video/10 Hz gates remain unchanged.
The native browser Options wrapper now forwards marked graphics selections to
the native dialog runtime instead of discarding that optional sixth argument.
The full MS91 Options suite and typecheck pass after this change. The menu
remains gated: this forwarding fix alone does not enable the newer settings.
The production build passes after these additions and checks all492 website
messages for Spanish/Italian coverage. Existing chunk-size and module-register
deprecation warnings remain. No publication or production DB mutation was run.

Local verification checkpoint (10 October 2026): `test:ms91-slow`,
`test:ms91-options`, and the full production build pass together after the
replay opponent-header, modern private-score backup, and Options lifecycle
changes. The build also checks all492 website messages for language coverage.
This does not prove browser behavior, original-game full-race parity, or
completed10 Hz race/result parity. Normal10 Hz entry remains gated and the
live default is unchanged. No publication follows from this checkpoint.

Original bundled MS91 `DEFAULT.RPL` is a genuine10 Hz reference (958 inputs).
`tools/test_ms91_original_slow_replay.ts` requires an explicit reference path,
drives its inputs through fresh test-only10 Hz initialization, and observes a
finish at948 ticks. Saving retains all958 inputs/configuration; native10 Hz
format encode/decode and reload/rewind reproduce the complete finished player
car state. Source bytes are unchanged. Replay viewing retains ineligible flag4,
not fresh-race result scratch/eligibility. This is a web lifecycle check using
an original recording, not an independent original-executable trajectory or
finish-time comparison. Public10 Hz entry/downloads remain disabled.
The same required-path test now runs allocated result preparation: panel engine
and10 Hz rate are explicit, retained formatter fields match, score eligibility
retains the948-tick candidate, and local name entry writes one private test
record. No network service is supplied. Mixed-cadence private table ordering/
display policy and original-executable result comparison are not proven by
this single-rate lifecycle check and remain necessary before enabling10 Hz.
Run the required reference separately with `npm run test:ms91-slow-reference
-- /absolute/path/to/MS91/DEFAULT.RPL`; a missing reference fails rather than
silently skipping. The four-car20 Hz lifecycle corpus, compatibility suite and
cadence-safety suite pass again after the added slower-result lifecycle test.
Private score routing now isolates10 Hz in `.M10`/`.B10`, preserving existing
`.HIG`/`.M91`/`.B91` bytes and paths. `test:private-score-cadence` verifies all
five tables across writing, reading, backup and reopen without read-time
rewrites;10 Hz does not restore retained20 Hz proofs. Legacy10 Hz scores reject.
The active completed-race context supplies cadence, with20 Hz as the untagged
default. This is a web storage isolation policy, not a claim that original DOS
files had these extensions. Browser10 Hz entry remains gated pending original
race and presentation integration checks.
Allocated browser results now explicitly pass both completed-session engine
and cadence into the score-file wrapper (previously only engine was passed).
The original10 Hz reference lifecycle exercises that same wrapper wiring:
actual result/name entry writes `.M10`, legacy `.HIG` and normal `.M91`
sentinels remain byte-identical, and backup/reopen retains the slower table's
10 Hz metadata and all three tables. The browser path is source-integrated;
this native test does not claim rendered browser10 Hz QA.
Track-menu score time metadata now follows an active result context's cadence,
with20 Hz retained outside that context. Native results and alternate-display
score tables already consume panel cadence. The slow-reference test checks
the entered948-tick record displays `1:34.80`; row tests check equivalent
elapsed times at10/20 Hz without modifying record bytes. Typecheck and the
ranking/offline/consent regression suite pass. That general ranking suite
deliberately skips the external MS91 corpus case unless provided; its skip is
not counted as original-game or full-corpus verification.
Slow external comparison investigation: `compare_external_replay.ts` now
decodes recorded cadence explicitly and permits test-onlyMS91 10 Hz sessions.
The existing Chocolate `repldump` reference does not supply a valid10 Hz oracle:
its source unconditionally sets `framespersec = GAME_FRAME_RATE_NORMAL` before
simulation (`repldump.c`, around480). A958-frame bundled DEFAULT comparison
therefore diverges immediately (first-frame road speed429 versus858), and its
reference does not finish. Do not interpret this forced20 Hz dump as MS91
10 Hz physics evidence or adjust web physics to fit it. A cadence-correct
independent/original reference is still required. Dump artifacts live in a
new temporary copy; original replay files were not modified.
Cadence-correct independent follow-up: built a separate native headless
Chocolate dumper from its existing source, changing only the test adapter's
rate assignment to the replay-viewer expression using
`gameconfig.game_framespersec` (reject rates other than10/20). Physics source
is unchanged. A small non-SDL main calls `stuntsmain`; compile uses signed
char/no-strict-aliasing and macOS `-no_fixup_chains` for packed pointer globals.
No game GUI/audio is used. Comparing its DEFAULT.BNI now passes all958 frames:
zero position differences, zero differences in surfaces and all13 checked
retained physics fields, both implementations finish at948 ticks. Artifacts
are in `/private/tmp/ms91-slow-oracle.t1zGH5`. This verifies a cadence-correct
independent C implementation, NOT the original DOS executable or every car.
Expanded comparator checks11 further retained byte fields per frame: braking,
accelerating, gear, rear/all contact, limiter, sliding, crash/finish, shifting,
shift timer and automatic transmission. The independent serialized C car has
24 extra body-corner bytes before these fields; offsets are mapped explicitly.
Final independent finish ticks must equal native result-panel ticks. All958
slow-reference frames still pass. The four existing20 Hz references also pass
all10097 frames with the stronger checks, including their finish times2536,
2244,1451 and3786 ticks. These are independent C-reference comparisons,
not DOS-executable whole-race verification. Typecheck passes.
Opponent coverage gate: none of the65 downloaded replay files includes an
opponent. A separate generated OPPSLOW.RPL probe adds opponent1 using the same
Indy car to the bundled10 Hz recording, without changing source input bytes.
`create_ms91_opponent_probe.ts` requires a new exclusive output path and checks
source preservation. Expanded comparison now checks opponent positions,
13 retained words and15 retained byte fields. Player still matches all958
frames, but opponent diverges from frame1: steering-8 versus-11 and yaw0
versus1, then later crashes differently. This FAIL is a release gate pending
independent/original AI initialization and steering investigation; it must not
be hidden by the single-car passes or labeled complete opponent parity.
Opponent cadence correction: original MS91 bytes at6E94..6EB2 select
steering8/speed-step1 for20 Hz and steering16/speed-step2 otherwise. Independent
C `update_opponent_tick` has the same selection; its coasting threshold is
speed-step shifted by9. Web opponent decisions now receive16/2 only for explicit
1991 physics at10 Hz; default/legacy remains8/1. Boundary tests verify steering
and1023/1024/1025 coasting cases. The OPPSLOW independent comparison now matches
both cars through frame125; first remaining opponent divergence is frame126
(acceleration/speed), with later route/pose differences. The whole probe still
FAILS and release remains gated. Player958-frame parity remains intact.
Frame126 diagnostics narrow the remaining mismatch to route target selection:
both opponents enter frame125 with identical position, yaw, steering and speed;
both steer15/yaw935 at126, but web target speed remains40 while independent C
switches to115 and accelerates. C `opponent_steering_target` can force one extra
route advance and recompute its target when angle exceeds65; web only has the
existing256-degree-unit route gate. Verify the original MS91 branch before
introducing any version-specific forced-route behavior; do not change legacy
route following from C source alone. Diagnostic comparator now emits target
speed, input mode and engine words around the requested opponent frame.
Opponent probe follow-up PASS: original MS91 727D..72A9 confirms the one-time
forced advance/recompute when target exceeds+/-65, with its local forced flag
and branch to6FE0. Explicit1991 opponent decisions now implement that loop;
legacy decisions retain their old single-target behavior. This removes the
frame126 difference. A later frame932 steering difference was caused by
unspecified target height-1 being subtracted instead of treated as zero;
original7054..7062 explicitly clears the relative height. Modern target-angle
handling now follows that branch. Both cars match all958 OPPSLOW frames in
all checked positions/words/bytes and player finish948. Tests cover one forced
advance, changed target speed, and legacy/default versus modern height handling.
This closes this synthetic independent-C opponent probe, not every opponent,
normal-speed AI, or original-DOS full-race verification.
Normal-speed opponent coverage: new exclusive synthetic probes OPPFAST (Indy,
1471 frames) and OPPCOUNT (Countach,3806 frames) match both cars in all checked
fields and player finish times1451/3786. OPPAUDI (2556 frames) still FAILS:
both cars match through721, but opponent steering differs at722. Diagnostic
route-vector mapping shows native target/edge x20992 versus independent20658,
with identical y=-1, z4608 and target speed120; rotations agree at721. This
narrows the next audit to route point/vector selection or resource differences,
not powertrain scaling. Player remains exact through2556. C's default left
corner bias option affects grip rounding, not these route target coordinates;
do not disable original behavior to hide this failure. Original route-point
execution/resources must establish the correct target before a web change.
Route-state diagnostics now expose an earlier first divergence at721: web
route index7/point2 while C index8/point0. Through720 both are index7/point1,
and both target x21326. The mismatch is route advancement, not necessarily
different vector resources. Expanded comparator checks all9 route-vector words
every opponent frame, so pose agreement cannot hide target-state disagreement.
Original6EB2 and C guidance initialization use velocity-heading offset (native
wheelAngle), not the sliding byte, to initialize the forced-route flag. This
field is now corrected in the modern loop with a suppression regression test;
it does not resolve the Audi721 case, which remains an explicit FAIL.
Audi721 descriptor diagnostic identifies analyzed route entry70, tile43,
direction0. Web record count is3, orientation768, and primary point pairs have
z=-334/0/334. After the near advance it selects the middle pair (world x20992),
while C selects the final pair (x20658) and advances route index. Web's computed
new target angle is-12, not outside the65 forced-turn threshold. Audit original
tile43 descriptor counts/point data and the pre-advance branches rather than
assuming steering arithmetic is the cause. The comparator now derives this
descriptor from the retained opponent path and analyzed track, not a guessed
tile location. Typecheck passes.
Original-data audit CONFIRMS version difference: legacy EGA DS3209 object
table2018 versus MS91 DS32A9 table209E. Tile43 descriptor is legacy1BE2
(count3, point pointer14A8) versus MS911C68 (count2, pointer153A).
`audit_ms91_route_tables.py` compares all198 supported tiles, ignoring relocated
addresses but retaining descriptors, object properties, all primary/alternate
points, samples and direction vectors. Exactly tiles40..47 differ: all remove
the middle pair[-120,-1,0]/[120,-1,0] and change count3 to2. Object properties,
samples and direction vectors match. This establishes the newer-engine route
data change without altering shared legacy assets. Integrate a copy-only
engine-selected table adapter before allocated track analysis and session
lookup, then rerun opponent and player lifecycle comparisons. This audit alone
does not close the Audi probe or the release gate.
Copy-only `versionedRouteTables` now selects the audited eight definitions
before allocated preparation/reentry and direct session creation. Legacy
selection returns the original object; modern selection copies only affected
records/point pairs, retaining normalized address words, samples, direction
vectors and shared assets. Unit tests prove only40..47 change, source tables
remain identical, and repeated selection is idempotent. The slow DEFAULT
lifecycle still passes. Audi opponent route-vector divergence at721 is removed;
both car state comparisons now match through820. Remaining first physics
difference is821: target speed web80 versus reference90, then acceleration
differs. Audit opponent profile/version resource data before further changes.
The entire Audi probe still FAILS; no publication or legacy data rewrite.
Opponent profiles follow-up PASS: unpacking all six original MS90/MS91 PRE
banks confirms equal sizes and ONLY speed-item differences. Index9 changes
80->90,110->120,90->110,90->120,100->140,150->175 for opponents1..6;
opponent6 additionally changes index11 40->60 and index12 30->50.
`versionedOpponentSpeeds` overlays these bytes in copied allocated memory
before route-cost selection/profile caching; legacy and idempotent modern
profiles are unchanged, unexpected profiles reject. Allocated and direct
session paths forward engine identity. Required-path
`test:opponent-original-resources` proves the adapted full unpacked bank equals
its original MS91 counterpart for all6, with original files unchanged.
After route/profile integration, OPPSLOW958, OPPFAST1471, OPPAUDI2556 and
OPPCOUNT3806 ALL match both cars and all9 route-vector words per frame against
independent C, including player finishes948/1451/2536/3786. This supersedes the
Audi FAIL above for these probes, not full opponent1..6/DOS/browser verification.
Typecheck passes. Legacy shared resources and stored data are not rewritten.
Post-integration regression checkpoint: all four opponent probes rerun PASS
after both adapters, including all route-vector comparisons (8791 two-car
frames). Full `npm test` passes the existing audio, enhanced models/background,
camera/shadow/crash presentation, controls, collision and Setup tests. Explicit
four-car `test:ms91-lifecycle` passes save/backup/restore/download/reload/private
score result chains with no skipped external cases. These automated checks do
not replace final rendered browser/mobile or original-DOS race verification.
Cross-version in-race load audit: `loadAllocatedReplay` previously resolved
recording engine only at final initialization, after route analysis and
opponent preparation had used caller defaults. It now resolves selected engine
and20 Hz cadence before reading the recording bank, applies route selection
before analysis, passes that engine into opponent preparation, and initializes
with the same selected data. The10 Hz allocation guard remains before reading.
Adapters are reversible: modern route tables restored to legacy exactly match
original records/points; cached modern profiles restore the six original
legacy speed arrays. Required-path resource and route tests verify these
round trips. Full in-race cross-engine load/render behavior still needs direct
integration coverage; this source ordering fix is not a browser QA claim.
Direct allocated cross-engine load now PASS: required-path
`test:cross-engine-load` uses an opponent1/20 Hz synthetic recording to switch
the same allocated graph MS90->MS91->MS90->MS91. It checks selected engine,
80/90 target profile, raw track/input count, and both complete retained cars at
frames1/20/100/2556 against a separately driven fresh race for each engine.
Frame0 compares all retained car fields except wheel-coordinate scratch, which
original initialization leaves from the previous run; first-tick wheels must
match. Test discovered `initializeLoadedReplay` kept the previous recording's
seek snapshot/checkpoint bank. It now snapshots after new initialization for
in-race loads only, so engine switches cannot seek through the old engine's
checkpoints. Fresh legacy snapshot semantics and all recording bytes are
unchanged. The original loader already refreshes unchanged opponents; no extra
resource-refresh condition was needed. Typecheck passes; rendered browser QA
and tests against genuine stored legacy recordings remain distinct.
Genuine legacy follow-up PASS: `test:cross-engine-load` now requires a second,
actual legacy recording path. After the three synthetic engine-switch probes,
it loads Marco's unchanged public MARSKIDS.RPL in the existing MS91 allocation
graph, switches toMS90, and checks retained active-car state at0/1/20/100/end
against a separate fresh legacy drive. It still reaches its legacy finish.
Disabled opponent scratch is not compared as an active car. Every inspected
replay state remains ineligible for a newly completed score; both source files
remain byte-identical. Typecheck and whitespace checks pass. This verifies the
native allocated loading path for one genuine public legacy recording, not
all existing recordings or rendered browser behavior.
All-opponent expansion: probe generator now accepts validated opponent1..6.
Audi20 Hz probes for4/5/6 pass all2556 frames;2/3 expose junction routing
differences at387/389, while player stays exact. Resource audit distinguishes
`path` (route costs) from `sped` (16 cached target speeds): native static lookup
strings at2F8D/2F92 name those distinct items. The existing helper used sped
bytes and adjacent memory for both. Modern preparation now reads costs from
path while legacy retains its existing selection semantics; profile caching
still uses sped. A synthetic fork regression with original OPP1 verifies
modern primary/tie selection versus legacy alternate selection and unchanged
source memory. After this fix,2/3 agree through2095/2119 respectively, but
later route-vector/steering differences remain. These two full probes still
FAIL; do not report all-six driving parity. Typecheck passes.
Route-cost source audit supersedes the path-item experiment above: C
`carsetup.c::load_opponent_speed_data` deliberately locates path but uses sped
as its256-cost base, loading the original decompression tail. The experimental
path-base selection is removed; a regression now requires sped/adjacent-memory
semantics rather than substituting the separately named item. The six full
unpacked banks differ only in profile bytes, but their PACKED bytes/lengths
also differ; those bytes can survive beyond logical resource end and affect
path costs. Thus profile overlay alone does not reproduce modern route costs
for opponents2/3. Next integrate exact original MS91 packed opponent resources
and version-isolated cache/allocator loading, preserving legacy packed banks.
Do not claim the temporary2095/2119 agreement proves the correct algorithm.
Current2/3 probes remain FAIL at387/389 under restored original cost semantics.
Exact packed-resource follow-up PASS: six original February MS91 PRE files
are retained byte-for-byte in `ms91-opponent-resources.json` with source length
and SHA256 metadata. `versionedOpponentResource` returns copies only for
explicitMS91. Modern cache basename `m91oppN` is distinct from legacy `oppN`;
the longer name uses dedicated scratchD06E rather than overwriting the small
original name buffer. Allocated initial/reentry, in-race replay refresh and
direct session loading use the same versioned packed bytes. Original sped/
adjacent-tail cost semantics stay intact. Required-resource tests prove exact
packed equality, copy isolation and unchanged legacy catalog selection.
All6 Audi20 Hz opponent probes now PASS all2556 frames each (15336 frames),
including complete checked player/opponent physics, all9 route-vector words,
and player finish2536. This supersedes2/3 FAIL above for this track/car/rate.
Cross-engine loading including genuine Marco legacy SKIDS still passes;
typecheck/whitespace checks pass. Other tracks/cadence and original-DOS/browser
verification remain distinct release requirements; nothing is published.

Required user regression: Marco SKIDS/Indy replay
2632c6709df4385059ed9f326661629d1ea3af00ae102ce78106807942700470
(2358 ticks; public download SHA256
4d560abd3e42a4813e50e924834166a282be479ffb1a68059d3fc3099bd03a5c).
Check driving through trees while on top of a road divider in both original
MS90 and MS91, then reproduce each version's collision policy in web engines.
Read-only web trace: legacy finishes without a crash, passing divider tiles
114/110/112 at frames1466..1550. Relabeling the same controls MS91 crashes at
frame406, well before that passage; this is not evidence of MS91 divider/tree
behavior. Original-version collision tests and a controlled equivalent MS91
state are still required. Do not alter the published replay or score.
Controlled web contact now passes from Marco's settled divider-top frame1504
through1550 under both engines: car moves nearly three tiles without crashing,
using identical initial complete memory and recorded controls. This is a local
simulation probe, not a changed/published replay. Original divider selection
matches1066 boundary/random cases, and both original wall-height gates match
131072 cases. Web geometry/height-filter tests cover768 cases. Full original
car passage and independent scenery-collision verification remain open.
Scenery audit: both originals select one divider collision point, local[0,0,0]
(MS90 DS2EB6, MS91 DS2ED6); the MS91 selector is11F0C, legacy1212E.
MS90 data segment is3209 (confirmed by repeated native DS loads), not a
MS91 sine-offset guess. Web tests retain this ground-level point: raised car
height31 misses, ground height0 hits. Full original point-placement execution
and overlap comparison are still required before calling the entire passage
original-game verified.
Original overlap entry isMS90 AE4A / MS91 B50E, with four near pointers:
dimensions/radius1, packed position+angles1, dimensions/radius2, packed
position+angles2. Near stack vectors requireSS=DS. Static identity/quarter-turn
matrix caches must be initialized before execution, as demonstrated by the
particle oracle; zero executable-image caches cannot serve as collision evidence.
Executed scenery-point placement now matches480 original cases. Complete
aligned overlap matches2835 original MS90/MS91 cases using actual PMIN
dimensions[19,17,56] and radius62: raised height31 clears, ground0 collides.
The web overlap matches every captured result, and the768 divider-top geometry
checks pass with those Indy dimensions. This closes the bounded placement/
height/overlap chain. An additional1296 sampled yaw/pitch/roll cases now match
both originals and web overlap. Whole original replay playback remains separate.

Options integration: `runNativeOptions` now routes explicit MS91 settings
through the modern lifecycle and marked-choice adapters. `test:ms91-options`
passes lifecycle, notice, cancellation, marks, alternate-display geometry and
legacy fallback checks. Browser `selectOptions` still overlays only the version
label and does not provide modern settings: expanded controls remain gated on
verified next-race cadence application and complete slow-video behavior.

Test-only slower session: explicit `experimental10Hz=true` plus MS91 identity
permits integrated tests; browser/public inputs never populate this opt-in.
`test:ms91-slow` verifies1200 two-car frames, live-state save/reload/rewind around
300/600/900 checkpoints, cadence-aware format copies, private storage and backup
preservation. Normal10 Hz entry/import/download/public proof paths remain blocked.
Full original slow-race parity and finished-race score units remain unverified.
Replay validation now reads the opponent ID at native header7..10, matching the
loader; all11 car IDs and disabled-opponent preservation have regression tests.
Mixed legacyHIG/MS91M91/BB91B91 private tables now restore from backups, and the
four-run lifecycle gate preserves actual result tables alongside old scores.

Full original keyboard steeringAC7A..AD6A matches126984 legal-state cases:
every angle-240..240, all four input values, all16 speed-bin endpoints plus
speed1, at10/20 Hz. This verifies counter-steering, centering, delta clamps and
angle limits beyond lookup-table parity. An earlier diagnostic with out-of-range
signed angles found24 overflow differences; corrupt-range equivalence is not
claimed and no legacy steering behavior was changed.

Original crash/finish audit located the MS91 routine at imageBA32..BBD4
(legacyB3B2). Disassembly confirms active cadence96DC drives player crash
delay4*rate and finish delayrate. Player finish92E2 adds current ticks92E0,
penalty92EA and elapsedA728; opponent finish92E4 omits the penalty. Existing
crash state short-circuits, and saved statistics copy11 words unless flag4 is
set. Original-routine execution now matches1200 state cases covering causes2/3/4,
both cars,10/20 Hz, unsigned tick wrapping, pre-existing crashes and retained
statistics flags. Audio is disabled and particle-generating causes1/5 are
excluded from that initial capture. The expanded2000-case oracle covers all
five causes and verifies particle/audio request arguments and ordering,
including replay/audio suppression. Calls are intercepted without sound;
actual particle generation and driver execution are outside this comparison.
Particle audit next: MS91 generatorBE6E..BFCF obtains a random byte, computes
`(6*byte) SAR2`, then adds supplied speed and384 (BF8E..BFA8); vertical
speed uses the low signed product followed bySAR2. Existing `generateParticles`
uses a wrapped `byte*24<<6` followed by its legacy signed-shift helper. These
expressions can differ for large random bytes. Do not treat request-level crash
parity as debris-generation parity; execute the original generator before
adding a version-specific override. Random generatorC29F uses the same six-byte
additive/carry algorithm at MS91 DS:A64E..A653.
The MS91-specific debris calculation now matches400 original generator runs,
including occupied slots, all particle fields, and random-state updates. It is
routed through player, opponent, cross-car and direct native crash generation;
missing/legacy engine tags retain the old calculation. After integration the
four-run lifecycle gate, general regression suite and typecheck all pass.
Particle movement now matches400 original cases at10/20 Hz, including gravity,
ground removal and angle updates. An initial horizontal mismatch was a capture
initialization error: quarter-turn cached matrices were zero in the executable
image. Rebuilding them using the original Y-rotation helper resolved it; those
earlier uninitialized captures are not parity evidence. The10 Hz helper adds
the original second gravity/Y step, now routed through shared and single-player
effects. Permanent particle routing/default-rate regressions pass.10 Hz sessions
remain disabled pending the wider initialization/storage/score gates.
 
Save/reload checkpoint: four external reference runs (Audi2556,
Porsche2264, Indy1471, Countach3806) now pass fresh MS91 simulation through
native save, private-store reopen, JSON backup/restore, copy-only MS91 download
export, explicit import, and loaded replay seeking, comparing complete retained player car
state at the endpoint. Saved configuration/input bytes and source files are
unchanged. Deferred MS91 replay entry now refreshes its seek snapshot after
initialization; previously it retained pre-entry startup state and replay
seeking diverged. Legacy snapshot behavior is unchanged. Allocated result
metadata/retained time fields and private-score preservation also pass.
This is automated native-runtime evidence, not browser interaction or a full
original DOS frame-by-frame comparison.
Run this explicit, non-skipping corpus gate with
`npm run test:ms91-lifecycle -- /absolute/path/to/competition`.
All four required reference paths must exist before any case runs; references
stay outside deployment assets. The ordinary ranking suite's optional corpus
case is not a substitute for this release gate.

Browser backup checkpoint: local preview imported its existing two-file backup
through the visible Import backup control. The resulting status was
"Imported 0 files. Existing files were kept. Reload the page before playing."
No browser warnings/errors were captured. This verifies the non-overwriting
duplicate-import path only, not recovery into an empty browser database.
Earlier BB11 investigation is supporting evidence only, not proof of MS91
compatibility. Not yet released. Fresh races still default to legacy physics.

## Current release status

Enhanced-renderer smoke follow-up resolves the earlier activation uncertainty:
added nonvisual canvas diagnostics for the actual world/background branches.
Current muted MS91-preview race reports `enhancedWorld=webgl` and
`enhancedBackground=panorama`; V selects `enhancedCamera=chase-1`. Screenshot
visibly shows the enhanced 3D Countach, chase view and ground shadow. No fallback
is active in that check. Restored original camera with F1, stopped via Restart,
and verified Ready to play. Type checking and upgraded-crash regressions pass.
This verifies renderer activation/chase smoke behavior, not all enhanced
graphics, cars, tracks, lighting or a completed MS91 race.

Browser fresh-race smoke checkpoint: current local MS91 preview entered the
main menu and Countach DEFAULT fresh race, accepted driving input and paused
into replay controls. No captured browser warnings/errors. Test stopped with
Restart, returning Ready to play. **Enhanced rendering is not passed:** status
says upgraded driving graphics, but screenshots show the original-looking flat
scene. Investigate renderer activation/fallback before claiming preservation.
This did not complete a race, save/submit a score or establish exact engine
identity from a resulting proof; those remain open.

Browser preflight checkpoint: existing dev session4710/process39876 remained
live on IPv6 loopback5191; IPv4 check failed, but IPv6 returned HTTP200.
No server restart was needed. Reused the existing local MS91-preview browser
tab. Setup opens, its sound menu selects “No music or sound effects”, and
Escape closes it with “Saved settings are unchanged.” Game remained stopped
at Ready to play; observed updated background/Roland controls remain present.
This is preflight/setup evidence, not a completed modern race or enhanced
graphics gameplay verification. No production writes occurred.

Post-dialog/original-contact audit regression checkpoint: expanded
`test:ms91-rate` now includes fourteen rate/menu/suspension wiring checks;
the full command passed. Re-ran `test:compatibility` and `test:rankings` against
the current physics/menu work: both passed, including legacy IDs/bytes,
sidecar row preservation, private tables, offline proofs and consent behavior.
These tests use isolated fixtures; production remains untouched and still
requires release-time preservation verification.

Latest source safety checkpoint:
`PlayStunts-backups/2026-10-10-ms91-suspension-rate-checkpoint` contains 1,474
source entries, SHA-256
`bdff611efabf5559ba195eedb733ab5a6c66b4d641ccca1b2ab039edaae20d00`.
Independent hash and archive-list checks passed. It excludes production data,
ignored dependencies and external symlink targets; not a deployable archive.
The complete existing `npm test` chain passed after the suspension/rate edits,
including graphics, chase motion, replay presentation, audio, collision and
default setup regressions. This is automated regression evidence, not proof
of browser visual fidelity or full original-MS91 gameplay compatibility.

The chronological checkpoints below record evidence as it was gathered; earlier
"pending" statements may have been superseded by later checkpoints. Current gates:

- Passed: original car-resource parity; bounded original engine/grip arithmetic
  and routine comparisons; two-track reference replay comparisons; explicit
  stored-engine routing; private score-table separation; mixed-engine server
  ranking/history/retention tests; copy-only download/import and backup tests.
- Passed locally: legacy/MS91 HTTP download bytes and re-verification; public
  desktop newer-engine ranking/notice/download; exact 390-pixel legacy notice
  layout and cancellation; full ranking and compatibility regression suites.
- Partial: original MS91 DOS playback observed for Audi, Porsche and second-track
  Indy, but precise original finish-tick/full-frame contact evidence is missing.
- Passed at latest source checkpoint: full existing regression suite after time
  overlay integration; ranking/submission suite; cadence-safety suite; production
  build and492-message language coverage. Four Chocolate-derived reference
  recordings cover10097 checked frames with zero position/selected-physics
  differences, plus full-car-state rewind. These do not replace originalMS91
  frame/contact evidence or browser interaction/visual checks.
- Partial: cadence metadata, private backup preservation, allocation/reset,
  selection/save/re-entry and time-formatting routing are integrated.10 Hz
  sessions, imports, downloads and public submissions remain deliberately
  disabled until full initialization/timing/recording/scoring and original-game
  verification is complete. MS91 time arithmetic passes131072 original-code
  comparisons; complete formatter text matches4052 boundary/random original
  captures, including numeric conversion and string routines. Retained result
  stack layout and full in-game display verification remain open.
- Pending: modern fresh-race/result/reload browser flow, modern private import
  and restore browser flow, full EN/ES/IT interactions, alternate-display visual
  checks, complete original engine/contact/opponent evidence, updated FAQ/README,
  final source backup and production preservation checks. Repeat regression/build
  checks after remaining implementation, rather than treating earlier passes as
  approval of later edits.
- Not enabled: MS91 fresh-race default and live publication. Existing stored
  replay/score data and production remain unchanged.

## Verified locally

- Legacy ranking and general regression suites pass with experimental changes.
- Untagged server submissions explicitly select legacy physics, ignoring caller defaults.
- Legacy acceptance IDs and canonical recording bytes are unchanged.
- Relabeling a legacy finished recording as BB11 fails verification.
- Experimental BB11 mode matches 1,304 frames of Marco DEFAULT/Indy controls against Chocolate Stunts default physics, and 958 frames of the bundled BB11 DEFAULT recording: positions plus yaw, pitch, roll, gravity, steering, RPM, speeds, wheel angle, spin, front response, demanded grip and surface grip.
- Copy-only 24/26-byte replay export/import tests pass. No stored bytes rewritten.
- Both 1991 engine identities have copy-only export/import and download endpoint
  tests, including canonical-file retention and metadata responses.
- Original MS91 EGA image inspection identifies grip at offset 42326 and engine
  update at 41074. Grip contains signed shifts for steering and negative wheel
  heading damping. The former generic engine locator at 37120 was race setup,
  not the engine update; it is not evidence of engine equivalence.
- Opponent engine and grip steps now receive the track's explicit engine identity;
  omitted identity retains legacy behavior. Type checks and general tests pass.
- Original MS91 engine disassembly shows `SAR AX,1` at image offset 0xa407,
  immediately after force/mass long division. TypeScript arithmetic tests cover
  all signed 16-bit force values at three masses for both 1991 identities.
  This is a bounded arithmetic check, not full physics/playback verification.
- `tools/check_original_ms91_signed_shift.py` is an optional read-only emulator
  diagnostic. Sandboxed runs terminated with illegal instruction (exit 132).
  Outside the sandbox it successfully executed the original engine halving
  (`0xa407`), grip steering quartering (`0xa729`) and wheel-heading damping
  shift (`0xa8fa`), each across all 65,536 signed words. All matched expected
  signed rounding. Full routines and complete playback remain unverified.
- `tools/compare_original_1991_engine.py` executes the full BB11 and MS91
  engine routines with identical synthetic car/tuning data and 20 Hz inputs.
  All 1,000 tested states returned normally, changed, and produced identical
  car-state bytes. This supports shared engine behavior for these cases only;
  real car resources, grip/contact, opponents and complete races remain gates.
- The same original-routine diagnostic with `--routine grip` now compares
  1,000 synthetic grip states (signed steering/spin, mixed surfaces, both
  player/opponent branches). All returned, changed state and matched between
  BB11/MS91. Synthetic grip tuning and the known grass-drag divisor table are
  initialized explicitly; this does not prove original-resource or track parity.
- Repeated both full-routine comparisons with actual `simd` resources from all
  eleven original cars (`--bb-cars` and `--ms-cars`). Each resource was compared
  byte-for-byte across the two releases; all matched. Each routine again matched
  all 1,000 synthetic car states with real tuning, and every state updated.
  Car tuning parity is verified; whole-track playback is not.
- Original MS91 contact disassembly confirms landing sound at signed fall speed
  above 250 (`0x83f5`) and crash above 23275 (`0x840a`), matching experimental
  1991 thresholds. Corkscrew contact rejects absolute lateral position >=150
  (`0x115d8`) and height >=265 (`0x115ec`), also matching the newer path.
  BB11 has the same instruction/threshold forms at corresponding offsets.
  These bounded checks do not establish all contact or collision behavior.
- The MS91-tagged server verifier completes ZCT300 `25-MAR` (Audi, 2536 ticks)
  and `18-ERI` (Porsche Carrera 4, 2244 ticks), and copy-only exports preserve
  track/control bytes. Differential replay checks match every compared state
  field and all 2556/2264 frame positions against existing Chocolate BB11 dumps.
  Those dumps are not original MS91 captures; original MS91 playback remains
  required before the fresh-race default switch or publication.
- Original MS91 DOSBox startup reaches its manual-word check. The answer sheet
  linked by Stunts Wiki Download is downloaded to the isolated compatibility
  directory (`4d-css.pdf`) and text extraction succeeds. The observed prompt
  26/1/1/5 has answer `mode`. No executable was patched; the muted test app was
  closed. Loading and completing the selected test replays remains pending.
- Subsequent muted DOS test with seamless mouse controls successfully answered
  the original manual prompt, loaded copied `MARCO.RPL` (ZCT300/25-MAR), and ran
  fast playback through its complete displayed duration 2:07.80. End view shows
  road/bridge ahead, without a crashed windshield; Continue Driving is disabled.
  This is observed load/full playback evidence, not an exact original finish-time
  or frame-state capture. A second car and precise finish verification remain.
  A second compatibility-app window was discovered when closing the test; both
  were closed, with the final observation reporting no eligible running process.
- Second original MS91 playback test loaded copied `ERIK.RPL` (ZCT300/18-ERI,
  Porsche Carrera 4) and ran fast playback to displayed end 1:53.20 without an
  obvious crashed windshield. End view remains on the road approaching the
  bridge. The muted app was closed and returned App quit. Like the Audi check,
  this is visual playback evidence, not an exact captured finish tick; both
  recordings are on ZCT300, so second-track and precise state checks remain.
- Original engine/grip routine comparison now accepts `--state-dump` and
  `--car`. Both original routines matched on all 2556 captured Audi states from
  25-MAR's Chocolate dump with actual Audi SIMD tuning. Engine inputs remain
  seeded test commands; grip alternates player/opponent branches. This checks
  routine equivalence on real race states, not full MS91 frame progression.
- Captured-state comparison now optionally takes `--replay`, validates its
  frame count/cadence/car against the dump/tuning, and uses each state's recorded
  next-frame command for engine updates. Engine and grip comparisons matched
  all 2264 Porsche Carrera 4 states from 18-ERI with real tuning and recorded
  commands. Grip still alternates player/opponent branches as a differential
  stress check, not a faithful full-game playback reconstruction.
- Routine harness audit found raw SIMD's allocated drag-table pointer was not
  initialized. Added the original 64-word quadratic table and far-pointer setup.
  Repeated engine comparisons with actual recorded commands: all 2264 Porsche
  and 2556 Audi states still match between original BB11/MS91. Earlier raw-tuning
  engine runs did not verify aerodynamic resistance and are superseded by these.
- Grip harness audit likewise found its cleared DS omitted the sine lookup.
  The harness now locates the original 257-word table uniquely in each image,
  verifies equal bytes, and installs it at BB11 DS:4c84 / MS91 DS:4ca4.
  All 2264 Porsche captured-state grip comparisons still match with this table.
  Earlier zero-table grip checks did not exercise correct cosine-dependent speed.
- Added direct reconstructed-engine oracle comparison, rather than only comparing
  BB11 to MS91. Exported original MS91 routine outputs for all 2264 captured
  Porsche states with recorded inputs, real SIMD and initialized drag table.
  `tools/check_ms91_engine_oracle.ts` matches every exposed EngineState field
  against `stepEngine(..., 'ms-1991')` for all outputs. Full-race contact/state
  progression remains separate and unverified.
- Direct reconstructed-grip comparison now matches all exposed GripState fields
  across 2264 original MS91 routine outputs for Porsche captured states, both
  player/opponent branches. Initial test mismatch at case 951 was a harness
  omission of the sixth surface-grip word (surface ID 5); corrected the harness
  to match the existing production resource extractor's six unsigned words.
  No production physics change was required for that mismatch.

## Required before publication

- Retention audit reproduced cross-engine eviction in the old cleanup SQL.
  High-score POST now uses engine-scoped cleanup; the isolated regression keeps
  legacy score, history and replay rows while retaining five modern history rows.
  Replay-sharing POST and background reassessment now use the same scoping.
  Handler/reassessment tests and type checks pass. Mixed-engine submission,
  sharing (seven modern shares) and background reassessment SQLite fixtures
  leave legacy score/history/replay rows unchanged. Native score-response
  ranking and offline caches are engine-scoped. Website ranking/presentation
  still needs an engine-aware audit before release.

- Completed new-engine race checked against original MS91 DOS executable, with a second car/track and representative jumps/collisions.
- Car simulation resources compared against MS91; document remaining version differences.
- Persist immutable engine identity for new public records without modifying legacy scores/replays; audit retention/reassessment and ranking behavior.
- Propagate engine identity through private file persistence, replay selection, load during race, restart, rewind and resume.
- Wire future fresh races to MS91 only after preceding gates pass. Demos and old recordings remain legacy.
- Version-aware public downloads and compatibility notices; each file is exported
  only for its recorded engine. Header conversion does not convert physics.
- End-to-end local browser tests: fresh race, score submission, reload, replay playback, download, legacy playback; desktop/mobile UI and EN/ES/IT.
- Final regression, type, build and production preservation audit, then publish and verify.

No production data writes or deployment have been performed during this work.

### Private score-table isolation checkpoint

- The score-file overlay routes legacy tables to their unchanged `.HIG` keys,
  Mindscape 1991 tables to `.M91`, and experimental Brøderbund 1991 tables to
  `.B91`. The original game still requests `.HIG`; only private storage routing
  changes. Modern tables do not inherit the legacy starter scores.
- Retained verified records are restored only into the matching engine table.
  Allocated race results use the runtime's recorded engine explicitly, including
  their initial score-file read before the result-panel context exists.
- `tools/test_global_score_native_results.ts` passes all three tests: separate
  tables survive reopen, legacy bytes/storage remain untouched, legacy slower-run
  restoration works, and top-seven name entry still does not auto-publish.
- Type checking and diff whitespace checks pass. This is local automated evidence;
  browser save/restore and modern completed-race result flows remain release gates.

### Private replay import/download checkpoint

- Private replay uploads now require a recorded-version selection (legacy MS,
  MS91 or BB91) before importing. The choice is explicit, not inferred from file
  size; the panel states that selecting a version does not convert physics.
- Private replay downloads show the same engine-specific compatibility label as
  public downloads and wait for OK. Track downloads remain direct. The notice
  uses a portal with viewport-clamped positioning to avoid the enclosing file
  dialog's layout. Desktop/mobile visual and interaction verification is pending.
- Import/export unit checks, notice wiring checks, type checking, whitespace and
  EN/ES/IT coverage checks pass. These are not end-to-end browser evidence.

### Local preview database checkpoint

- Local preview originally had the exact schema of migrations 0000–0006 but an
  empty migration journal. The normal local migration command consequently
  refused to recreate existing tables. No remote command was used.
- `tools/reconcile_local_compatibility_database.ts` verifies that exact schema,
  restricts its target to the checkout's local Wrangler SQLite directory, backs
  it up, applies only 0007–0011 in a transaction, compares every pre-existing
  row's original columns, and records the verified migration names.
- Executed successfully: preserved 44 local scores, 3 replay records, 1 shared
  track, 4 score-track names, 8 acceptance records and 6 request records.
  Backup: `playstunts-local-db-backup-dTncm1/before.sqlite` in the macOS temporary
  directory. The local legacy leaderboard endpoint now returns HTTP 200.
- Existing rows were not relabeled or rewritten; current-rule fixture seeding
  and mixed-engine browser score flows remain pending. Production is unchanged.

### Local HTTP download integration checkpoint

- Added two separately verified preview fixtures without replacing any existing
  score/replay row: legacy CTKFIN-derived completed run (1173 ticks) and MS91
  ZCT300 Audi run (2536 ticks). Seed helper restricts the database to local
  Wrangler state, backs it up, refuses existing fixture IDs, and checks old rows.
- `tools/check_local_replay_downloads.ts` fetched actual metadata, canonical
  imports and download responses for both local fixtures. HTTP 200, correct
  engine header and attachment names, exact expected export layouts, every track
  and input byte, and repeat verification of both finish times passed.
- Before/after comparisons of all local score, replay and engine rows passed.
  This proves local HTTP export/import integration; it does not substitute for
  original MS91 full-game or desktop/mobile browser interaction verification.

### Expanded original-routine comparison checkpoint

- Generated original MS91 engine and grip outputs for all 2556 Audi ZCT300
  captured states, using the matching recorded next-frame input and original car
  resources. Both reconstructed routines match every output. These complement
  the earlier 2264 Porsche captured-state comparisons.
- Generated another 1000 deterministic synthetic cases per routine, cycling all
  eleven original car resources, signed steering/spin, varied speed/RPM, surface
  combinations and acceleration/braking/shift inputs. Both reconstructed routines
  match every original MS91 output. Original BB11/MS91 outputs also match for
  these cases. Correct original sine and aerodynamic tables were installed.
- Diagnostic JSON files: `ms91-audi-{engine,grip}-oracle.json` and
  `ms91-allcars-{engine,grip}-oracle.json` in the isolated compatibility directory.
- Scope: acceleration and grip only, synthetic grip uses track element zero;
  this does not prove full-frame chassis/contact/collision or every stunt element.
  Full original-game finish/contact and second-track evidence remain required.

### Second-track reference coverage

- Downloaded public ZakStunts ZCT299 archive (Olyssipo) into the isolated
  compatibility directory, leaving its replay sources unchanged. Most entries
  use custom CSIL resources unavailable in the original-car test setup; these
  were excluded explicitly, not counted as passes.
- Original-car entries `01-ARG.RPL` (Indy, 1471 frames, finish 1451 ticks)
  and `20-STB.RPL` (Countach, 3806 frames, finish 3786 ticks) were captured with
  the headless Chocolate BB11 reference and compared with reconstructed MS91.
  Both match every compared position, rotation, steering, RPM, speed, wheel,
  spin and grip/surface field for every frame, with successful finishes.
- This is a second-track reference-engine comparison, not an original Mindscape
  DOS full-frame capture. The original MS91 full-game gate remains open.

### Original MS91 second-track GUI observation

- Ran the untouched original MS91 DOS game with isolated test files and the
  muted configuration (`nosound=true`, MIDI disabled). Answered its manual-word
  prompt, loaded the ZCT299 Indy replay as temporary `ARG299.RPL`, and played
  through its recorded duration. The viewer showed total 1:13.55 and final cursor
  1:13.50, with the car airborne near the finish and Continue Driving disabled.
- No visible crash was observed. The final airborne view is consistent with
  the reference/reconstructed high-altitude end state, but does not provide an
  exact original finish-tick or full-frame state capture. Do not count that
  stronger gate as passed from these screenshots alone.
- Closed the test application after playback; app-quit was confirmed. No website
  score/replay records or original executable files were changed.

### Regression and public-browser checkpoint

- Reran full `npm run test:rankings` and `npm run test:compatibility` after
  private table/import/download changes; both completed with exit zero. The
  deliberately injected storage-failure diagnostic in the atomic submission
  test is expected; its preservation/response assertions passed.
- Local browser: selected Mindscape 1991, saw only MS91 TEST with one Audi
  score at 2:06.80, expanded its collapsed track, and clicked DOWNLOAD REPLAY.
  The modal displayed the exact 25 February 1991 compatibility label and OK/
  Cancel controls, with no hydration error. This verifies that desktop flow;
  actual browser download action, mobile layout and language switching remain.

### Browser download and responsive notice checkpoint

- Pressed OK in the public MS91 compatibility panel. Browser download completed
  as `RBB9A189.RPL`; compared that actual downloaded file byte-for-byte with the
  expected export generated from its unchanged local stored replay. Passed.
- Requested 390×844 viewport through the browser capability, but read-only DOM
  measurement reported effective 582×1260. At that actual responsive width, the
  panel fit fully inside the viewport (left 111, right 471; top 520, bottom 739),
  text wrapped cleanly, controls were separated, and Cancel returned to the board.
  This is not evidence of a 390-CSS-pixel viewport. Narrower testing remains.
- Reset the temporary viewport override. No source replay/score mutation or
  deployment; the browser download is a separate user Downloads file.

### Narrow viewport observation — not yet visually verified

- Requested 260×563 through the scaled in-app viewport control; actual browser
  measurement was 388×840 CSS pixels with page width 388 (no horizontal overflow).
  The MS91 notice opened; measured dialog bounds left 19/right 369/top 311/bottom
  530 fit within that viewport, and buttons were approximately 45 pixels high.
- Both screenshot APIs showed the notice clipped at the image's top despite
  fixed-position DOM bounds within the viewport, visualViewport offsetTop zero,
  and scale one. This contradictory evidence is unresolved: do not count narrow
  mobile visual QA passed solely from layout measurements. Temporary override
  reset and Cancel returned successfully to the board.

### Exact-mobile capture resolution

- Subsequent developer emulation confirmed exactly 390×844 CSS pixels, page
  width 390, visualViewport offset zero and scale one. Native mouse mapping did
  not follow the developer override, so semantic keyboard activation was used
  for the collapsed track, replay link and Cancel button.
- The ordinary screenshot captured the wrong scrolled/device-pixel region.
  `Page.getLayoutMetrics` exposed CSS/device metrics; capturing the measured CSS
  visual viewport with explicit clip (including pageY) produced a complete
  390×844 screenshot. The legacy compatibility panel is fully visible, with
  wrapped text, yellow heading/OK, spaced controls and no horizontal overflow.
- This resolves the earlier contradictory narrow screenshot observation for
  this tested notice. Cancel returned focus to the replay link. Cleared developer
  device metrics and reset viewport override afterward. No CSS fix was necessary.

### Actual web car-resource audit

- `tools/audit_ms91_car_resources.py` reads the live checkout's
  `public/game/assets.json`, not independently constructed diagnostic tuning.
  All eleven cars' full 776-byte raw simulation resources match original MS91
  `CAR*.RES` SIMD byte-for-byte. Fourteen extracted fields per car also match:
  gears, mass, braking, RPM limits, gear ratios/knob coordinates, aerodynamic
  resistance, idle torque, torque curve, grip and six surface-grip entries.
- Read-only audit passed; no asset replacement or legacy car-data rewrite was
  needed. This closes the actual loaded-car-resource parity gate, not contact
  or complete original-game finish verification.

### Browser private replay persistence checkpoint

- Local browser pre-import backup contained zero private files. Uploaded the
  actual public `RBB9A189.RPL` download through the file chooser, selected MS91
  explicitly and confirmed OK. The browser reported a successful private import.
- Downloaded the resulting JSON backup and decoded it: one `C:\RBB9A189.RPL`
  file, engine `ms-1991`, exact canonical bytes matching explicit import of the
  original download. Existing files were not overwritten.
- Reloaded the page, reopened private downloads, and saw the retained replay.
  Its notice still identified 25 February 1991. Pressed OK and compared the actual
  re-exported download byte-for-byte with the original public download: identical.
- Browser private import, persistence and re-export gates pass for this MS91
  fixture. In-game selection/playback and full backup restore remain separate.

### Local fresh-race QA switch

- Added `?preview-engine=ms-1991` override restricted to loopback hostnames in
  `selectBrowserFutureRaceEngine`. Public hosts ignore it and retain the gated
  release default. It selects fresh races and corresponding private score tables
  only; replay factories still select each saved recording's explicit engine.
- Rollback/preview-host tests, private score-flow regressions and type checking
  pass. Fresh MS91 browser races can now be tested without enabling the live
  release default. This is test infrastructure, not completed fresh-race QA.

### Muted browser gameplay preparation

- Opened the original Setup menu in the localhost MS91 preview, selected its
  first sound choice (No music or sound effects), then exited to save. Setup
  closed normally. Browser backup shows `C:\SETUP.DAT` with `load.exe /u MCGA
  /spc /ns`, confirming the original no-sound launch switch. The imported MS91
  replay still has its engine identity and 4362 canonical bytes.
- This changes only localhost's private test settings, not production or global
  DOSBox settings. Gameplay is not counted passed from configuration alone.
# Current-worktree regression refresh — 10 October 2026

Slow-video repaint-decision prefix c359..c3b4 is now mapped and independently
verified: seed15 flags to3, suppress unchanged region5 when its four bounds and
render identity match, apply detail4 identity handling, and clear pending count.
Combined oracle now passes300 original-code cases across initialization,
repaint flags and cache commit, with explicit disabled/enabled exits and write
boundaries. Rectangle merging, ordering and actual copy/presentation calls
following this prefix remain unimplemented/unverified in the active renderer.

The new working/retained video-rectangle helpers now match200 bounded original
MS91 machine-code cases (100 each), including active flags0/1/2/FFFF and
randomized rectangle/frame bytes. Original blocks must reach their expected
exit and may write only documented output regions plus caller stack locals.
The read-only oracle sends JSON through process memory, not saved fixtures.
This closes those two isolated steps only; full slow-video policy and rendering
integration still remain open.

Slow-video policy audit advanced: original disassembly confirms c552..c58b
initializes all15 working rectangles at9710 from339A and sets caller flag8;
disabled mode sets0. c487..c4b4 copies frame identity B0DA→970A and all15
rectangles A250→A65E only when9690 is nonzero. Isolated mapped helpers and
tests cover0/1/2/FFFF flags, offset Uint8Array views and exact write boundaries.
They use ORIGINAL MS91 data-layout offsets and are not wired to the legacy-
layout renderer. Machine-code execution oracles for these new blocks and the
remaining slow-video branch policy are still required before enabling the menu.

Upload preparation now has an explicit test-only MS91 slow option and preserves
the decoded10 Hz metadata with canonical bytes. Actual original DEFAULT slow
import→export reproduces every external byte; its backup/restore exports remain
exact. Default imports still reject10 Hz, and the MS91 option does not enable
BB10. Existing20 Hz imports retain their prior metadata shape and pass regression
tests. The browser upload caller does not supply the experimental option, so
public behavior is unchanged; local browser/menu integration remains pending.

Experimental small-bank growth is now integrated into allocated slow replay
loading. The replacement allocation/replay is prepared in copied memory and
committed only after the native file read succeeds. Errors during growth/read
or subsequent route/resource preparation restore the complete pre-load memory graph.
Required slow+fast reference test passes retained10→20→10, initial-small20→10,
both finishes, no fresh-score eligibility and unchanged sources. Injected
missing-file and post-commit route-analysis failures both restore exact prior
memory. Default/public unsupported-load guards still pass. Browser slow import,
expanded speed-menu wiring and public scoring remain gated/incomplete.

Checkpoint growth prerequisite implemented as a copy-only transaction:
`growReplayCheckpoints` allocates a new resident bank, releases the old block
only in the copied graph and verifies resulting capacity. Tests on a real
allocated race graph preserve12000 patterned recording bytes, original live
memory, and all caller input memory; adequate banks are idempotent and malformed
pointers fail without input changes. It is NOT yet wired into replay loading:
new replay initialization and failure/rollback integration still require tests.

Experimental slow-load guard now checks ACTUAL resident checkpoint-bank capacity,
not current logical cadence. Bounded tests cover all four display layouts,
exact capacity, one-paragraph-short allocations, shifted pointers and cached
rather than resident blocks. The full slow/fast reference test passes10→20→10
with the retained larger bank and reaches both original finishes. A separately
allocated20 Hz small bank rejects10 Hz loading before reading replacement data.
This supersedes the earlier blanket20→10 restriction. Small-bank growth and
public/browser enablement remain incomplete; the experimental flag is required.

Mixed-cadence test extension: the allocated slow-load test now requires BOTH
original slow DEFAULT and a genuine modern20 Hz reference. After the slow
load/rewind checks it loads the fast Indy replay, verifies20 Hz identity and
recording length, seeks0/100/end and reaches the finish with playback-only
eligibility. A subsequent20→10 request remains conservatively rejected before
its bytes are read. Both source files are asserted unchanged. Physical
checkpoint-capacity validation/reallocation remains necessary to enable the
reverse transition safely; current session cadence alone is not bank capacity.

Test-only 10 Hz allocated replay loading now works when the existing session
already owns a10 Hz MS91 checkpoint allocation AND the data explicitly enables
the experimental path. `test_ms91_allocated_slow_load.ts ms91/DEFAULT.RPL`
passes reload, seeks0/1/100/600/958 versus independently stepped persistent car
state, original finish, no fresh-score eligibility and unchanged source bytes.
The normal unsupported-load guard still passes before reading/replacing banks.
20→10 allocation transitions and public/browser enablement remain blocked;
this does not expose slower settings or import in the browser.

Slow download after mixed backup restoration now reproduces the complete
original reference file exactly and preserves untagged legacy replay/score
bytes. Type checking passed. Import-boundary regression explicitly verifies
that the new slow export cannot silently enter the still-incomplete browser
20 Hz-only upload path, either with MS91 selected or with no engine supplied;
all input bytes remain unchanged on rejection. Slow import/load integration
is still required before exposing the expanded speed menu.

## Requested post-upgrade scoreboard UI follow-up

Sven relayed Marco's request: the separate **Car records** menu duplicates
the purpose of **By car**. After the engine upgrade, move the existing Car
records functionality, including all car images, into the **By car** view.
Remove the separate Car records menu/disclosure. Keep the functionality;
this is consolidation of its entry point, not deletion of car records,
stored scores, or car imagery. Implement and test after the upgrade, not now.


MS91 private 10 Hz download formatting is now cadence-aware and copy-only.
`test_ms91_native_slow_download.ts ms91/DEFAULT.RPL` proves byte-for-byte identity
with the actual original slow reference, including the full header, track and
all controls. Canonical bytes and the source file remain unchanged. Native
download regressions pass for20 Hz and MS91/10 Hz; legacy/10 and BB/10 remain
blocked. This does NOT enable browser slow-race settings, 10 Hz import/session
loading, or public10 Hz scoring. Their separate integration guards remain.

Browser caller integration corrected: manual race presentation and results now
derive engine/cadence from `runtime.session` via `activeRaceData`, not the page's
original data object. This applies after replay loads and race/replay reentry,
so alternate display resources and results cannot keep stale legacy defaults
while the active session is MS91 (or vice versa). Pure metadata-copy tests pass
for engine/cadence forwarding, shared-reference preservation, input immutability
and unknown-value rejection. These tests do not authorize unsupported cadence
sessions or replace browser end-to-end checks.

Expanded alternate-display matrix passes all36 combinations: six opponent
selections × MS90/MS91 × CGA/Tandy/EGA. Correct speed byte9 and opponent6's
changed bytes11/12, version-isolated cache basenames, working native raster
frames, palette bounds and unchanged actual live simulation/shared resources
are asserted. The displayed opponent selection is changed only in a detached
view; these are resource/render checks, not36 independent opponent driving
replays or enhanced-renderer/browser fidelity tests.

Alternate display test now also renders a settled race frame in all six
engine/mode combinations. Each frame has 64000 pixels, more than one colour,
and valid CGA four-colour or Tandy/EGA sixteen-colour palette indices. Rendering
uses a detached live view and changes only the renderer's documented redraw
flags in that view; the actual race memory remains unchanged. This checks
working native rasterization, not enhanced graphics fidelity or browser input.

Alternate-display integration fixed: `prepareNativeDisplayRace` now adapts
versioned route tables, supplies exact MS91 packed opponent resources under
the isolated cache identity, and forwards the engine into opponent preparation.
`test_versioned_display_race_resources.ts OPPAUDI.RPL` passes all six combinations
of MS90/MS91 and CGA/Tandy/EGA. It verifies the correct original speed byte and
cache basename, unchanged live simulation memory, immutable shared route tables
and unchanged replay source. This is resource-graph verification, not a rendered
alternate-mode driving/browser test.

Browser observation refresh: local server PID39876 still listens on port5191.
The existing MS91 preview tab's DOM is visible; full-page screenshot capture
works while viewport captures sometimes return a blank background. The active
Setup menu visibly shows No sound, and Roland remains OFF. Muted launch reached
the original animated-logo status; Restart then returned Ready to play Stunts.
This verifies launch/stop and usable visual capture only, not complete race,
enhanced in-race graphics, Options, mobile or save/restore browser QA.

**Cache/engine-switch investigation — scoped regression now passes:**
All six Audi opponent profiles pass the strengthened full car-state and seek
reference test, including original-derived legacy routes, independent resets
at each sampled target, MS90→MS90→MS91→MS90→MS91 and genuine legacy SKIDS.
One opponent4 run was stopped after unexpectedly long execution; the bounded
rerun passed. The reference now asserts clock convergence within two steps per
captured input, so it cannot silently loop indefinitely in that catch-up path.
Type checking passed. These scoped results supersede the historical failure
notes below; complete original crash/seek parity and browser QA remain open.
Opponent6 seek comparison now passes after correcting its reference caller:
seek uses replay mode2/audio-exit flag1, entry stack FEFC and remaining-target
SI, whereas the former reference used normal-drive EEE2/SI0. Each sampled
target now starts from an independently restored reference initializer and
advances with matching seek caller inputs. Full active-car equality remains
required; no game physics or checkpoint implementation was changed for this
result. Opponent6 passes MS90→MS90→MS91→MS90→MS91 and genuine legacy SKIDS.
The broader five-opponent suite must be rerun with the strengthened reference;
original crash/seek caller semantics still need separate bounded verification
before treating this as complete original replay-seeking parity.
Opponent6 refinement: complete 16-byte speed profiles agree. Diagnostic
`CROSS_ENGINE_FIRST_DIFFERENCE=1` advances both retained and independent
original-route sessions sequentially for all2556 inputs: complete active-car
states agree at every tick. The diagnostic then deliberately stops with
"Sequential frames match: investigate seek/checkpoint differences instead";
that is diagnostic evidence, NOT a passing full-switch test. The still-failing
sampled test rewinds/seeks at 0,1,20,100 and2556, so investigate checkpoint
restoration and retained seek state instead of changing driving physics.
Updated full-state test requires the original reconstruction root and verifies
each legacy cached route against original machine code from actual pre-load
memory. Its independent car simulation uses that original-derived route rather
than an unrelated allocation's route. Opponents 1–5 now pass all sampled car
states, rewind checks, MS90/MS91 switches and genuine legacy SKIDS playback.
Opponent 6 still fails final legacy opponent-car equality despite passing the
original route oracle. That remaining mismatch is NOT waived. Investigate
complete speed/target fields and initialization/checkpoint/random state next.
The same exact-memory original comparison now also passes MS91→MS90 for
opponents 2/3/6: 68, 68 and 67 path words respectively, all identical to original
MS90 execution from the captured pre-preparation memory. The original reads
the legacy `.pre` bank on these switches, confirming the distinct modern cache
name does not replace it. Source replays are unchanged. The earlier fresh-car
comparison's equal-route assumption is contradicted by original behavior;
replace that assumption with an original-derived route oracle, while retaining
full car-state/rewind and engine-isolation checks. This does not close full
legacy replay-loading, browser, or modern original-executable verification.
Authoritative refinement: `compare_original_cached_replay_preparation.ts`
captures the ACTUAL unchanged-opponent refresh memory through the existing
progress callback, before route preparation. It runs original MS90 machine code
from that identical retained allocation state and compares the resulting path.
AUDIOPP2 matches all 67 produced path words; the original also uses the cache
(only the missing `opp2.res` probe is read). Thus at least this fresh-versus-
cached discrepancy is present in original route preparation from the same
memory, not an established reconstruction defect. Do not patch legacy behavior
to match an independently allocated fresh session. Further engine-switch and
remaining-opponent original comparisons still need to establish the scope.
Added `check_original_opponent_cache_cycle.py`, running original MS90 machine
code with memory-only file-service adapters. Both calls must reach the original
return. Six opponents retain the same chosen path across consecutive
preparations for branch tiles 4/20 and 70/80; the second preparation avoids the
packed file read (one missing-RES probe versus first-load two probes). These
12 bounded cycles preserve working allocation placement. They do not yet
exercise the complete replay loader's allocation changes, so they cannot
establish that fresh and cached paths agree for every replay. Sandbox emulator
initialization exited 132; the identical isolated read-only check succeeded
outside it. No original files, scores or replay fixtures were written.
Original baseline refreshed: `test_original_opponent_preparation.ts` requires
the retained `load-opponent-preparation-original.json` capture and checks all
24 original preparations across six opponents. The CURRENT legacy loader
matches persistent data below the captured stack boundary and the complete
allocation heap hashes in all cases. Fixture bytes remain unchanged. These
captures cover fresh preparations, not repeated cached replay loads; therefore
they constrain any fix but do not close the cache/reload mismatch.
`diagnose_opponent_cache_costs.ts OPPAUDI.RPL` isolates the cache mechanism:
fresh VLE expansion leaves compressed staging bytes beyond the retained bank
paragraphs; paragraph-only restoration omits them. All six profiles have
different cost-span bytes in this isolated model; opponents 2/3/5 change route
at entry 5. The actual allocated reload fails 2/3/6, not 2/3/5, so surrounding
allocation state also matters. This confirms tail sensitivity but is not yet
an exact whole-reload fix or an original-executable cache oracle. Source replay
bytes are asserted unchanged by the diagnostic.
Further read-only diagnostics on AUDIOPP2: both post-load caches contain an
identical `opp2.pre` bank (2003 bytes, 126 paragraphs, `sped` offset 1961),
including the 256 bytes observed from `sped` in cached memory. Those bytes are
not necessarily the resident allocation bytes consumed before release. The
bank ends only 42 bytes after `sped`; the planner reads 256. Capture the actual
resident cost span before release to distinguish allocator-adjacent data from
route-analysis differences. Cached output equality alone is not a fix or pass.
Baseline clarification: added an MS90→MS90 reload before any modern session.
AUDIOPP2 reproduces the same alternate-route choice and final-car mismatch in
that initial legacy-only reload. Therefore MS91 contamination is not required
to trigger it. The test remains failing; investigate the existing allocated
reload/cache tail semantics rather than assuming modern physics caused it.
Diagnostic refinement: `CROSS_ENGINE_DIAGNOSTICS=1` on AUDIOPP2 shows that
the 16-byte speed profiles match the fresh session, but the MS90 opponent path
already differs before driving: entry 5 selects route 68 instead of 5, followed
by the alternate branch. Thus the late pose mismatch originates in route
preparation, not merely post-load car stepping. The MS91 path differs only in
an unused trailing word in this diagnostic; checked driving remains identical.
Investigate the retained resource-adjacent cost bytes/cache allocation used by
the original planner before changing reset or physics behavior.
`test_cross_engine_allocated_load.ts` now accepts all six opponents and checks
each version's original speed profile. AUDIOPP4 and AUDIOPP5 pass MS91→MS90→MS91
and genuine legacy SKIDS reload. AUDIOPP2, AUDIOPP3 and AUDIOPP6 fail the complete
opponent-car equality check at the final 2556-frame sample during the MS90 load
after MS91. Earlier sampled states and the speed-byte assertions pass. This is
not evidence of stored-file corruption, and no production data was touched.
Investigate retained allocation/cache state and replay reset semantics; do not
waive opponent-state equality or publish on the narrower opponent1 pass.

Latest exact-resource opponent comparisons also pass OPPSLOW (958 inputs,
10 Hz, finish 948), OPPFAST (1471 inputs, 20 Hz, finish 1451) and OPPCOUNT
(3806 inputs, 20 Hz, finish 3786): zero compared player/opponent state or
route-vector differences against the independent recorded-rate C dumps.
This adds 6235 frame pairs across Indy and Countach plus the slow reference.
These are independent reconstruction comparisons, not complete original-DOS
execution proof. Diagnostic route descriptions now use the same versioned
tables as the simulated session, instead of displaying legacy route points.

The complete `test:ms91-options` suite passed after the recovery change,
including marks, cancellation, original ten-choice resources, compact spacing,
raster/hit-test consistency and alternate CGA/Tandy/EGA display geometry.
`test:ms91-slow-reference` also passed against the actual original
`ms91/DEFAULT.RPL`: 958 inputs retained, 948 finish ticks at 10 Hz, playback
eligibility flag 4, and original replay bytes unchanged. This refresh uses the
current exact opponent resource and cache-routing implementation. It does not
enable browser 10 Hz racing or close full original-executable verification.

Additional checks: `npm run test:compatibility` and `npm run test:cadence-safety`
passed with no skipped tests. Browser DOM responds, but screenshot capture
returned blank images; therefore this does not close visual QA. Setup was
cancelled with saved settings unchanged, and gameplay was not started.

Expanded MS91 Options failure recovery now resumes successfully paused audio,
restores the retained screen and closes its capture if a dialog throws. The
injected-failure checks in `tools/test_ms91_options_runtime.ts` pass, as do the
normal MS91 lifecycle and unchanged legacy dispatcher checks. The complete
expanded menu is still not wired into the browser; this is a prerequisite fix,
not evidence that the integration is complete.

After the exact MS91 opponent resource/cache separation and allocated replay
snapshot changes, `npm test` completed successfully. This covers the existing
audio, replay controls/presentation, enhanced car models, background framing,
camera motion, shadows, crash presentation, wall contacts, goalposts and setup
regressions; it is not a substitute for full MS91 browser or original-DOS QA.

`npm run test:cross-engine-load -- /private/tmp/ms91-slow-oracle.t1zGH5/OPPAUDI.RPL /private/tmp/stunts-replay-compat.yCuHpw/MARSKIDS.RPL`
also passed in the current worktree. This exercises allocated in-race engine
switching and genuine legacy playback after MS91, checks complete active-car
state and opponent profiles, and asserts source replay bytes remain unchanged.
The live default has not been changed and no production scores were written.

### Default renderer identity and enhanced geometry regression

The manual and demo default-renderer constructors now pass the actual session
engine explicitly. `test_native_original_renderer_identity.ts` verifies all
three engine identities, missing-metadata legacy fallback, unknown-engine
rejection, and preservation of construction source memory.

`test_ms91_default_renderer.ts` drives complete MS91 references with audio off,
samples the default MCGA renderer, and compares explicit-engine rendering with
the existing rendering path using identical MS91-loaded resources. It also
executes fractional-polygon rendering and requires emitted enhanced geometry.
Audi 25-MAR passed 28 samples/2556 ticks (1232 enhanced calls); Indy 01-ARG passed
17 samples/1471 ticks (737 calls); Countach 20-STB passed 41 samples/3806 ticks
(2139 calls). All reached finish and preserved source replay and live simulation
bytes during rendering. Type checking passed afterward.

These checks establish metadata-only pixel regression safety and usable geometry
output, not original DOS pixel parity, final enhanced-browser appearance, or
integration of MS91 slow-video management into the default MCGA path. Those
remain release gates. No live deployment or stored score/replay mutation occurred.

The default MCGA world renderer now has an explicit diagnostic MS91 descriptor
tracking path: submissions are cloned with flag08 and model projection honors
the descriptor tracking bit. The renderer rejects enabling this path on legacy
or BB engines. It remains opt-in and is not enabled by the browser runtime.
The Audi and Countach sampled complete-race checks passed with identical pixels
against full redraw, nonempty model submissions, flag08 on every diagnostic
submission, and unchanged simulation/replay bytes. The focused model tracking
test and type check also passed. This covers the active tracking branch only;
disabled-visibility/local-empty descriptor routing and partial MCGA background
and presentation integration remain incomplete.

After the diagnostic MCGA descriptor changes, the complete existing `npm test`
suite passed again. This is current regression evidence for its listed audio,
replay presentation, enhanced models/cameras/shadows/crashes, collision and setup
checks, not a replacement for full MS91 browser/DOS validation. The original
MS91 executable model-region comparison was also rerun: both descriptor branches
matched 200 cases, including disabled management and visible-car local bounds.
That proves the isolated policy helper, not its still-incomplete renderer wiring.
The new reproducible commands are `npm run test:renderer-identity` and
`npm run test:ms91-default-renderer -- <complete-MS91-replay-path>`.

Default-renderer reference tests can also select detached camera inputs using
`MS91_RENDER_CAMERA=0..3`, without altering recording controls or simulation.
Audi 25-MAR passed all three external camera selections over 28 samples through
2556 ticks and finish, comparing active MS91 descriptor tracking against the
full-redraw pixels and requiring enhanced geometry (2015, 2414 and 2211 calls
respectively). This extends camera coverage but does not establish the disabled
car-region branch or actual browser camera interaction.

### Local browser startup smoke check

The existing IAB QA tab at localhost:5191 with `preview-engine=ms-1991`
was checked through the UI. Opening the original Setup showed MCGA and No sound;
Escape cancelled with saved settings unchanged. Roland power was off. Starting
Play and skipping the title reached Original main menu, then Let's Drive reached
the driving introduction with Upgraded driving graphics selected. Captured
browser warning/error logs were empty at those transitions. A cropped screenshot
showed the driving introduction/dashboard, but did not cover the entire scene.
Restart returned the QA tab to Ready to play Stunts, leaving no QA race running.

This is only muted startup/transition evidence. No race was completed or
submitted, no menu Options compatibility was established, no mobile check was
performed, and source-engine/DOS trajectory parity remains a separate gate.

The default-renderer sampled reference check now compares the entire enhanced
draw-call stream (including fractional polygon points), wheels, camera pose and
fireball mask between normal and active diagnostic descriptor tracking. Audi
passed all four camera selections through finish. It additionally invokes the
actual `drawNativeFullRedrawRaceLayers` cockpit/status wrapper on independent
detached inputs and compares pixels and presentation-state writes. Audi cockpit
and camera1, and Countach cockpit, passed this expanded layer check; type checking
passed. Finishing references are not positive coverage of a crash animation,
and these remain sampled rendering comparisons rather than original-DOS proof.

### Fast-video status1 car regions and ten-minute boundary

Original MS91 DD88 and E034 compare car status1 before using local empty bounds;
CE06/CFAE use the same status variables for car visibility gates. The mapped
player/opponent submission bridge now supports this disabled-management branch
with explicitly owned local scratch, while undefined policy preserves legacy.
The diagnostic MCGA path supplies BP-6A/BP-8E. Normal recordings did not exercise
status1, so the renderer check offers an explicit detached render-only status
scenario rather than claiming positive coverage from their successful finishes.

That scenario initially failed at tick100: fireballs read retained car bounds
instead of the new local bounds. Original E41C..E42D confirms local selection
when management is disabled. The fireball renderer now accepts mapped region
pointers, and the MCGA diagnostic path passes its local regions. Audi camera1
with render-only status1 passed28 samples with27 local submissions, identical
pixels, enhanced calls/wheels/crash masks and layer state. Normal fast-video
camera2 passed with no local submissions. Four-display focused pointer/clip
checks and type checking passed. Alternative display disabled-management
integration and full original pixel verification remain open.

`npm run test:replay-buffer-boundary` passed both MS90 and MS91 fresh stationary
races through12005 ticks at20Hz. Each prompted once at tick12000; Continue Now
restored the input/audio lifecycle, retained11405 recorded frames with600 frames
shifted out, and did not crash. This does not reproduce a browser or original-DOS
freeze. A legacy completed long-race verification test also passed. An attempt
to use its legacy driving fixture under MS91 did not finish and is NOT positive
MS91 long-race completion evidence; the subsequent fresh stationary boundary
test avoids that cross-engine fixture mismatch. No source file or public record
was written by these checks.

The alternative-display diagnostic path now also distinguishes fast/slow video
management, with local status1 car bounds and matching fireball pointers in
CGA/Tandy/EGA. Fast management rejects selective retained-region copying. The
54-sample Audi camera1 detached-status1 check passed CGA and Tandy but initially
failed EGA: the scaled-sprite driver supported only A000 video memory. A software
plane destination was added using identical scale, transparency and dither
iteration. Using the ordinary software point writer first dropped eight pixels
because its coarse byte clipping excluded sprite edge pixels; direct plane writes
now retain the exact pixel clipping already performed by scaled-sprite layout.
All three displays subsequently matched direct pixels across54 samples through
2556 ticks and finish; each had positive local car-region submission coverage.
Type checking passed. This remains a diagnostic window comparison, not original
MS91 executable sprite pixel proof or browser feature enablement.

`test_ega_scaled_sprite_software.ts` passed128 focused cases comparing complete
software-plane contents with the existing hardware-aperture route: eight scales,
four horizontal alignments, two vertical positions and two clip rectangles.
The test includes transparent pixels, alternating dither tables, partial-byte
edges, untouched background bits and unchanged sprite bytes. It is a destination
adapter regression check sharing the scaling implementation, not an independent
original executable scaling oracle. The identity, car-region, fireball-region
and software-sprite checks now run automatically as `npm test` prerequisites.

The full `npm test` command passed with these new prerequisites enabled. The
54-sample Audi camera1 detached-status1 comparison additionally passed with
slow-video selective copying in CGA, Tandy and EGA. Both management branches
therefore have positive crash-effect rendering comparison coverage; the scenario
still injects status only into detached drawing inputs, not a naturally occurring
original-DOS crash or a browser race.

An independent original-executable preparation check was subsequently added:
`test_original_ms91_scaled_sprite_layout.ts <MS91-EGA-image> <emulator-libraries>`.
It executes original29F70 through2A0DF (or the early far return), stopping before
video drawing. All128 cases matched sprite anchoring, signed clipping decisions,
destination size/position, source cursor, sample step/fractions and dither phase.
This strengthens the software adapter's shared preparation basis. It does not
prove the subsequent original hardware operation stream or software-plane
adaptation independently; those evidence boundaries remain explicit.

Fresh engine/grip captures were regenerated from the original BB11 and MS91
executable images in `/private/tmp/ms91-physics-check.BPqCOB`, using all eleven
original SIMD resources and initialized quadratic drag tables. The current
reconstruction matched1000 engine states at20Hz,1000 grip states at20Hz and1000
engine states at10Hz. The original BB11/MS91 outputs also matched each other
for those inputs. These are complete isolated routine executions on bounded
synthetic states, not whole-race trajectory/contact/seek proof. No stored race,
replay, score or public default was changed. The release checklist's repaint
summary was reconciled with the newer diagnostic integration rather than leaving
already-implemented branches listed as wholly absent.

Original MS91 polygon-region write block17B94..17C29 now has independent bounded
execution coverage across all256 descriptor flags. The reconstruction's shared
tracking predicate and polygon dirty-bounds updates matched exact original
rectangle bytes, including signed extreme coordinates and no region writes when
08 is absent. Checked original writes were confined to the region and local
stack scratch. The first harness attempt used an invalid zero code segment for
the above64KiB routine; it was corrected to CS1000/IP7B94, and all cases then
passed. The existing visible-primitive descriptor tracking regression and type
check passed after extracting the predicate without changing legacy behavior.
This verifies the polygon bounds-update branch, not line/circle/wheel writes,
complete model transformation or whole-frame original raster parity.

The remaining original bounds-update branches now have bounded executions too:
line17D86..17DAB, circle180B0..17DAB, wheel17F12..17FC4 and point18146..1815C.
All1024 cases matched across every descriptor flag. Inputs include signed
extremes with08 both present and absent, and checks restrict persistent writes
to the selected region and stack scratch. The circle comparison retains the
original second-point X overwrite/Y-radius behavior rather than correcting it.
Wheel tests supply the previously computed radius, so they prove bounds-update
arithmetic/flag gating, not the wheel radius calculation or projection itself.
The polygon256-case corpus was also rerun with signed extremes in tracked cases
and passed. Type checking passed. Full model transformation, branch sequencing
and original whole-frame raster comparisons remain separate gates.

The default MCGA background adapter now accepts an optional retained-sky policy
with forward-region selection and rolled clear/panorama planning, matching the
already-verified alternative-display adapter boundary. Focused pixel checks
passed empty-list no-draw retention, forward drawing restricted to selected
rectangles, exact rolled sky/ground clears and null-panorama suppression, plus
forward/fallback retained-sky bounds. The ordinary omitted-policy renderer
retains its prior full-redraw behavior and its sampled Audi regression passed.
The world renderer forwards the optional policy and exposes full-background
fallback information. A race-owned retained-bank state and actual default
presentation wiring are still required; this adapter is not publicly enabled.

The default MCGA renderer now owns detached retained-bank state and forwards
the forward/rolled plans into that adapter behind `experimentalMs91PartialBackground`.
This requires an explicit MS91 identity, descriptor tracking and slow management;
unsupported presentation-camera overrides fail closed. State commits only after
the complete render/layer callback succeeds. A failure requests a full redraw
next time rather than retaining partially presented banks.

With `MS91_PARTIAL_BACKGROUND=1`, sampled pixel/geometry/wheel/mask/cockpit-state
comparisons passed Audi2556 (28 samples), Porsche2264 (25), Indy1471 (17) and
Countach3806 (41), all through finish. Audi external camera1 also passed. The
test clears detached startup redraw requests after its first sample, requires
the actual forward callback to run, and preserves recording/live-state bytes.
An injected post-world presentation failure at tick100 recovered with matching
pixels on the subsequent render. Type checking passed before the test-only
failure-injection addition. This is background integration, not final dirty
presentation or public Options enablement, and remains diagnostic-only.

Actual allocated MCGA race-window descriptors are now resolved using the same
explicit boundary as the alternative modes. Fresh MS90 and MS91 resources both
provide320x200 bitmaps with scanlines starting after a16-byte bitmap header.
This exposed a default-world adapter assumption: it wrote background pixels
from the segment base, although primitive drawing obeyed the descriptor's row
table. Background destination now includes the first row-table offset. A real
allocated-window test checks preserved bitmap headers, direct/retained pixel
equality and unchanged race/input memory for both engines. It passed along with
alternative-mode resolver checks and type checking. Final selective MCGA
presentation and cockpit/front-buffer ordering are still not wired.

The default MCGA renderer now has an opt-in retained-window presentation adapter.
It seeds the allocated bitmap on entry/full redraw, renders world/status/crash
layers into that window, and calls the verified repaint planner/native raw-bitmap
copy at the original `present` point. Direct-screen cockpit updates remain after
that copy. A missing complete layer adapter fails closed; this cannot silently
become a world-only copy. The same detached bank state drives partial background
and presentation, without committing it a second time after the layer pass.

`MS91_SELECTIVE_COPY=1 MS91_PARTIAL_BACKGROUND=1` sampled comparisons passed
Audi2556, Porsche2264, Indy1471 and Countach3806 through their finishes, covering
default pixels, enhanced geometry/wheels/masks and identical presentation-state
writes. Tests require actual bitmap copies and non-startup selective-copy frames.
Audi camera1 with detached render-only status1 also passed. Type checking passed.
The normal browser runtime does not select this policy yet; forwarding and
versioned menu/settings integration, wider replay/camera/transition QA and
original whole-frame verification remain release gates.

Manual-race runtime callbacks now forward the optional MCGA copy adapter in both
ordinary cockpit rendering and deferred enhanced capture. The explicit local
`experimentalMs91SlowVideoManagement` data setting routes via the loaded
session's identity: missing settings retain current behavior, legacy/BB sessions
ignore the MS91 policy, and only MS91 opts into its fast/slow producers. Slow
management selects retained background/copy; fast selects strict descriptor
tracking with the local status1 bounds. Public browser settings still supply no
such experimental value.

`test:ms91-renderer-runtime` includes policy, real runtime, allocated-window and
background bridge checks. The actual runtime matched pixels, enhanced calls,
wheels/overlay masks and complete simulation memory for8 startup frames in each
of four engine/management combinations. These stationary startup cases are not
full races or loaded replay switching. The four full MS91 lifecycle references
also passed after the forwarding change; no public row/file was modified.

The runtime's existing world-only entry now forwards a minimal retained-window
world/present sequence too, rather than throwing when the experimental copy
policy is selected. A direct comparison passed for all four engine/management
combinations before their cockpit/enhanced startup checks. The existing full
`npm test` suite passed after the main callback forwarding; the subsequent
world-only adjustment passed the focused runtime suite and type checking.
No public UI settings, default engine or persistent replay/score bytes changed.

`test:ms91-renderer-corpus -- <competition-root>` now requires all four reference
files before any test starts. It exercises the actual manual runtime with both
fast and slow video-management policies, not just the detached renderer factory.
All eight cases passed: Audi28, Porsche25, Indy17 and Countach41 sampled frames
per policy through each complete control stream and finish. Pixels, enhanced
calls/wheels/masks and full simulation memory matched the default runtime;
reference files and the shared startup resource base stayed unchanged.

The runtime group also includes a real loaded legacy replay under future MS91
slow-video settings. At seeks0/1/100/300 it retained the legacy engine and matched
control pixels, enhanced geometry/mask and complete state, preserving original
replay bytes. Type checking passed. This does not replace full browser/mobile
menu transitions or original complete-game trajectory comparison.

The browser menu adapter now accepts an explicitly supplied experimental MS91
settings object, forwards its engine/settings to Native Options, and selects the
complete versioned dialog overlay only for that explicit object. Fresh browser
races route its configured cadence/video management through `futureRaceSettings`;
saved recordings still enter their separate recorded-engine/rate path. Ordinary
OpeningSequence launch supplies no experimental object, so the expanded menu
is not yet enabled in the user-facing preview or production.

Pure routing checks preserve source/settings objects, reject invalid values and
leave omitted/legacy settings behavior unchanged. An initially inferred union
type hid optional metadata fields in the test; explicit replaceable metadata
typing fixed that without narrowing10Hz to a20Hz input literal. Type checking,
the MS91 Options group and cadence-safety group passed. Public proof generation
and verification remain20Hz-only; their guards were not removed. Complete slow
replay reload, browser clock/settings persistence and public-policy verification
still remain before UI enablement. No stored bytes, score rows or defaults changed.

# Original MS91 opponent preparation: isolated harness now returns

The new `check_ms91_original_opponent_preparation.ts` compares original loader output against web weighted-route selection, including all 256 adjacent-memory cost bytes and the 16-byte modern speed profile. OPP1 passes with 67 path words, and executable/replay/GAME/opponent source files are byte-identical afterward. Full two-car trajectory verification remains separate and unfinished.

The original `OPP1.PRE` loader completed normally for the isolated AUDI opponent replay. The prior errors were harness omissions: its resource lookup retained the executable's original embedded data-segment address while the language-prefixed name was on the relocated stack, and host-loaded resources needed a matching host release boundary. The checker validates the exact original instruction before relocating that segment operand in emulator memory, and validates the released pointer against the isolated resource allocation. Source executable, resources, replay files, stored scores and live site were not modified. Refreshing Unicorn's translated-block cache also made the newly added diagnostic hook observe previously translated lookup code.

This proves normal original-loader return for this case only. Original opponent path/profile values and full two-car trajectories still require comparison; this is not a completed opponent compatibility gate.

