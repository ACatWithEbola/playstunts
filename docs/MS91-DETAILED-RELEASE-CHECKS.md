# MS91 detailed release checks

Item73 acceptance: representative English/Spanish/Italian home and navigation,
recent actions,setup/controls,statuses,FAQ disclosures and leaderboards inspected.
Fixed graphics/menu/ranking accessibility translation gaps;505-message inventory
and typecheck pass. Spanish legacy and Italian modern expanded score tables
show translated details/actions with names/times/version badges unchanged.
Both translated FAQ compatibility disclosures render correct edition dates.
390px document containment verified; score table uses bounded auto scrolling.
Language-switch saved-byte invariance separately proven at72.61/103 verified;
later physical mobile and final broad site regressions remain separate.

Item72 acceptance: representative translated navigation/game-adjacent statuses
verified in English, Spanish and Italian. Fixed six graphics-status fallbacks
and four internal menu-name substitutions;505-message inventory plus exact
menu-status assertions/typecheck pass. Actual Italian car/opponent/track/main
and Spanish results/navigation remain translated without translating native
assets. Language switching leaves native result screen active. Backups(12)/(13)
prove all19 saved file objects/bytes/metadata identical after Italian→Spanish→
English. Broader website/high-score/FAQ layout remains gate73.60/103 verified.

Item59 acceptance: original/updated graphics switch both ways during native
menus, fresh races and paused/playing replays for both engine versions.
Legacy replay retains frame184; modern paused replay retains frame0/frame227;
playing modern replay advances through switching without restart. Fresh modern
race advances frame55→88 and legacy frame45→77 with position/speed continuity
and unchanged physics identity; menus still start fresh races after switches.
Backup(10) exactly equals backup(9) across all18 file objects. Captured browser
warnings/errors empty.59/103 verified,44 left,57.3%; graphics/menus12/17,5 left.

Item58 acceptance: native Options and in-replay Load Replay support cancellation
and version routing. QAPC20A opens as ms-1991/20Hz from a December boot; CTKFIN
then switches back to ms-1990/20Hz. Native Play advances, Stop pauses, and Replay
Menu opens the correct filename dialog. Save cancellation leaves backup(8)
identical to backup(7). New modern QACOPY20 and legacy QACPY90 copies preserve
their source replay bytes and engine identity. Backup(9) adds only QACPY90;
all17 prior file objects remain exact. Existing legacy cadence metadata remains
absent, with the original20Hz interpretation preserved. Desktop replay/save
menus complete; later mobile, audio and final broad regressions remain open.
58/103 verified,45 left,56.3%; graphics/menus11/17,6 left.

Item57 acceptance: modern desktop menus render all11 car models/specifications
and allsix opponent profiles. Next/Last, Auto/Manual, Colour, Done, Clock and
independent opponent-car selection work; track selection reaches actual race.
Fresh December1990 cross-check verifies Countach/GTO Next/Last, transmission,
colour, Bernie profile/opponent-car independence, DEFAULT chooser cancellation,
and QA_LOOP load/preview. Backup(6) exactly equals all16 file objects in backup(5),
including replay/score bytes and metadata. This completes desktop car/opponent/
track menus; final broad regressions remain separate.57/103 verified,46 left,
55.3%; graphics/menus10/17,7 left.

Item56 acceptance: fresh February1991/20Hz keyboard-driven QA_LOOP/Countach
race finishes at8269 ticks/6:53.45, native result and website consent offer
agree. Public submission declined; native name prompt cancelled. Saved a new
privateQAPC20A and exported backup(5). Independent saved-input checker reproduces
exact finish, score-verifier acceptance, byte roundtrip, legacy-caller engine
routing and checkpoint rewind. Prior replay files unchanged; prior private
table records retained, native new test result added. This closes desktop
fresh race/finish/results, not sound victory or broader menu regressions.
Overall56/103 verified,47 remaining,54.4%; graphics/menus9/17,8 remaining.

Item51 acceptance: fresh keyboard-driven MS91/10Hz QA_LOOP race finishes at
2497 ticks/4:09.70 in the native results screen. Saved privately asQAT10B;
exported backup preserves engine/cadence. Independent saved-input simulation
reproduces the exact finish, export roundtrip and endpoint state after rewind,
including routing under a legacy caller and public20Hz-only rejection. Native
Load Replay selectsQAT10B and opens at0:00.00 with4:10.70 duration; DOM reports
ms-1991/10Hz. Normal replay playback advances to0:04.20 and pause works.
Overall55/103 verified,48 remaining,53.4%; engine/physics26/26 complete.
Other desktop/audio/release gates remain open; nothing deployed.

Item55 desktop fresh boot/version/options acceptance: fresh February launch
from home reaches original main menu; keyboard Right/Right/Enter opens Options
with Feb25 1991, Escape returns to main. Prior fresh December launch shows
Dec13 1990 and explicit choice overrides the local preview engine in each
direction. Modern graphics/options cadence menu and next-race notice were
also browser exercised; no release-default change. Latest desktop test stopped
with Restart, viewport restored. This closes boot/version/options only, not
items51/56-59 audio, race finish, other menus or graphics-switch regressions.
Overall54/103 verified,49 remaining,52.4%; graphics category8/17,9 remaining.

Item79 documented in MS91-ROLLBACK.md and checked against the implemented
future-race selector, snapshot/restore helpers and existing hosting manifest.
Rollback retains both replay engines, changes only future races, preserves
storage bindings and forbids historical replay/score rewriting or blanket DB
restore. Source, external assets, browser saves and production DB backups are
explicitly separate. Fresh rollback-selector tests pass; they do not close
item80 live/historical-data verification. Overall53/103,50 remaining,51.5%.

Item45 refreshed offline Tandy verification: versioned control/memory/resource/
note/voice/lifecycle suite, all-car startup/dialog suite and versioned music/PCM
suite pass.396 instruments/92 music patches,8800 allocated callbacks,80 pause/
resume cycles and2947200 finite PCM samples checked across both generations,
four scores and44.1/48kHz. Whole versus partitioned buffers match exactly;
source seeds/replays unchanged. Browser inventory currently has zero in-app
tabs, so actual browser/setup/output QA is not marked passed. Reuse the user's
existing tab when reopened; do not create replacements or alter mute settings.
Item45 remains open; overall52/103,51 remaining,50.5%.

Item46 acceptance review completed for non-audio geometry/resource differences.
Evidence:14 packed banks/197 parsed models identical to both originals and web
assets; full projection11-group/374-operand comparison with16 reconciled
dependencies; original descriptor08 routing proofs; exhaustive versioned vertex
halving and primitive sort; all-eight-driver circle arithmetic,32 original circle,
64 line,64 solid polygon,128 patterned polygon and64 wheel pixel cases; all40
complete overview framebuffers in each edition;264 all-car menu orientations,
intro checks and222 integrated race-render samples. Final native halving/sort/
region/circle tests and typecheck rerun pass. Legacy defaults and all source
inputs remain unchanged. Modern code changes are explicitly routed, not applied
to historical replays. Item46 does not certify the separately pending desktop/
mobile, audio, final source/data backups, final regressions or deployment gates.
Overall52/103 completed,51 remaining,50.5%; graphics category7/17,10 remaining.

Item46 full modern overview pixel comparison now passes all40 bundled tracks
with actual landscape selection and freshly restored independently initialized
original memory for each track. Complete65536-byte hashes match nativeMS1991
output; every original track executes models and exactly900 queue drains.
Together with the legacy40-track oracle this closes complete overview coverage
for both editions. Fresh14-bank/197-model packed/parsed/browser geometry audit
also passes, archives unchanged; typecheck passes. Remaining action is the
item46 acceptance review across its accumulated geometry/resource evidence,
not another unverified overview test. Overall51/103 unchanged until that review.

Item46 first complete modern overview pixel comparison passes CLEANER:
all65536 framebuffer bytes match independent original1991 execution,218 actual
model calls and900 queue drains. Uses explicit shared camera inputs andpanorama0
fixture; original model/view/queue/drawing execution is not intercepted.
Track pointer95EE/9D68 and projection-offset4C62 were traced from actualMCGA
instructions after guessed addresses produced a background-only probe; accepted
test requires nonzero model calls and all900 drains. Source inputs unchanged.
Expand to all bundled tracks and actual landscape selections before accepting
full overview scope. Whole item46 still open.

Item46 modern overview setup now includes original queue allocation1718C and
panorama initializerFBC6. Caller supplies only a valid10400-byte queue and a
resource bank containing exact four panorama bitmaps; original code resolves
all four pointers and heights, verified byte-for-byte against source images.
Original resource lookup/list construction is not intercepted. Combined setup
passes116 model descriptors,240 coordinate words,36 matrix entries,five
material bindings andfive sentinel-tested queue resets. All input files
unchanged. Complete modern overview execution/pixel parity is next and remains
unverified; whole item46 stays open.

Item46 modern material/queue setup verified: traced actual caller2C66A..2C67A
to material table53BE (not an assumed generic displacement). Original171EA
binds all five colour/base/pattern/mask/extra fields correctly. Original1720E
resets actualMCGA queue fields8B96/6104/5782/5AAA/8CA2 from nonzeroAAAA
sentinels to0/0/0/FFFF/400. Earlier guessed alignment offsets were corrected
from disassembly before accepting the final sentinel-write test. Combined
fixture still verifies116 descriptors,240 coordinate words and36 matrix
entries. Panorama/queue allocation and complete modern pixels remain open.

Item46 modernMCGA overview setup advanced: original coordinate loop281B..2895
creates all eight30-word tables (240 words), checked against exact row-order,
boundary/center-coordinate values. Original renderer init171A5 executes all
four quarter-turn matrix helpers; all36 matrix entries match explicit expected
orientations. These use actual modernMCGA offsets, which differ from EGA beyond
a uniform shift. Combined fixture retains116 verified scene descriptors and
unchanged archives. Material/queue/panorama initialization and full pixels
remain open; no acceptance count changed.

Item46 original1991 scene setup now independently executes complete initializer
122BC..12385 with only available-memory/file-load boundaries supplied. Original
resource lookup and descriptor construction resolve all116 scene models from
unchanged GAME1/GAME2 banks; every descriptor header and source bytes verified.
ModernMCGA descriptor base76AC and resource-name base0A56 traced from code,
not assumed from EGA or legacy offsets. Fixture validation initially chose
GAME2 for duplicatezban; corrected to original GAME1-first search order, after
which all116 pass. This establishes modern model setup, not overview pixels.
Coordinate/material/queue/panorama setup and full overview execution remain.

Item46 full legacy overview pixel coverage expanded to all40 bundled tracks:
every complete65536-byte native framebuffer matches independent original
execution, including panoramas, terrain/road placement, projection and drawing.
No renderer outputs substituted into the original oracle; only resource I/O
is intercepted. Original snapshot and native input baselines unchanged.
Modern full overview needs its original resource/data memory initialization:
existing modern race capture files contain1120-byte state frames, not full
executable/resource snapshots, so they cannot be used as overview seeds.
This narrows the next required setup rather than treating those captures as
pixel evidence. Whole item46 remains open.

Item46 complete legacy overview pixel oracle now passes two bundled tracks,
CLEANER andCTK2003a: all65536 framebuffer bytes hash-match independent original
overview execution including panorama, model projection, per-tile queue drain
and actual drawing. Resource-file boundary only is intercepted to supply exact
panorama bytes; no drawing/math calls replaced. Explicit three ground-model
inputs installed in both paths. Source snapshot and native baseline unchanged.
Modern full-overview execution remains before this subcheck can close for both
editions; whole item46 remains open.

Item46 full-overview oracle preparation: existing contact-frame0.bin is a
1048576-byte original runtime snapshot. Fresh comparison against reconstructed
archivedMS1990 MCGA confirms exact original overviewE7DC..ED58 and complete
model projection16AA0..17A23 code bytes. The browser native-render-resources
snapshot deliberately contains zero executable bytes in those regions, so it
cannot be executed as an independent original oracle. Use the verified original
snapshot for execution, install equivalent panorama/ground models and raw track
inputs explicitly, and compare native output separately. No files were mutated
by this read-only fixture check; full overview pixels not yet accepted.

Item46 independent originalMCGA wheel pixels pass64 cases across both editions
using original28AB2/290AA entries, four projected points,2500 inner scale and
three distinct materials3/7/11. Deterministic skewed/offscreen wheel fixtures
match complete64000-byte native frame hashes. Archived files unchanged.
This closes bounded wheel-raster comparison, not alternative-display hardware
or all geometry. Complete overview/model-output comparison remains open.

Item46 independent originalMCGA patterned polygons pass128 additional pixel
cases across both editions:64 transparent-mask cases at3CDC/3E62 and64
two-colour cases at09B4/09B6, using alternatingAA55 mask. Same clipped,
concave and degenerate geometry as solid corpus; complete64000-byte hashes
match native output. Explicit argument ordering/base/secondary colours checked.
Archived inputs unchanged. Wheels and full overview remain open; item46 not
closed solely from these bounded primitive comparisons.

Item46 independent originalMCGA solid-polygon pixels pass64 cases across both
editions using actual clipped entry2D4A/2D8E. Full-screen rectangle, repeated
points, zero-width edge, concave polygon and28 deterministic clipped convex
shapes per edition all match full64000-byte native frame hashes. Existing line
checker extended with explicit polygon mode rather than duplicating emulator
setup. Archived inputs unchanged. Patterned polygons/wheels and full overview
remain separate; whole item46 stays open.

Item46 independent originalMCGA line pixels now pass64 cases across both
editions: reversed diagonal, degenerate point, horizontal/vertical edge clipping
and27 deterministic random lines per edition. Native full64000-byte frame
hashes match direct original13B8/13BA execution. Archived inputs unchanged.
This closes boundedMCGA line output, not all EGA/packed hardware paths or
polygon/wheel/overview drawing. Whole item46 remains open.

Item46 independent originalMCGA circle pixels now pass32 cases across both
editions: diameters0/1/2/3/8/16/32/64/80/128, small-span and large-ellipse
paths, clipped/offscreen/edge positions. Entire64000-byte native frame hashes
match actual original execution. Both radius banks0x450 bytes identical after
explicit40-pointer +AE relocation; archived files and native input memory
unchanged. This verifies boundedMCGA circle output, not all display primitives
or full overview pixels. Remaining drawing scopes still keep item46 open.

Item46 circle-change regressions refreshed: four actual1991 competition
replays through all finishes under both video policies,222 rendering samples,
pixels/enhanced commands/wheels/masks/live state match between policies.
This is policy regression evidence, not original executable pixel parity.
Renderer identity test passes explicit legacy/modern/BB and missing-identity
legacy fallback, unknown-engine rejection and source preservation. New eight-
driver arithmetic audit reconstructs all old/newMCGA/CGA/TDY/EGA in memory,
checks each edition's exact circle arithmetic bytes, pins assembled hashes,
and verifies every archived input unchanged. Full drawing comparison remains.

Item46 circle routes extended to car-menu raster/captured commands, intro
commands, track-overview raster and native-display circle/register-effect
dispatch. Native-display world/car/intro/overview owners carry engine identity
with scratch context to the shared drawing hosts. Legacy intro/car command
defaults remain unchanged (modern-only command tag).264 car orientation cases
and intro checks pass; overview regression passes; typecheck passes. Broad
render/race regression and original full circle drawing comparison still
required. Whole item46 remains open, no live/stored-data changes.

Item46 circle integration begun: runtime world drawing commands now carry
optional engine identity; native raster circle and register-effect paths,
enhanced canvas and orderedWebGL circle plans consume that identity. Untagged
calls retain legacy defaults. Exhaustive height tests and direct framebuffer
dispatch fixture pass: default/explicit1990 pixels identical,1991 pixels
different as expected, memory outside framebuffer unchanged. Typecheck passes.
Menus/overview/intro and native-display routing still need completion, then
full race/render regressions; item46 remains open, no stored/live mutations.

Item46 circle calculation implemented as explicit versioned helper and plan
argument. Exhaustive native test passes196608 default/legacy/modern arithmetic
cases across all65536 diameters, plus a modern ellipse-plan fixture and source
memory preservation. Untagged plan retains legacy output. Rendering owners
still need to forward engine identity through raster/display/enhanced paths;
do not claim integration complete yet. Added focused assembler regression
tests for matching boundary-prefix acceptance and conflicting-prefix rejection;
all four unpacker unit tests pass. Whole item46 remains open.

Item46 driver boundary resolved: final1991 DIF patches straddle CMN/COD by
three/two/one bytes forMCGA/CGA/TDY. Those overflow bytes exactly equal the
archived COD prefixes (D1EA03,697E,65). Original loader10C29..10C6F writes
word/dword patch bytes contiguously without a CMN-length guard. Local assembler
now permits only a straddling write whose overflow agrees with existing COD;
retains CMN length and rejects conflicting prefixes. All four1991 drivers
reconstruct and unpack in memory. Every modern circle routine contains the
extra SHR, including MCGA/CGA/TDY—not onlyEGA. Existing unpacker tests pass.
Circle rendering must therefore route the modern formula for every display
mode while retaining the legacy default. Archived files remain unchanged.

Item46 cross-driver investigation: all four original1990 assembled drivers
have the old circle arithmetic. ModernEGA independently reassembles and has
the extra shift. ModernMCGA/CGA/TDY currently hit the local reconstruction
assembler's boundary guard at the final four-byte DIF patch: common length
142336, targets142335/142334/142333 respectively, final patch before terminator.
This is a tooling/layout issue, not evidence the original games are broken.
Must verify original loader boundary semantics before changing assemble or
assuming the1991 circle rule applies to all modes. No source game files changed.

Item46 circle comparison found a real EGA-driver change: old4D00 body410
bytes/168 instructions versus modern4E86 body412/169. Modern inserts an
extra SHR AX,1 at4E9A in diameter-to-height arithmetic: oldD-(D>>2)+
((D>>2)>>1), modernD-(D>>2)+((D>>2)>>2). Native originalCirclePlan currently
uses the old formula for every display mode. Do not apply this globally
without checking other modern drivers and explicit display-engine routing.
Independent original arithmetic checker added; integration fix remains open.

Item46 point drawing leaf compared in full:187 bytes/81 instructions,
all branches internal and corresponding, eight explicit clip/mask field
relocations,32-byte pixel-mask data bank identical. No nested calls or
interrupts. Six other queue drawing dependencies remain explicit. Hardware
pixel execution is still separate; item46 remains open.

Item46 primitive queue dispatcher compared in full:516 bytes/188 instructions
per edition,27 direct branches map to matching instruction positions, eight
explicit material/queue-field relocations. Queue-reset call maps to its prior
complete leaf proof. Seven drawing call targets are explicitly mapped but
remain separately unaccepted until their actual code/pixel scopes are checked;
matching dispatch structure does not prove hardware pixels. Both original
inputs unchanged; whole item46 remains open.

Item46 overview drawing dependencies narrowed: complete53-byte clip-window
setter (20 instructions) and352-byte retained-window fill (148 instructions)
compare with explicit field and internal-branch relocation; no nested calls
or interrupts. Five model-projection calls now link the complete11-group/
374-operand/16-helper version-specific ledger, not an assertion of identical
1990/1991 output. Remaining direct callee scopes: bitmap dispatcher624D/63D5
(two calls) and primitive queue drain1296/129E. Hardware pixel output is not
inferred from these code comparisons; item46 stays open.

Item46 four-tile terrain path now compared directly to original execution:
both original900-tile loops emit four support records, one road record and
three neighboring terrain records in the same order. Native submission test
matches all eight records per engine exactly: position, descriptor, orientation,
flags and paint;900 queue drains per edition; input memory unchanged. The
legacy region-pointer value is deliberately excluded from this modern semantic
record comparison because its use was removed, not asserted identical.
Actual drawing/pixel comparison remains separate; whole item46 stays open.

Item46 original raised-road fixture passes both original900-tile loops:
support model7C80/7EBE, zero heading, flags5/paint0 followed by road1234,
heading64/flags4, both at255/254/253. Native coordinate regression expanded
to42 camera/engine/terrain cases, ordinary and raised ground; all900 queue
drains and emitted support/overlay/road coordinates checked, source memory
unchanged. Multi-tile record-pointer and full drawing comparisons remain open.

Item46 independent original overview record execution added. Both original
900-tile loops run in isolated synthetic shared data/stack memory; model
render and queue drain intercepted only to capture records, not claim pixels.
Single ordinary road fixture emits exactly one record and900 drains in both
editions: descriptor1234, heading64, flags4, paint0, positions255/-1/253
(1990) versus255/-2/253 (1991). Source binaries unchanged. Initial harness
used separate stack/data segments, which incorrectly zeroed copied positions;
fixed to the original shared-segment layout before accepting the result.
Raised/four-tile terrain and full drawing remain open; whole item46 not closed.

Item46 view-selector comparison complete at code/dependency scope:152 bytes,
67 instructions, all operand changes explicitly mapped. Two rotation calls
reuse complete matrix/axis/table proofs, queue-reset call uses its complete
31-byte leaf comparison, vector transform links its complete body, atan2
links the separately refreshed quadrant/lookup-table proof. No branch or
interrupt scope omitted. Overview now has seven distinct verified helper
calls linked (including atan2 and view selector); drawing and record/pixel
coverage remains separate, so item46 is still open.

Item46 overview now links four independently reconciled model dependencies:
integer hypot, rotation matrix, vector transform and vector projection, plus
the slope helper. View queue reset separately compared in full:31 bytes/six
instructions, five explicit field relocations, no calls or branches; equivalent
initial counter/pointer values. View selector itself located16A08/1722E,
152 bytes/67 instructions per edition; its remaining math/state linkage is
not yet accepted merely from matching instruction counts. Whole item46 open.

Item46 overview slope dependency linked: complete287-byte original helper
FCC:3B8E versus105C:38C2 is byte-identical, all direct branches internal,
no nested calls or interrupts. Fresh native/original1991 oracle comparison
passes all65536 terrain/road byte combinations. This proves the slope mapping
used by both overview editions without inferring the other callees. Original
binaries and all live/stored data remain unchanged; whole item46 still open.

Item46 overview operand ledger now explicitly maps all264 changes:182
stack/data relocations,60 matching branch destinations,21 callee relocations
(dependency proof separate),one8-byte stack-workspace reduction. No pending
operand mappings. Shortened terrain branchEA67/F27B independently matched:
same preceding zero test, nonzero fallthroughEA6C/F27D and zero exitEAEE/F2F1
both correspond. Remaining record-pointer/data-table/callee coverage is not
inferred from those mappings, and original pixel parity remains unproven.

Item46 overview structural groups now inventoried individually:17 groups,
nine arithmetic-halving changes, three alignment-only changes and five
pointer/branch/coordinate-table changes. Four of the latter groups still
explicitly require record/branch/table proof. All18 original halving sites
are byte-checked against the independently executed representative blocks;
no unreviewed same-shape operands are silently accepted (264 remain listed).
The smaller modern stack workspace and unused legacy region-pointer removals
are not evidence of full pixel parity. Whole item46 remains open.

Item46 overview halving independently verified: actual original instruction
blocksE98E..E993 andF1AC..F1AE executed for all65536 signed inputs per edition,
131072 original executions, exact truncated1990/arithmetic1991 results.
Versioned native submission test passes21 camera/engine cases, each900 tile
drains, including ordinary-road overlay positions and signed wrap boundaries.
Source memory and archived binaries unchanged. Whole overview comparison is
still open; this confirms the coordinate correction, not full pixel parity.

Item46 original overview inventory added: legacy physicalE7DC..ED58,
1404 bytes/535 instructions; modernF000..F552,1362/512. Both full bodies
hash-pinned and direct branches closed.17 structural groups and264 operand
changes remain explicitly pending. Nine removed sign-adjustment pairs before
coordinate shifts expose another version difference: overview submission
coordinates use arithmetic halving in1991, truncated halving in1990.
Version routing now reaches this calculation in both raster and native-display
overview paths. The QA overview regression passes with exact legacy defaults
and unchanged source inputs; independent original coordinate execution and
remaining overview differences still need verification. No live change.

Item46 car-selection regression expanded from one angle to eight orientations
for all11 cars under default, explicit legacy and modern engines:264 rendering
cases pass, exact untagged/legacy pixel equality retained, source memory and
model banks unchanged. This is native implementation regression evidence, not
an original-game pixel oracle. The overview test likewise explicitly disclaims
original pixel parity; the remaining comparison needs independent original
output rather than more self-comparisons. Whole item46 remains open.

Item46 model-projection dependency comparison now16/16 reconciled. The full
projection ledger passes with11 structural groups,374 operand changes and44
callee calls linked to complete dependency proofs, with no pending operands.
Far-call addresses are compared numerically, so disassembler formatting of a
small offset (4 versus0x4) cannot produce a false mismatch. Both original source
images remain unchanged. This closes the projection dependency subcheck, not
the complete geometry/resource item: overview pixel and remaining rendering
coverage are still required. Overall51/103,52 remaining,49.5%.

Earlier checkpoint: Item46 supporting bodies11/16 reconciled. Four additional complete leaves
match instruction-for-instruction under explicit injective field mappings:
vector projection209 bytes/97 instructions, clip code76/32, scalar perspective
projection14/7 and linked primitive queue190/74. Every direct branch resolves
to corresponding instruction indices; none has transitive calls. Corrected
automatic scope handling for a final jump back to an earlier return immediately
before the next prologue: projection's earlier469-byte envelope incorrectly
included adjacent allocation/error functions, and is superseded by the proven
209-byte body. No conclusion relied on that larger envelope. Corrected the
misnamed cosine helper to scalar perspective projection after reading its MUL/
DIV body. Five direct dependencies still pending;51/103,52 remaining,49.5%.

Item46 supporting model routine inventory added in
audit_original_model_dependencies.py. Seven of16 direct callees independently
prove complete branch-closed byte-identical leaves with no further calls:
matrix multiply128 bytes, vector transform260, transpose105, signed absolute21,
interpolation85, rectangle bounds76, unsigned division97 (772 total).
Nine remain pending reconciliation. The facing helper's indirect jump is
explicitly rejected by automatic return detection until its table is scoped;
no shortened partial body is accepted. Fifteen others have captured complete
return envelopes with hashes/call inventories, but those differing bodies are
not yet called equivalent. Corrected vector-length label from the initial
misnamed division wrapper; its two hypot calls match existing prior scope.
No software/game-source mutation by these checks;51/103,52 remaining,49.5%.

Item46 complete374-operand ledger reconciled at caller level:184 explicit
injective scratch/table relocations,143 corresponding branch destinations,
two retargets entering the added polygon/wheel descriptor08 guard, one verified
sort-mask semantic change and44 dependency-target relocations. All330 non-call
changes classified; no unresolved branch/numeric operand. Three relocated
startup tables independently byte-match in both distributions (16 primitive
counts,16 dispatch kinds,128 directional-mask bytes), with pinned hashes.
Callsite relocation alone does NOT prove its callee:44 callsites still require
full supporting-body reconciliation. The audit retains wholeItemAccepted=false
and reports that pending evidence explicitly.51/103,52 remaining,49.5%.

Item46 projection structural inventory now classifies all11 groups, pinned to
the full3971/3973-byte body hashes: six descriptor08 guards (region pointer,
polygon,line,wheel,circle,point), two signed-halving replacements and three
alignment NOP insertions/deletions. Added independent256-case original pointer
guard test and compared it with actual renderOriginalModelMemory submission,
including retained-pointer behavior when flag08 is clear. Fresh polygon256
original comparison passes; other primitive1024 and halving512 original proofs
are linked in the ledger. No entire-item acceptance from structural coverage:
374 operand changes and44 transitive callsites per edition still need complete
classification/reconciliation.51/103 verified,52 remaining,49.5%.

Item46 non-race sorting propagation implemented: raster intro accepts owning
engine from OpeningSequence data; native intro resource preparation/display
accepts it from browser-native-intro. Car-menu host explicitly captures selected
future engine; raster model and native display model pass it through to the
queue policy. Native car presentation uses its host engine rather than a stale
resource default. Enhanced track-visibility API now accepts optional engine
and forwards it through projection/raster paths; the separate NativeDrive test
circuit keeps its existing untagged legacy default. Production race enhanced
geometry already uses the owning race renderer. Intro and all11 car-selection
models render in both policies, untagged commands/pixels match explicit legacy
exactly, and source memory/model banks stay unchanged. This is functional
routing regression, not original screenshot parity for every model. Full46
classification/native-display end-to-end QA remain open;51/103,52 left,49.5%.

Item46 same-shape operand inventory exposed another semantic change, not merely
a relocation: legacy179AD TEST [BP-2],2 becomes modern181D5 TEST [BP-2],6.
Primitive flag4 joins flag2 in bypassing depth-sorted queue insertion; model
flag1 still bypasses in both. originalPrimitiveRecordHeader now accepts optional
engine, retains legacy/default mask2 and uses MS91 mask6. submitOriginalPrimitiveMemory
and renderOriginalModelMemory forward owning engine. All65536 model/primitive
flag combinations verify unchanged depth/material/header fields and legacy
default. Both actual original sort branches independently execute1024 cases and
match native results, preserving binaries. Added check_original_primitive_sort.py
and test_versioned_primitive_sort.ts. This affects more than half-size models:
intro/car-menu/high-resolution callers need explicit engine routing despite their
fixed full-size0. Their earlier no-halving conclusion remains valid only for
the rounding difference, not this new sorting difference.46 remains open;
51/103 completed,52 remaining,49.5%.

Item46 remaining caller audit found track overviews request halfSize1 in both
raster and native display, unlike intro/car-menu/high-resolution visibility
which explicitly select full-size0 (prepareOriginalView also selects0).
Both overview helpers now forward optional engine identity. Raster track menu
selects current score/menu engine with host fallback; native presentation passes
current metadata into resource.draw on each rebuild, avoiding stale selection.
Intro/display intro, car-menu/display car and enhanced visibility remain shared
because their fixed full-size0 cannot enter the changed halving branch; the
exhaustive no-halving test proves both policies equal. Actual overview test
renders untagged/legacy/modern copies, proves untagged legacy pixel equality
and baseline/track/model immutability. QA91R001 yields zero pixel differences
between policies; that sample alone is not evidence that halving is equivalent.
The genuine Alan FGTO301 track yields15 changed pixels, confirming that the
overview path exercises the new policy while default/legacy remains identical.
Typecheck passes after fixing optional metadata-return handling.
Full original overview pixel comparison and remaining projection-body operand
classification are still open.51/103,52 remaining,49.5%.

Item46 halving caller propagation, first integration: bounds and primitive
vertex helpers, prepareOriginalModelProjection, both primitive wrappers and
renderOriginalModelMemory now forward explicit optional engine identity.
OriginalWorldFrame carries owning physicsEngine; native MCGA and display-driver
race renderers provide it independently of descriptor tracking/slow-video flags.
Both world submission paths forward it. Negative-odd pipeline regression proves
legacy[-1,-2,200] versus modern[-2,-3,200] in BOTH bounding and drawing vertices,
with source cache preserved. Exhaustive scalar test, typecheck and222-sample
four-reference/two-policy real-runtime renderer corpus pass after integration.
Intro/car-menu/overview and high-resolution visibility caller audit/propagation
remain pending; do not claim every rendering path is fixed. Whole46 remains
open;51/103 completed,52 remaining,49.5%.

Item46 versioned halving primitive implemented: transformOriginalModelVertex
accepts optional engine identity, keeps undefined/MS90 IDIV-style truncation,
and uses signed16-bit arithmetic shift for MS91. Full-size coordinates remain
unchanged. Exhaustive65536-value/allthree-axis identity-matrix tests pass for
both policies, no-halving and legacy default. Independent original execution
of BOTH halving sites in BOTH EGA releases matches512 cases including signed
word extremes/negative odd values. Scripts check_original_model_halving.py and
test_versioned_model_halving.ts pin actual opcode entries and preserve binaries.
Caller propagation through bounds, primitive projection, menus/intro/overview
and enhanced visibility is NOT yet done; production callers still default to
legacy arithmetic. Do not describe the complete renderer fix as released or
finished.46 remains open;51/103,52 remaining,49.5%.

Item46 complete model-projection body inventory added in
audit_original_model_projection.py: legacy16AA0–17A22 (3971 bytes/1403
instructions/145 closed direct branches), modern172C6–1824A (3973/1397/154).
All44 callsites per edition enumerated; eleven structural change groups and
374 same-shape operand changes explicitly remain unclassified, not assumed
equivalent from address stripping. Confirmed semantic gap at legacy16D84 and
16FAE versus modern175B2 and177C4: three signed IDIV-by-two operations become
three SAR-by-one operations. Negative odd coordinates therefore truncate toward
zero in legacy and round downward in modern. Current transform-model-vertex.ts
still uses Math.trunc for every engine; version-specific propagation/fix and
independent original tests are required. Existing sampled renderer parity did
not establish this changed arithmetic. Fresh original primitive-bound1024-case
corpus passes; all14 packed model banks/197 parsed models remain identical to
both editions and actual browser assets.46 remains open;51/103,52 left,49.5%.

Item46 refreshed renderer evidence: both model-region branches match200
original MS91 instruction cases with bounded writes. Native routing test covers
visibility/enabled combinations; redraw bit preserves every other descriptor
byte for all256 flags. Four-reference actual manual runtime corpus passes both
slow-video choices and mid-race switching:222 rendered samples through allfour
finishes with equal original pixels, enhanced calls/wheels/masks and live state.
Fresh FGTO02-ROT modern recording also passes14 samples/573 enhanced draw calls
through1167 ticks and finish. That particular default test exercises zero local
car-region submissions and zero selective bitmap copies, so it does NOT cover
those optional paths. No geometry/helper edit justified by these results alone.
Complete non-audio difference classification still open;51/103,52 left,49.5%.

Item49 concluded after user clarification: the requested issue is whether the
divider trees collide in both versions; user explicitly requested no further
investigation once the expected ground-level collision/raised-pass behavior
was established. Original loader/menu checks in both editions are already
verified above. Exact legacy playback, paired original scenery-point/height
comparisons, original controlled modern passage and refreshed both-engine
controlled/synthetic tests provide the collision evidence. The additional
search for a fresh modern community tree-through recording is stopped at the
user's instruction, not asserted passed. No claim of cross-version conversion
or exhaustive trajectory validation. Detailed49 accepted at this clarified
scope;51/103 verified,52 remaining,49.5%. Next:46 geometry/resource audit.

Item49 additional archive search: ZCT294/295/296 downloaded via the same
published2026 archive links, entry paths inspected before isolated extraction.
Supported294 recordings have no divider109/110 and are filtered out; five
custom cars explicitly skipped.295's16 supported recordings and296's two
supported recordings finish crash-free but none meet the close-tree candidate
criterion.295 has two custom-car skips,296 fifteen. No sources changed.
Requested an optional actual1991 divider/tree replay from Marco while retaining
the independent public search path. Gate49 still open,50/103,53 left,48.5%.

Item49 new public archives downloaded from the links on
https://zak.stunts.hu/tracks/2026 into isolated
/private/tmp/ms91-divider-community.71sJ3u (ZCT301.zip/ZCT302.zip). Archive
entry inventories inspected before extraction. Candidate search checked12
supported301 recordings and15 supported302 recordings, skipped11 custom-car
recordings explicitly. Alan Rotoi's301/02-ROT.RPL (FGTO) approaches the divider
tree on frame289 at[1472420,1776,955721], with one wheel contact and no crash.
Independent original MS91 loader/analysis/initializer/full update-loop capture
matches all1167 frames, compared physics/debris fields and final RNG, finishing
at1147 ticks. Evidence /private/tmp/ms91-alan-divider-20261012.bin and .json.
Stricter test_modern_divider_replay.ts rejects this as a tree-through passage:
lowering the body to ground height never makes it collide with that tree, so
proximity alone was insufficient. The strict assertion is retained, not relaxed.
This genuine run is additional parity evidence, NOT divider acceptance. Sources
unchanged, no stored data/live writes.49 remains open;50/103,53 remaining,48.5%.

Item49 community-candidate search added in find_modern_divider_passage.ts:
read-only fresh MS91 simulation of archived modern-format controls, no position
or state seeding. Existing ZCT299's20 replay tracks have no divider109/110;
ZCT300 has28 recordings with a divider,27 supported original-car recordings
all finish crash-free but none approach the divider tree centre within100
world units while body height24–119 and crash-free. One SILV custom-car replay
is explicitly skipped, not counted as passed. These bounds screen for a useful
candidate only; they do not prove exact original physics or absence of every
possible tree passage. Source-byte equality asserted per checked replay and
typecheck passes. A suitable genuine modern divider recording is still sought;
49 remains open.50/103,53 remaining,48.5%.

Item49 original MS91 GUI loading verified in muted DOSBox using isolated
/private/tmp/ms91-menu-divider.JCoQ0Q archive extraction and MAR91.RPL copy.
The supplied launcher still presented a manual-word question; the published
4d-css.pdf answer for39/2/3/3 was used, without executable modification.
Replay Menu → Load Replay → MAR91 loads at1:57.90 and plays; cracked-window
crash is visible by0:41.85 near the corkscrew (user also observed it). This
agrees with the independent complete update-loop capture: first crash406/20
=20.30 seconds, then retained crashed state. GUI screenshot does not establish
the exact first-crash tick; the capture does. Thus old controls are deliberately
not advertised as converted compatible downloads. A genuine fresh modern
divider passage is still needed;49 remains open. Emulator closed/exit0 and
staged replay byte equality verified.50/103,53 remaining,48.5%.

Item49 original MS90 GUI half verified in muted DOSBox: original archive
extracted into /private/tmp/ms90-menu-divider.BUPLes, unchanged MARSKIDS.RPL
copied in, only that folder mounted. STUNTS.COM reached its manual-word prompt;
that attempt was closed, then the archive's supplied ST.COM launcher used.
Replay Menu → Load Replay → MARSKIDS loads with1:57.90 endpoint, playback starts
and crosses the raised divider/tree area: visible tree at1:16.55, continued
passage at1:17.35 and clear roadway beyond it at1:28.75, no crash presentation.
This is actual original GUI playback, supplementing existing exact legacy
frame comparisons; it is not an assertion that old controls work in MS91.
Emulator closed, terminal exit0 verified, cmp proves staged replay unchanged.
Modern original GUI half and genuine modern divider route remain pending.
No existing saves, scores or live website changes.50/103,53 remaining,48.5%.

Item49 independent MS91 full-loop evidence added: original EGA instructions
load the isolated modern-header copy of Marco's2358 recorded inputs, analyze
the actual SKIDS track, initialize PMIN/race and execute2358 complete updates.
New capture/evidence: /private/tmp/ms91-mar-divider-full-20261012.bin and .json.
The native comparator matches every position, compared physics/debris field,
and final RNG; zero differing frames/stateDifferences. Neither run finishes:
the old controls do not reproduce the old route under modern physics. This
proves matching modern interpretation, not successful cross-version replay
conversion or a fresh1991 divider passage. Original GUI/menu loading remains
unverified, so49 stays open. Comparator and fresh-browser helper now pass
explicit engine identity into captureOriginalRaceInput. Independent796-frame
QA91R001 capture still matches exactly; browser-download reload/rewind and
private verifier pass with776 finish ticks (796 includes20 post-finish frames).
An initial invocation incorrectly supplied796 as the expected finish and was
rejected; authoritative prior capture documents776. No assertion weakened.
No stored replay/score or live changes.50/103,53 remaining,48.5%.

Item49 controlled divider probe refreshed: the test now captures each engine's
inputs with explicit20Hz/engine identity. Copying the whole legacy memory image
into a modern session incorrectly replaced its resident checkpoint allocation;
the production guard rejected that invalid test setup. The modern controlled
probe now copies decoded player state/previous pose into a fresh modern session
and initializes its modern body caches, retaining its allocator and resources.
Both seeded probes pass46 updates (frames1504–1550), approach tree collision
points on six frames and travel over one tile without crashing. Final positions
are legacy[325688,1996,1341020] and modern[325707,1996,1340589]; trajectories are
not asserted identical. The768 synthetic divider height/selection cases also
pass. Source replay bytes are checked unchanged. This is a controlled contact
probe, NOT a replay conversion or original DOS loader/menu trajectory proof;
item49 remains open.50/103 completed,53 remaining,48.5%.

Item33 accepted for complete upgraded menu text/resource routing. Original
distribution comparisons prove all11 game/four editor text overrides and gver;
bank-scoped efex, replay/results/intro dialog hosts follow owning engine. Native
and raster title paths use the same exact modern packed/frame data, preserve
legacy data and leave enhanced artwork separate. Browser verification covers
modern Options/version/expanded graphics, editor horizon/terrain and wrap/cancel,
replay/save/overwrite cancellation, display options, modern→legacy→modern
replacement with20Hz identity and five→ten graphics choices, and corrected
opening exit prompt. Original-graphics fallback starts publisher/title sequence
and reaches animation without runtime error; no claim of an exact pixel-by-pixel
browser title comparison (frame hash and native render corpora provide data
evidence). Restart ended the test and restored the prior enhanced/ready state.
Fresh full dialog/title/settings suites and typecheck pass. Original/hardware
audio, every desktop/mobile interaction, final graphics appearance, fresh finish,
data backup and release remain in their separate open gates. No save/overwrite,
score submission, Git push or live deployment.50/103,53 remaining,48.5%.

Item33 fallback title path corrected: versionedTitleArtwork decodes the same
embedded original MS91 packed bank used by native title catalogs, locates titl
and bounds-checks its320x200/64016-byte frame. Raster opening now selects this
copy by future engine. Packed/frame provenance is updated; unchanged publisher
art remains shared, legacy object identity is retained, enhanced images are not
replaced. Extended test verifies exact independently audited original frame
SHA256, copy isolation and legacy preservation, alongside actual three-display
title rendering. Tests, future settings and typecheck pass. Final original-mode
browser smoke remains before gate33 acceptance.49/103 unchanged.

Item33 corrected opening-exit browser check passes: fresh restart/start and
Escape sent during the observed title stage opens compact modern Exit to Dos
with No/Yes, selected Yes; Yes returns Ready to play. Earlier manual attempts
reached animated stage before input and only skipped it (original boolean skip),
so were not claimed prompt evidence. Same tab retained, no saved file/score write.
Further source review identifies another presentation route: non-displayMode
opening in app/OpeningSequence.tsx still fetches legacy title-art.json directly,
outside the already corrected native title catalog path. Exact modern raster
title data must be routed there too; item33 remains open,49/103 unchanged.

Item33 reverse browser switch passes: DEFAULT legacy replay replaced by
QQALAP, canvas identity returns ms-1991/cadence20/frame0, modern compact
Replay/Display Options and ten-choice graphics selector return with three
retained marks. Final source review found opening-exit path still bypassed
engine text/layout routing. Corrected app caller to pass future engine,
MAIN overlay plus engine to both allocated and raster dialog paths, and engine
to raster drawing/hit-test layout. Typecheck, spacing and all16 original text
comparisons pass. Actual corrected opening-exit browser check still pending;
item33 remains open,49/103 unchanged. No score or replay writes.

Item33 browser cross-version evidence: modern QQALAP Display Options opens
expanded ten-choice graphics panel with expected active marks; Escape restores
controls. Replay Menu Load REPLAY replaces it with bundled DEFAULT without
save/write. Canvas DOM now reports preparedRaceEngine ms-1990/cadence20 at
frame0 while launch URL remains ms-1991. Legacy Replay Menu restores older
spacing/disabled evaluation state, and its Display Options→Graphic level has
only original five detail choices, no modern cadence/video entries. This proves
loaded-session identity controls menus independently of future launch selection.
Reverse switch/final routing audit still pending; no settings selection, score
submission or file write.49/103 unchanged.

Item33 browser modern replay/save route verified: same tab loads existing
QQALAP through Options Load Replay. Canvas DOM reports preparedRaceEngine
ms-1991 and preparedRaceCadence20; replay endpoint39.80 matches796 frames.
Replay Menu visibly has all eight expected choices, with Continue Driving
disabled at endpoint. Save Replay opens retained C:\\ / QQALAP name panel;
Return reaches File Exists with Rename File / Save File, initially Rename.
Escape cancels and restores replay controls without selecting Save File.
No overwrite, new replay write or score submission was performed. DOM audio
state running is scheduling evidence only, not an audible-output pass. Legacy
switching/display-options paths still remain for item33.49/103 unchanged.

Item33 browser editor checks: same tab11 navigates main→track→editor. Horizon
menu visibly contains Desert/Tropical/Alpine/City/Country/Cancel; Escape restores
editor. New opens Select Terrain with Terrain1..5/Cancel, not GAME's colliding
Replay Menu. Up from Terrain1 visibly wraps to Cancel; Return cancels and
restores editor. Done returns to DEFAULT overview without save/change prompt.
No placement, save, terrain/horizon change or score submission occurred. User
confirmed silence was caused by in-game audio off; sound settings left untouched,
not counted as audible output verification. Replay/save/old-version routes
remain pending before item33 acceptance.49/103 unchanged.

Item33 browser access restored by user: existing in-app tab11 at localhost5191
was reused, no new tab. Actual launch/title/main/options flow runs; visible
Options header reads Version1.1 (Feb25 1991). Expanded ten-choice graphics
panel shows five detail choices, both video modes, both simulation rates and
Done, with three correct current marks (FULL, slow video ON, fast simulation).
Escape restores Options; modern Exit to Dos prompt displays No/Yes and Yes
returns Ready to play/PLAY STUNTS. No race/score submitted or file saved.
Game stopped after checks to release audio, tab retained for continued QA.
Remaining replay/editor/save/version-switch routes not yet browser accepted;
item33 stays open,49/103 unchanged.

Item46 model-resource evidence: new audit_original_geometry_banks.py enumerates
every P3S bank from untouched distributions, rejects added/removed banks,
decodes/compares whole banks and compares all parsed browser geometry fields.
All14 banks/197 models match both editions exactly. Actual browser native packed
files also match both original packed files, including each manifest length and
SHA256; this retains primitive culling metadata omitted from parsed JSON.
All source archive/assets hashes remain unchanged. No model replacement is
justified by the version upgrade. This does not prove every executable geometry
helper, upgraded renderer placement or on-screen appearance; those scopes remain
open and item46 is not accepted yet.49/103 unchanged.

Item74 interim checkpoint strengthened (not final acceptance): source backup
now includes per-entry SHA256/length or exact symlink target, checks the source
did not change while archiving, and verifies every restored entry rather than
only five required files. New checkpoint:
/Users/svenanders/Documents/Codex/PlayStunts-backups/2026-10-12-ms91-menu-routing-checkpoint
Archive SHA256 b69c4b6ae1e483e06ed059d52483ec1c1a77d6914d1d980cd42335b31e89c1c6.
All2036 entries restore and match in a new isolated directory; public remains
a symlink and is never followed by the source archiver. Future-engine rollback
tests pass in current and restored source. Database is explicitly NOT included;
external assets have their separate gate. Item74 requires another refresh after
final source changes and therefore remains open.49/103 unchanged.

Item33 connected regression refreshed: full dialog suite passes including the
new nine owning-engine routes; future settings and all16 original text overlay
comparisons pass. Browser inventory currently exposes zero in-app tabs. Existing
preview PID26196 is verified alive (vinext127.0.0.1:5191), and an approved
read-only readiness check returns HTTP200. Initial sandbox loopback failure did
not prove server shutdown; existing server was retained, not restarted or killed.
Actual browser menu acceptance remains pending until its tab is available.
No new tab created, respecting the user's same-muted-tab preference.49/103.

Item33 settings capability gap corrected: menus now retain an MS91 settings
owner independently of launch selection. A modern imported session gets its
expanded graphics selector even when booted in legacy mode; legacy sessions
still receive no MS91 graphics settings. Future-race settings getter and private
score cadence follow future engine, while active dialogs follow session engine.
Existing allocated selector initializes graphics marks from active memory and
keeps rate changes as future-race preferences. New helper tests prove retained
preferences survive legacy/modern switching and replay engine/rate are not
rewritten. Fresh settings/options tests and typecheck pass. Nine owning-engine
dialog tests added to the full dialog suite. Public default remains legacy;
browser acceptance/final item33 review still open.49/103 unchanged.

Item33 allocated/save/results routing follow-up: allocated save resources now
receive the owning engine overlay after scoped save-text merging. Main results
also bind engine and text after score-text merge, preventing legacy resources
from overwriting modern prompts. Editor save collisions now use MS91 MAIN efex
while preserving TEDIT emen's terrain meaning; regression explicitly checks
both bank scopes. Full test:ms91-dialog passes:14200 navigation/3550 startup,
18 allocator-backed nested restores,54 allocated interactions,72 evaluation
resource lifecycle cases, plus text/layout/engine tests. Nine owning-engine
fallback tests and typecheck pass. Settings capability gating and browser
end-to-end routes still require final review; item33 open,49/103 unchanged.

Item33 fallback routing gaps fixed locally: non-allocated replay menu now
binds both text and dialog behavior to session.physicsEngine; replay saving
applies owning-engine text after merging its three bank-scoped save resources;
allocated result dialogs also receive the owning-engine MAIN/MISC overlay.
New versionedGameDialogHost preserves original hosts/resources, delegates
unchanged entries and explicitly excludes TEDIT (separate colliding-ID scope).
Nine actual dialog-runtime tests cover inherited/default versus owning engine,
modern efex text/wrap, legacy restoration and backdrop preservation. Options
dispatch/failure cleanup and all game/editor resource tests pass; typecheck
passed before the new test and will be repeated for final gate acceptance.
Actual browser routing QA remains open. Item33 stays open,49/103 unchanged.

Item31 accepted for complete shared decoded resource classification. Untouched
archives contain79 byte-identical resource files and13 differing banks. All28
changed entries are classified:14 text/version entries (plus two added MAIN
texts), six opponent speed profiles, six PC voice allocation masks, Jaguar
instrument coordinates and title artwork. Regression checks exact opponent
byte changes, voice offset12 masks, Jaguar offsets8/10 with identical payload,
and title header offsets4/6 plus370 pixel-payload changes. Title header bytes
are retained by conversion; drawing paths consume dimensions/positions/layout,
not these two fields. No unsupported meaning is invented for retained fields.
Actual runtime game/editor text constants and version label match original
bytes through NUL. Fresh all11car SIMD/14-field audits and536 plane/191 wall
tables match target; collision banks are identical across editions. Original
source hashes/bytes stay unchanged. Separate executable/driver/track/replay
classification, browser QA and routing gate33 remain separate requirements;
this resource classification does not close those.49/103,54 remaining,47.6%.

Item31 resource verification strengthened: title test now runs real allocated
CGA, Tandy and EGA conversion/drawing/reveal paths for both catalogs, with
different modern pixels and preserved legacy bytes in each mode. A new
test_original_dialog_overlays.ts imports the actual runtime constants and
compares all11 game-dialog texts, four editor-bank texts and the version label
with independently decoded untouched MS91 distribution bytes through NUL;
all16 pass. This replaces reliance on the older regex auditor that assumed
only six overrides. Six opponent bank copy/speed adaptation comparisons and
modern PC15 driver/voice SHA256 isolation tests also pass fresh; typecheck
passes. Item31 final classification review remains open,48/103 unchanged.

Item31 title routing corrected locally: original MS91 SDTITL.PVS is embedded
with edition/length/SHA256 provenance and returned through a separate copy-only
catalog wrapper. Browser opening passes the selected engine to title cards;
default/legacy catalogs retain identity and unchanged resources still delegate.
Test verifies bytes against untouched extracted distribution, packed SHA256,
path normalization, isolated reads, legacy preservation and real allocated EGA
title pixels through all four reveal passes. Initial test wrongly omitted the
presentation generator (only inspected cleared video); corrected to execute
the real presentation and then pixel differences pass. Browser screenshot QA,
other display modes and full resource classification remain open. No shared
asset overwrite, live publication, stored replay or score mutation.48/103.

Item31 complete shared-resource inventory refreshed from untouched ZIPs:
79 resource files are byte-identical;13 decoded resource banks differ with
28 changed entries and two new MAIN.RES entries. The inventory now records
individual entry lengths, exact changed-byte counts including length changes,
SHA256 hashes, and distribution-only filenames. New regression pins all13
bank/entry sets and rejects decode failures; it passes with sources unchanged.
Non-resource executable/driver/track/replay formats remain explicitly separate.
Opening title routing gap identified: browser-native-opening calls title cards
without selected engine and browser-native-title-cards loads the legacy catalog,
although SDTITL.PVS/titl has372 changed bytes. Needs versioned artwork routing
and verification, not a physics workaround. Item31 remains open,48/103 unchanged.

Item29 accepted for engine replay-limit behavior. Combined evidence includes
24 actual original prompt-envelope cases,6 legacy/12 modern original rollover
captures, three real native12005-tick sessions (MS90/20Hz, MS91/20Hz,
MS91/10Hz), and two genuine completed >10-minute races accepted by isolated
server verification. Continue Now, See Replay and Escape are verified at the
actual session boundary. Production browser-loop wiring now has four cases
covering all exits and failed-dialog cleanup; audio/render output explicitly
uses test doubles. Allocated interaction tests additionally draw the modern
erbf resource with real fonts and restore the backdrop in allthree display
modes; the legacy generic menu fixture only proves legacy interaction rules,
not its resource wording. Both test suites and typecheck pass.
The replay buffer is12000 frames, ten minutes at20Hz/twenty at10Hz;
rolling recording does not crash either native engine. This does not claim
reproduction of an unmodified legacy executable freeze. Actual browser pixels,
audio and final end-to-end acceptance remain in their existing open gates.
No stored data or live site changed. Overall48/103,55 remaining,46.6%.

Item29 continuation evidence: actual allocated manual sessions now exercise
See Replay and Escape at the genuine12000-frame boundary for MS90/20Hz,
MS91/20Hz and MS91/10Hz. See Replay clears the prompt, requests cause4 and
sets the replay/done flags; Escape clears the prompt without ending the race.
Each exit uses a restored isolated memory checkpoint before Continue Now,
which still records through12005 ticks without a crash. Source replay bytes
remain unchanged. Cleanup tests additionally cover failure of resume-input,
preserve the pending prompt and successfully retry after recovery. Both test
suites pass. Browser presentation and the final item29 acceptance review are
not claimed by these tests; overall47/103 unchanged.

Item44 complete, static original-driver difference classification: audit now
partitions all3285 legacy and3571 modern bytes, including21-entry export header,
callbacks,operator/controller/status functions,sample-playback code,lookup
tables,retained state,new256-byte cache and padding. Compared code regions are
fully decoded and branch/reference relocations checked. Four changed helper
bodies are fully decoded and hash pinned to the classified originals.
Timing changes: old writer waits for PIT counter<=FFE4, repeats address/data
outputs four times and reads status five times; modern caches duplicate writes,
outputs once per address/data and calls the50-byte PIT countdown helper with1
after each. Sample IRQ read count changes5→10. Startup removes initial legacy
PIT setup and initializes the modern cache only after successful detection.
Remaining compared callback/sample logic and tables match after relocations.
Package hashes unchanged. This completes classification only: actual hardware
time,sample-host support,browser result transitions and final sound QA remain
separate open acceptance scopes.

## Progress reporting

Item28 retry/cancel prompt boundaries now direct: legacy198D:2A46..2AD4 is142
bytes/64 instructions; modern2C20..2D6C is332/133 with two returns. New body adds
an early guard and copies resource text into512-byte local storage, appending the
retained filename (including extension) in both prompt variants before invoking
existing dialog service. Native dispatch already honors choice2 cancellation and
separates optional versus retrying resource kinds, but filename diagnostics/guard
and prompt body dependencies are not yet accepted. Source-level resources mostly
use explicit thrown errors for unavailable bundled files, which is not claimed
identical DOS popup behavior. Full difference review remains necessary.
Overall46/103 unchanged.

Item28 read/write request evidence strengthened: complete163-byte write wrapper
matches65 instructions, DOS requests/branches and identical error message.
Simulated DOS64 cases cover create/write failure, short writes, zero length and
segmented payloads through70000 bytes; no real files. Complete130-byte raw read
matches both versions, two shared optional/required entry paths and fatal message;
64 simulated optional-read cases verify null failures, segmented reads and retained
short-read tails. Native12 isolated allocated-result cases across both engines
and lengths0/1/51/52/363/364 preserve old tail bytes and perform no score write.
Added to test:ms91-results. Complete read dispatch102/120 bytes matches except
explicit18-byte basename diagnostic prefix. Retry/cancel prompt and fatal message
presentation remain separate unresolved dependencies. No live data touched.
Overall46/103 unchanged.

Item28 newer read-wrapper added basename call mode1 fully inspected:198D:12AC
has mode0 extension-stripping and mode1 copy-through-NUL paths through132C; caller
2580 explicitly selects1, so retained3428 includes filename EXTENSION, unlike
dialog display names. No native field change made before tracing consumers.
Filename builder complete119-byte comparison and allthree string primitives
pass;72 direct original/native path/name/extension cases match both versions,
no file opened. Resource copy ES reuse has18 direct original cases with source
offset wrapping. Latest like-for-like EGA proof closes colour and clip helpers;
38 result dependencies remain. Discovery handles PUSH CS/near CALL→RETF and
after-return shared-epilogue blocks, avoiding next-function overrun. Overall46/103
unchanged.

Item28 high-score loader like-for-like EGA full body comparison passes262/260
bytes under explicit field/call/branch relocations and PUSH ES reuse after LES SI.
Seven52-byte record layout unchanged; DOS read/write dependencies not yet accepted.
Read wrapper modern198D:2580 adds a call to198D:12AC with destination3428,
filename andmode1 before existing read dispatch. That helper scans backward to
DOS slash/colon and extracts filename portion; full mode1 tail and use of retained
basename still require checking. Do not dismiss this as raw address relocation.
Write wrapper both163-byte candidates has matching DOS interrupt request sites
plus relocated fatal handler; full error branches remain to compare. Earlier
bounded-discovery loader overrun corrected to include after-return blocks and
stop before next prologue/padding. Overall46/103 unchanged.

Item28 font-color helper difference is DISPLAY BACKEND, not engine physics:
legacy MCGA209E:5F60 clearsAH (8-bit colour), but legacy EGA result call at6261
targets209E:9130 and already ANDs both colours with15 exactly like modern EGA
20E5:92B8. Both EGA bodies29 bytes, selected-font DS4DD2/4EB0 relocation remaining.
Therefore do not introduce engine-specific colour behavior based on MCGA/EGA
comparison. Existing packed display masks already match the backend rule.
Further drawing helpers should compare like-for-like EGA originals to avoid
misclassifying driver differences as version changes. Overall46/103 unchanged.

Item28 all11 structural result-routine changes classified: portrait halving,
four button inset expressions reading retained edge+1 instead of fixed constants,
padding and versioned result-menu wrap control flow. All156 paired branches either
map directly or are the two explicitly reconciled input-loop rearrangements
covered by168 original cases. Default48-byte table equality establishes unchanged
shipped button placement; arbitrary mutated table geometry is not claimed native
parity. Complete67-byte text measurement helper matches under selected-font field
and branch relocations, no calls. Forty-five helper references remain. Actual
completed MS91 result/save/download/reload integration test suite passes4/4 with
MS91_RESULT_REPLAY=/private/tmp/QA91R001.RPL, zero skipped; private score writes
use isolated in-memory fixtures only. Overall46/103 unchanged.

Item28 complete evaluation RNG helper compared directly:78 bytes in each
binary, identical normalized instructions under six-byte state relocation
9F5C..9F61 toA64E..A653 and corresponding internal branch targets. No calls or
interrupts; final returned byte/zeroed AH identical. This closes one result
dependency without relying on matching names. Forty-six helper references remain;
whole item28 still open, overall46/103 unchanged.

Item28 all128 non-call result operands now classified:18 saved-statistics,
43 byte-identical resource/text identifiers,55 explicit retained context fields,
12 references into byte-identical48-byte evaluation/button tables. Three complete
branch-closed no-call helpers (63/27/97 bytes) compare byte-identical. Two result
formatter calls linked to fresh4052 time and2000 numeric field original cases.
Forty-seven helper references remain; no acceptance from naming alone. Portable
npm run test:ms91-results consolidates12 scripts and passes, including new wrap/
portrait checks. Overall46/103 unchanged.

Item28 shipped portrait resources checked read-only: all12 MS91 OPP1..6 WIN/LOSE
PVS banks decompress and contain op01;74 animation frames total. First-frame
heights are74..90, all below99, so the newly routed negative-rounding difference
does not move shipped portrait origins. Maximum animation height is90. Bank/frame
counts3,3,6,6,4,7,6,8,7,8,8,8; original file bytes unchanged. Existing legacy normal
path oversized-header caveat is outside shipped dimensions. Remaining result
operand/dependency classification remains open; overall46/103 unchanged.

Item28 portrait positioning now explicitly engine-routed in normal and packed
results display and animation callers. Modern uses signed16(99-height)>>1;
implicit/explicit legacy preserves previous normal truncation and packed signed
truncation. Native exhaustive65536-height regression and typecheck pass. Direct
original arithmetic executes131072 cases across both binaries, verifying signed16
wrapping and respective floor/truncation rules, sources unchanged. Legacy normal
path deliberately retains its preexisting unwrapped behavior for oversized headers
whose difference wraps outside signed16; this is not claimed original exactness for
every malformed bitmap. Shipped portrait dimensions and full result routine
dependencies still require review. Overall46/103 unchanged.

Item28 remaining structural arithmetic difference identified: portrait vertical
origin old61DB..61E7 computes signed16(99-height), adjusts negative odd values
toward zero before SAR; modern61D9..61E2 uses direct SAR (floor). This is portrait
centering, not score arithmetic. Current native normal/packed portrait functions
use legacy truncation; explicit version routing and oversized-height original
tests are still required. Other default button inset values match but modern
reads the retained edge table. Overall46/103 unchanged.

Item28 result-menu version difference implemented: modern left/right wraps
between first available button and3; legacy clamps. Selected-engine metadata now
flows from result panel to end-menu flags and is preserved by review state copies.
Native48 normal cases pass; original168 cases across both versions including
signed-byte127/128/255 edges match exactly via compare_original_end_menu.ts.
Typecheck passes. Complete result routine boundaries are legacy58D4..6C0E
(4922 bytes/1731 instructions), modern58D2..6C29 (4951/1739), branch-closed including
post-return input blocks. Inventory11 structural groups,180 operand candidates,
156 paired branches; complete classification still open. Modern button inset
table584..58A values4/84/164/244 yields same default5/85/165/245 as legacy but
dynamic-table behavior remains to reconcile. Overall46/103 unchanged.

Item28 fresh complete MS91 formatter oracle passes4052 time cases plus2000
numeric field cases; compare_original_ms91_result_time.ts matches every formatted
string and12156 retained scratch words. Exclusive capture
/private/tmp/ms91-result-time-fields-20261011-check1.json. Original result routine
legacy entry58D4 located from existing reconstruction disassembly; drawing begins
595C, so that comment is not a function entry. Full modern counterpart identification
and result routine comparison remain open. Overall46/103 unchanged.

Item28 fresh original crash/finish event corpora pass:2000 modern cases and1000
legacy cases across allfive causes, both cars and retained-state combinations.
Modern10/20Hz delays, finish tick sums, saved statistics and particle/audio
requests match native; caller DI is preserved. Captures are exclusive test files
/private/tmp/ms91-finish-events-20261011-check1.json and
/private/tmp/ms90-finish-events-20261011-check1.json; sources unchanged, callbacks
are requests only (no audible output). Result-time scratch preservation regression
passes implicit/explicit legacy versus modern retained-field routing. Result-screen
complete difference classification remains open; overall46/103 unchanged.

Item28 baseline regression suite npm run test:ms91-time passes all eight scripts:
unsigned cadence formatting (32768 positive20Hz values), result text/outcome,
replay bar, score row, opponent wait, direct crash/finish retained-memory events,
five result-presentation tests and13 replay-presentation tests. This establishes
current native behavior only; it does not close full original finish/result code
differences, result resource/driver dependencies or visual acceptance. Original
crash/finish routine modernBA32..BBD6 has prior complete420-byte inventory; fresh
scope review is next. Overall46/103 unchanged.

Item27 accepted: complete outer initializer419/435 instructions, all75 retained
operand candidates reconciled, three shape changes classified and15 branch
destinations explained. Complete nested car initializers172/167 instructions,
50 changed groups and17 tail relocations linked to528 full-state original/native
cases across all11 cars, both engines, transmissions, positions and headings.
Complete route helper336/320 instructions,14 changed groups,17 operands and24
branches linked to128 full-helper and242 original arithmetic cases. Modern
midpoint rounding and previous-route reset are explicitly routed; legacy defaults
preserved. Fresh initialized snapshots all11 cars at10/20Hz, active/mixed opponent
and seeded restart modes provide1120-byte comparisons; latest seeded10Hz Indy
mode-2 and active AUDI captures pass. Mode-3 preserves state atbothrates; original
prefix resets compared in eight cases. Experimental10Hz extra checkpoint clearing
remains explicit native storage hygiene, not original parity or public acceptance.
Six portable initialization regressions pass via npm run test:ms91-initialization;
typecheck and legacy seek tests pass. This accepts initialization differences only,
not intro visual/audio QA, finish/results, ten-minute behavior or public10Hz policy.
Overall46/103 complete,57 remaining,44.7%. Next item28 finish/result differences.

Item27 complete MS91 route-target runtime oracle now matches native pipeline in
128 cases: reverse/nonreverse, four rotations, terrain0/6, Y sentinel/ordinary,
primary/alternate route data and first/last waypoints. All20 output bytes and
returned last flag match; source binary unchanged. Structural14 groups classified,
all17 operand candidates mapped and24 branch destinations reconciled; whole-item
acceptance still requires remaining car initializer scope. Height tables verified
directly: legacy MCGA DS2D1A0:0122 and modern source DS32A90:0180 both contain
signed words0/450. Outer initializer now has two unresolved helper references.
Overall45/103 unchanged.

Item27 branch-closed route inventory extends past first RETF to include the
second return: actual complete boundariesAB1A..AE4A (816 bytes/336 instructions)
andB200..B50E (782 bytes/320 instructions). Supersedes earlier first-return bounds.
All24 direct branches remain inside these complete bodies. Twenty-two paired
destinations align; two target replacement midpoint block entries and need
explicit semantic aliases. Seventeen changed operand candidates and14 structural
groups are now inventoried by audit_original_route_target_inventory.py. Whole
helper remains unaccepted; overall45/103 unchanged.

Item27 route helper boundary corrected by actual RETF, not a fixed-size scan:
legacyAB1A..AE42 is808 bytes/330 instructions; modernB200..B505 is773 bytes/313
instructions. Earlier1200-byte investigation included subsequent functions and
must not be treated as this helper's full dependency inventory. Within the actual
helper the only legacy far calls are the three midpoint divisions. Structural
changes are cached packed-direction byte, padding, midpoint shifts, and removed
output-pointer reloads. Operand/branch relocation proof remains open. Overall45/103
unchanged; no acceptance from structural alignment alone.

Item27 all production trackRoutePoint/trackOpponentRoutePoint callers now
propagate physics identity: initial/running player, opponent, introduction setup
and driving, server route evidence. Optional parameters preserve implicit legacy
call behavior. Typecheck passes after intro routing; visible/audible introduction
acceptance is still separate and is not claimed by typecheck. Original helper
classification remains open; overall45/103 unchanged.

Item27 midpoint oracle executes both actual arithmetic blocks plus actual legacy
signed-division helper:242 cases including signed16 extremes, negative odd sums,
and Y=-1 sentinel all pass. Native121 cases preserve implicit/explicit legacy
rounding and implement modern floor; a boundary-tile full lookup test verifies
player/opponent engine propagation. Native race initialization, running player
guidance, opponent lookup and server evidence gates now pass engine identity.
Countach original/native1120-byte initialization capture passes after change;
legacy CTKFIN/DEFAULT deferred seeking regressions and typecheck pass. Intro
callers and full helper classification still require review. Overall45/103 unchanged.

Item27 route midpoint difference identified directly: legacyAD8F..AE08 uses
signed32-bit sum divided by2 through1EC1:1BF0 (truncation toward zero), modern
B479..B4D4 uses SAR DX/RCR AX (floor for negative odd sums). Both sum signed16
endpoints into signed32 bits before halving. This differs by one unit for negative
odd sums; must inspect native midpoint routing and reachable coordinate domain
before declaring compatibility. Full helper classification remains open.

Item27 input-reset helper fully compared: legacy142B4..142DC and modern
1495A..14982,40 bytes each, identical instruction sequence under six explicit
retained-field relocations. Outer initializer therefore has three remaining
operand candidates. Route-target helper investigation shows its first1200 bytes
are not simply relocated: legacy calls signed-long division three times whereas
modern has no such calls in that span. This is an investigation finding, not yet
proof of changed output or a native bug; both complete helper boundaries and
replacement arithmetic must be checked. Overall45/103 unchanged.

Item27 outer operand inventory now accounts for71/75 candidates:48 snapshot
relocations,4 math helper relocations supported by freshly rerun25/25 dependency
audit, and19 explicit checkpoint/start-coordinate/car-configuration contexts.
Source scanStart confirms column/hill/terrain-row ordering; two earlier audit
labels had hill/row reversed and are corrected without gameplay edits. Remaining
four candidates are height-table reference, input reset helper, car initializer,
and route-target helper. Nested car initializer still needs complete register-
reuse reconciliation. No whole-item acceptance; overall45/103 unchanged.

Item27 full-memory wheel-cache regression rerun exposed an outdated expectation:
it permitted only wheel writes, so correctly rejected the newly proven9494 reset
at canonical8DAA. Test now explicitly requires modern zero and legacy7D7D for
that word, permits exactly its two bytes, and retains the whole-memory exclusion
of other writes. All32 angle/hill/transmission/cadence cases pass; no production
change was needed. Overall45/103 unchanged; initializer classification still open.

Item27 full outer initializer inventory decodes all419 legacy and435 modern
instructions. Structural alignment exposes three shape changes: cadence/mode-3
block, added previous-route reset, and removed padding. Fifteen paired branches
map to their corresponding destinations except the explicitly identified entry
into the added cadence block. Of75 changed operand candidates,48 are verified
canonical snapshot relocations with the two inserted24-byte car body caches;
27 global/helper/table references remain for semantic checking. Alignment alone
is not equivalence proof. The nested car initializer has172 legacy and167 modern
instructions; its modern added blocks construct shifted start coordinates and
copy them into body-cache records. Full nested-helper classification remains
open, including retained-register optimizations. Overall45/103 unchanged.

Item27 inventory found a real added reset: modern919C clears9494 (canonical
8DAA previous-route word), absent from the old initializer. Earlier fresh zero-
state comparisons could not expose it. Seed321 in matched-input mode tests
reproduced two-byte mismatch at snapshot756/757. Modern initializePlayerRace now
clears it; legacy leaves it unchanged. Four nonzero/signed-edge values verify
modern zero versus exact legacy/default retention, input unchanged. Full1120-byte
original/native Countach mode-2 now passes with seeded nonzero previous route;
typecheck passes. Full initializer inventory still open; overall45/103 unchanged.

Item27 matched-input restart oracle added: original initializer accepts explicit
mode and1120-byte retained-state seed, with checkpoint arena established before
fresh reset (not only afterward). Native counterpart uses the same seed and actual
route lookup/profile context. Full1120-byte comparisons pass Countach20Hz mode-2,
Indy10Hz mode-2, and mixed AUDI/Indy20Hz modes-2/-1/0. Target-preserving and fresh
restart paths therefore have direct evidence, not only native invariants. Sources
unchanged; typecheck passes. Full old/new initializer difference inventory remains
before27 acceptance; overall45/103,58 remaining,43.7%.

Item27 all-car initialization corpus now passes at both10/20Hz:22 complete
1120-byte original/native snapshots (24640 bytes), source files unchanged.
Mixed AUDI/Indy active-opponent initialization also matches all1120 bytes.
Together with same-car AUDI opponent case, both inactive and active contexts
have direct full-snapshot evidence. Typecheck passes. Remaining27 work is full
old/new initializer difference classification and special restart/target modes,
not untested ordinary car initialization. Overall45/103 unchanged.

Item27 prefix/reset eight original cases compared at10/20Hz and modes-1/-2/0/1.
Count/radius/elapsed/countdown/toggle/done/phase reset fields match in every case;
derived30*rate and100/rate confirmed. Original fresh-start marker count is20 at
both cadences; native20Hz matches all markers exactly. Native experimental10Hz
also clears its additional20 allocated slots, an existing storage-hygiene
adaptation to prevent retained stale checkpoints, not claimed original behavior
or a physics change. Public10Hz acceptance remains item30; no new default set.
Explicit comment and comparator keep the distinction visible. Whole initializer
classification remains open; overall45/103,58 remaining,43.7%.

Item27 inactive-opponent setup mismatch resolved without changing gameplay:
original MS91 startup simulation bankA344 and native retained9C52 are both776
zero bytes when no opponent is selected. Original harness incorrectly replaced
that unused bank with player SIMD. It now retains actual unused-bank contents.
No-opponent Countach20Hz and original Indy10Hz both match all1120 initialized
snapshot bytes; active AUDI context was already exact. Copy-only all-car corpus
also passes all11 complete20Hz snapshots (12320 bytes). Typecheck passes;
source headers/assets unchanged. Checkpoint-reset count
and whole initializer classification remain open; overall45/103 unchanged.

Item27 full initialized snapshot oracle added:1120 original/native bytes are
compared immediately after complete race initialization, before first update.
Active AUDI/opponent case matches every byte. No-opponent Countach case exposes
13 differing bytes, all inside inactive opponent fields (offsets580..606), not
player state. Original harness currently supplies player SIMD to the inactive
opponent whereas native resource setup retains its separately initialized unused
record. That setup difference is a hypothesis requiring verification, not a
reason to ignore the bytes or modify gameplay. Original replay/resource bytes
unchanged; typecheck passes. Marker-reset count and full initializer acceptance
remain open; overall45/103,58 remaining,43.7%.

Item27 mode-3 semantics verified: actual9100 initializer returns via9532 after
cadence setup, preserving1120 retained bytes plus input count/elapsed/done at both
rates. Only three derived cadence fields change (610h/650h,30*rate,100/rate).
Caller located atB887 insideB87A synthetic-route preparation, itself called at
FEB2; no ordinary race-start -3 call was found in the direct caller search.
Native initializeRaceSession now preserves canonical state for explicit MS91
mode-3 (including65533 word alias); wrapper also avoids resetting live body caches.
Native four mode/rate cases preserve all input bytes and legacy defaults; original
two full-initializer cases and typecheck pass. Cadence remains explicit native
session context rather than copying new DOS global addresses into canonical DS.
Checkpoint count discrepancy and full initializer comparison remain open.
Overall45/103,58 remaining,43.7%.

Item27 original initializer prefix decoded: legacy9178..91C8 versus modern
9100..9185. Modern adds cadence cache-offset selection610h/650h, interval30*rate,
timer divisor100/rate, and new mode-3 branch directly to9532 bypassing shared reset.
Fresh original modern marker-reset loop still compares DI against literal20,
unlike native cadence-aware40-slot clearing at10Hz. This difference is explicit
and NOT yet classified as an original bug or accepted adaptation. Native currently
does not distinguish mode-3 in its reset path; reachability and tail semantics
need review before implementation. Existing cadence/initial-wheel-cache tests
pass but are native invariants, not proof of these original prefix cases.
Overall45/103,58 remaining,43.7%.

Current acceptance:45/103 complete,58 remaining,43.7%. Item26 accepted.
Scope: logical race timer, selection/recording and callback lifecycle differences;
not physical hardware tick delivery, browser audio timing or whole-game release.
Full timer comparison plus six lifecycle bodies are accounted; entire input
function partitioned into ten sections. Five changed sections linked to explicit
rules and original execution: mouse65536 words, selector384 cases, timer256,
duration300, modern rollover12 and legacy rollover6 complete-buffer cases.
Cadence/dead-zone/checkpoint rules are routed by explicit engine in every
production capture caller including server verification. Registered
npm run test:ms91-input passes rollover/inactivity/lifecycle/cadence/legacy seek,
score identity/relabel rejection and genuine>10-minute finishes in both engines.
Typecheck passes. Initialization and result/ten-minute UI remain separate27–29;
next27 race initialization. No live update or historical-record mutation.

Item26 production caller audit found server verify-global-score still omitted
engine on capture/continue rollover; now explicitly passes verified engine20Hz,
preserving legacy defaults and IDs. Long-race fixture also routes engine. Legacy
and MS91 genuine finishes after12100 idle inputs verify through buffer rollover;
both pass. Legacy CTKFIN controls do not finish under newer physics, so modern
test uses original-verified QA91R001 Countach controls, not relaxed assertions.
Copy-only hex fixture makes the regression portable; original replay unchanged.
Versioned score identity/relabel rejection and legacy deferred seek pass.
Typecheck passes. Final26 acceptance review remains; overall44/103 unchanged.

Item26 timer lifecycle comparison complete across six full old/new bodies:
install28 bytes, removal31, unsigned wait44, atomic counter10, callback-add52,
callback-remove63 per version. Instructions/internal branch targets match under
explicit global/callback/identity relocations. Removal remains ten undivided
callback-clock ticks; uses atomic original407A/407C→modern4128/412A, not divided
simulation clock. Native canonical callback identity9B8:1396 intentionally stays
paired in registration/removal; no DOS code is executed by the browser registry.
Wait wrap/zero boundaries and delayed removal preserving unrelated callbacks
tested separately. Hardware delivery/physical devices remain sound/browser gates.
Acceptance reconciliation still required before closing26; overall44/103.

Item26 full input-function byte partition complete: ten contiguous sections
cover all legacy14414..146D4 and modern14AC0..14DB3 bytes. Five unchanged sections
match with explicit field/callback/stack relocations and branch boundaries. Five
changed sections identified: inactivity cadence, mouse word arithmetic, duration
cadence, rollover-loop entry and checkpoint/input shifting. New300 original
duration-gate cases match native including wrapped count+adjustment, exact limits
and cause4/player0 request before completion; no claim about ten-minute UI made.
Timer installation/wait-loop scope still requires review before26 acceptance.
Overall44/103,59 remaining,42.7%.

Item26 original legacy recording-tail comparison added rather than relying only
on native implicit/explicit equality. All6 MS90 20Hz normal/prompt/rollover cases
at0/F000h checkpoint bases match full physical checkpoint/input buffers and all
counters/flags, including segment-wrap writes. Modern12-case check3 corpus still
passes the generalized comparator. Both original images preserved. Full old/new
input difference inventory still requires explicit section reconciliation;
overall44/103,59 remaining,42.7%.

Item26 entire old/new logical timer comparison completed with explicit global
and callback relocations, canonical branch-target matching and pinned cadence
blocks. Two behavior changes: audio interval comparison and countdown reload
use initialized modern interval word rather than literal5. One inverted-short
branch plus unconditional exit replaces old direct conditional exit; proved
equivalent by exact two-instruction context. No other timer instruction/control-
flow difference remains in decoded bodies.256 original modern timer cases already
match native. Complete input-selector/tail old-new inventory still open.
Overall44/103 unchanged; hardware callbacks remain separate sound checks.

Item26 complete original input selector14AC0..14C3F exercised in384 isolated
cases with explicit mouse/joystick/controls/key/pause/crash callback fixtures.
Native selected words/null exits, all supplied selector state fields, ordered
callback requests and both64-byte steering history arrays match every case.
Cases span10/20Hz, mode0..3, forced input, replay count/length boundaries, done/
evaluation gates, inactivity flags and all three control paths. This verifies
selector composition, not physical device drivers. Original source unchanged;
typecheck passes. Final old/new timer-input difference inventory remains before
closing26. Overall44/103,59 remaining,42.7%.

Item26 full original logical timer149BE..14ABE executed in256 isolated cases
at10/20Hz. Explicit callback boundaries intercept stack-match/audio-consumption/
pause/input-capture requests only; compare all timer fields and ordered requests.
Native matches every state/event result. Covers reentrancy/stack guards, signed
counter boundaries, queue consumption, exit/prompt gates and replay-speed ticks.
No hardware/audible timing acceptance inferred. Inactivity edge/guard native
suite adds112 cases across both versions/cadences; legacy defaults preserved.
Remaining complete input-selector callback and version-difference inventory
before closing26. Overall44/103,59 remaining,42.7%.

Item26 complete modern input selection read14AC0..14C64 reveals two additional
rules: inactivity limit is4*rate (not fixed80); mouse uses signed X-160 without
legacy division by2, absolute-word dead zone18 (legacy signed-byte dead zone16).
Explicit MS91 input routing implemented, including signed-minimum absolute-word
behavior. Original14B79..14BA6 and real absolute helper executed for all65536
mouse X words; native comparison passes every byte. Legacy omitted/explicit
mapping remains identical. Complete timer and hardware callback/input branch
classification still open; overall44/103 unchanged.

Item26 segment-boundary discrepancy resolved as oracle isolation error: reused
Unicorn memory retained prior offset0 checkpoint bytes at80000h, later read by
F000h string-copy wrap. Independent F2/F3 REP MOVSW and unprefixed MOVSW probes
confirm16-bit source-offset wrapping; native copy semantics need no change.
Fresh full emulated memory per case corrects test setup. New check3 corpus
supersedes check1/check2 and compares entire physical checkpoint span including
wrapped writes, full inputs and all counters/prompt flags. All12 original/native
cases pass at10/20Hz and0/F000h bases; original image unchanged. Existing race
timer/audio-wrapper cadence tests pass. Whole timer/input function classification
remains open; overall44/103,59 remaining,42.7%.

Item26 original recording-tail oracle added:12 cases span10/20Hz, normal record,
continue prompt, rollover and checkpoint base offsets0/F000h. Executes real
original far math and complete14C64..14DB3 tail. Initial incorrect code-segment
setup failed before capture; corrected105Ch setup returns normally/source intact.
Native comparison matches the first ordinary/prompt/rollover offset0 cases but
fails F000h rollover at byte2976 of10Hz checkpoint arena. Segment-boundary copy
semantics/emulator behavior require investigation; do not discard that case or
treat current rollover integration as accepted. Typecheck passes. Overall44/103.

Item26 found concrete recording-tail difference: original MS91 14C94..14D2B
uses checkpoint stride460h/frame displacement5A0h/copy230h words, versus native
legacy430h/570h/218h. Native capture now takes explicit engine and chooses snapshot
size; all production session/input/timer paths propagate engine identity. Both
versions at10/20Hz rollover tests compare every copied checkpoint byte, shifted
inputs/frame counts/elapsed adjustment and untouched modern live-cache tail.
Implicit version remains byte-identical legacy. Complete original timer/input
body classification and original rollover oracle remain before closing26.
Overall44/103,59 remaining,42.7%.

Current acceptance:44/103 complete,59 remaining,42.7%. Item25 accepted.
Acceptance scope is chassis version differences and their original-capture
regressions, not whole-game release or formal proof of every possible state.
Evidence reconciled:85 changed groups and380 operand pairs/833 sites classified;
25/25 complete helper dependencies linked; all15 modern exceptional branch sites
and conditional outcomes exercised by958-frame10Hz/2556-frame20Hz original loops
plus22 targeted all-car chassis probes. Collision allocation/sign impacts and
checkpoint markers verified; two controlled full-loop sign captures match.
All11 tunnel passages and Marco controlled divider pass. Final legacy MCGA
original-loop regression matches all2358 Marco frames and finish statistics;
initial EGA attempt was invalid for that MCGA-memory harness and is not accepted.
Legacy CTKFIN/DEFAULT deferred seek and particle routing pass. Modern2556-frame
mixed collision still matches physics/active debris/final RNG after ordering fix.
Sound-device/hardware timing, menus, initialization, results and final browser
release checks remain separate open items. Next:26 timer/input-loop differences.

Item25 final helper reconciliation rerun:25/25 dependencies linked, none pending.
Acceptance review identified ordering risk in new sign integration: indexed sign
debris occurs before later start-support crash. Movement now records the exact
crash-impact boundary and both driving consumers insert sign generation there.
Combined native sign/support test proves8 sign fragments then16 crash fragments,
with exact RNG/particle state from that ordered composition, not18 crash then6
sign. Existing five movement/support tests, original two-car20-update sign
capture and typecheck pass. Original caller order was independently decoded;
no full original simultaneous-sign/support capture claimed. Overall43/103.

Item25 targeted complete-chassis captures now exercise both missing outcomes
for all11 original car shapes (22 cases). Synthetic tunnel/history chooses
plane532 with current positive distance and retained negative distance: normal
runtime takes89C3 not-taken and event5/crash1; mode1 takes89B0 bypass and remains
crash-free. Native pose/rotation/crash/body cache match original in both cases;
each branch executes four times. No original sources modified; independent test
copies only. Combined with the two full replay captures, all15 modern exception
sites and their conditional outcomes are exercised. Acceptance reconciliation
against all classified helpers/operand contexts still needs a final audit before
closing25; typecheck passes, overall43/103 unchanged.

Item25 measured branch coverage added for15 actual modern exception sites
(two classified exceptions describe removed legacy-only loops). Fresh checksum-
bound958-frame10Hz Indy and2556-frame20Hz two-car Audi captures match native
including particles/final RNG. Combined captures execute all15 modern sites.
Conditional outcomes still missing in these full captures: mode1 bypass at89B0
taken, and positive-current/negative-previous plane crossing at89C3 not-taken.
Both cadence outcomes, plane-ID mismatch/match, cache-loop exit/continuation,
negative-current and reverse-pass entries exercised. Earlier isolated threshold
tests are separate evidence; these two full-context outcomes need targeted
captures before closing25. Overall43/103 unchanged.

Item25 terrain regressions refreshed after sign integration: all11 original
car resources pass continuous40-update tunnel entrance/interior/exit comparison
(440 updates, rows12/13/14), crash-free with exact pose/rotation/body caches.
Controlled Marco divider passage also passes46 recorded-control updates with
exact engine/grip/suspension/wheels/body cache and unchanged sign markers.
Original sources unchanged; diagnostic tracks/state remain isolated test copies.
Broader exceptional chassis acceptance remains open; overall43/103 unchanged.

Item25 controlled full race-loop sign-hit captures pass for20 updates each,
single-player and active original AUDI opponent. Both captures mark first sign
[1,0]; native matches all compared player/opponent physics, body caches, markers,
active debris and final RNG; no false finish. Explicit test-only placement
translates player pose, previous pose, wheels and body cache consistently after
race initialization, bound to capture/replay hashes. Native placement must occur
after introduction; corrected diagnostic setup reset, not game behavior.
Original replay/track/resource bytes preserved; test copies use original20-control
prefix. These are complete update-loop probes, not completed competitive races.
Exceptional-terrain acceptance still open; overall43/103 unchanged.

Item25 paired sign callers now execute the original indexed collision block
twice in each of50 cases, changing the second caller's yaw. Native production
signsAfterImpact handoff matches the original shared marker; second contact emits
no event, consumes no RNG and leaves fragment speeds unchanged. Input marker
arrays preserved. This covers the actual shared-marker helper used between
player/opponent, not an entire two-car original race with a sign hit. Complete
race/exceptional terrain evidence still required; overall43/103 unchanged.

Item25 direct original/native sign-hit chassis comparison now passes on the
actual OPPAUDI track's first allocated sign at18060/375/15538 with AUDI tuning.
An exclusive synthetic test copy disables only its opponent; source replay,
track and inputs unchanged. One-step original/native markers are[1,0] and native
event owner2. Twenty consecutive original player-physics updates match pose,
engine/grip,suspension,wheels,body cache and final markers; final event absent,
so the broken sign is not hit again. Full race loop not claimed by this probe.
Checkpoint restore tests explicitly corrupt and restore all48 marker bytes at
first/intermediate/final slots at10/20Hz; all pass. Typecheck passes. Two-car
sign-hit ordering and full race/exceptional-terrain acceptance remain open.
Overall43/103 unchanged.

Item25 integrated movement/debris consumer test passes: modern flat controlled
contact emits sign owner2 and eight live fragments, no crash or pose rejection;
already-broken sign emits nothing, checkpoint replay is deterministic, caller
marker input remains unchanged, and legacy engine emits no new sign event.
All five start-support/sign tests pass and typecheck passes. This tests movement
plus production debris consumption, not a complete original/native sign-hit race;
checkpoint marker persistence/two-car hit ordering still require direct coverage.
Overall43/103 unchanged.

Item25 mixed-car debris divergence traced to unequal initial RNG, not accepted
as a production fix: original isolated executable starts with six zero bytes;
native retained startup has128/204/243/215/89/212. Added original capture evidence
with initial/final RNG and SHA256 links to replay/capture. Comparator optionally
matches that captured state in isolated memory only; production startup/RNG and
all replay bytes unchanged. Fresh2556-frame mixed capture now matches every
compared physics, sign marker and active debris field, preserving no-finish result.
Final RNG comparison is also required. Actual sign-hit full-race coverage and
exceptional-terrain acceptance remain open; overall43/103 unchanged.

Item25 modern-only indexed-sign wiring implemented in movement, player/opponent
debris generation and canonical broken-sign checkpoint memory. Two-car ordering
passes player markers to the opponent without mutating caller input; stationary
early return clears transient sign events. Legacy collision behavior unchanged.
Typecheck and50-case original sign composition test pass. Strengthened full-frame
oracle now checks48 sign markers plus active particle fields. OPPAUDI2556 and
OPPFAST1471 pass including those fields. Mixed Audi/Indy still has exact physics
but newly exposed debris divergence begins at crashframe185; it now correctly
FAILS acceptance. Crash debris/RNG provenance needs investigation, not suppression
of the new comparator. Overall43/103, no live update or stored-data mutation.

Item25 complete original indexed-sign caller exercised with real overlap and
debris helpers in50 isolated cases: heights/offsets plus intact/already-broken
markers. One actual hit marks the sign and creates eight fragments owned by2.
Native overlap/debris composition matches all50 marker/activity/owner/speed
results; original sign bounds are5/40/5,radius10. Runtime wiring is NOT accepted:
the reconstructed movement path currently exposes landmark/post crashes but
does not yet route this indexed sign-hit marker/particle event. Integration and
original/native hit-capture regression remain required. Overall43/103 unchanged.

Item25 allocation-content oracle added at tools/check_ms91_collision_allocation.ts.
Fresh original/native analysis comparison passes QA91R001, OPPAUDI, OPPFAST,
and bundled original DEFAULT:3600 tile entries and7 indexed sign centres match;
all source replays unchanged. The indexed caller marks struck signs and generates
particles (owner index+2), not the landmark/tree or start-support crash path.
Runtime sign-hit/marker/particle closure remains separate from allocation parity.
No acceptance count change:43/103,60 remaining,41.7%.

Item25 collision allocation rechecked on the decorated OPPAUDI original replay:
the original analysis populates two active tile indices and two centres
[[18060,375,15538],[19084,375,9394]], with processed markers initially zero.
Therefore an empty table on QA91R001 alone does not establish missing rendering
initialization. The original analysis does populate this table without rendering
on OPPAUDI. Native allocation-content comparison and exceptional collision
captures remain open; no additional acceptance item completed. Overall43/103.

Item25 retained operand inventory complete:380 unique pairs/833 sites, zero
pending candidates after full41-byte ground-to-air counter context and explicit
two-car gate comparison. Counter correctly counts player ground-to-air transitions,
not general grounded frames; comparator label corrected. All five fresh complete
update captures8327 frames still match including counter, suspension/wheels and
body caches; four finish, mixed crash correctly does not. Typecheck passes.
Resource pointer-content closure and exceptional terrain captures remain before
closing item25; layout reconciliation is not claimed as formal semantic proof.
Overall43/103 unchanged.

Item25 whole indexed-object collision caller compared138 bytes each version,
explicit table/resource pointers, processed-object markers, local displacements,
unchanged dimension bank and previously audited overlap helper. Five remaining
operand contexts accounted;2 remain. Allocation pointer-content evidence stays
separate, not implied by same instruction sequence. Grounded counter added to
full replay comparator;796-frame original/native QA still exact.
Overall43/103 unchanged.

Item25 sound-dispatch caller entire old41/new37-byte blocks asserted. Same
zero flag gate, selected-car conditional handle argument, relocated car sound
flag byte and audited dispatch helper; removed reload proved separately.
Three more scalar operand contexts reconciled;7 remain. Overall43/103 unchanged.

Item25 fall increment bank independently byte-checked:both original data images
retain four signed words21/21/15/15; identical indexed load moves5AA→608.
One more operand context closed,10 candidates remain. This complements the
separate10Hz repeated update classification; no new physics change inferred.
Overall43/103 unchanged.

Item25 final BX indexed-stack operand traced in both originals to exact
MOV BX,DI / SHL BX,1 / ADD BX,BP before PUSH; incoming bypasses rejected.
This accounts for14→16 local displacement independently of register naming.
Remaining11 operand contexts need resolution. Overall43/103 unchanged.

Item25 selector mode/flag and plane-pointer globals linked to completed selector
and distance audits. Indexed landmark table displacements linked to full helper
comparison; two-height bank initial bytes independently identical. Only whole
otherwise unchanged operand pairs accepted. Remaining contexts explicit;
overall43/103 unchanged.

Item25 indirect DI stack aliases now checked by register-definition trace in
both originals, requiring actual DI+=BP, no intervening calls/base writes and
no incoming branch bypass. Only exact+2 displacement pairs classified; failed
traces remain pending rather than inferred from DI's register name.
Overall43/103 unchanged.

Item25 contiguous11-word scratch state bank reconciled with explicit relocation
and byte-identical initial contents. DI car-field aliases accepted only inside
88DE..891C where actual MOV DI,BX and register preservation were independently
proved, not for arbitrary DI operands. Otherwise operations/registers unchanged;
remaining candidates explicit. Overall43/103 unchanged.

Item25 collision/landmark scalar globals linked to explicit wall-entry,
selector, plane-distance and landmark helper layouts. Only complete otherwise
identical operands match this map; remaining unrelated fields remain pending.
Fresh complete helper reconciliation passes, including25 targets and underlying
body comparisons. Overall43/103 unchanged.

Item25 retained car-field offsets linked to original184→208-byte record layout:
only BX/BX+DI fields in old140..183 range move+24 after body cache insertion,
otherwise operands/registers identical. Existing full-state codec and original
captures independently compare affected fields. QA20Hz796-frame complete
comparison rerun passes. Remaining globals/tuning/mixed register candidates
stay explicit; overall43/103 unchanged.

Item25 stack-local relocation inventory linked to exact prologue growth482→484
bytes. Only otherwise identical operands with two-byte BP/indexed-BP displacement
and frame bounds are accounted; no register/field normalization. This verifies
address layout, not local content-role equivalence. Remaining mixed operand
candidates stay explicit. Overall43/103 unchanged.

Item25 retained-call operands reconciled against explicit23-target old/new map,
linked to completed helper audits initem24. All aligned call pairs accounted;
argument/local/global context remains separate. Pose-field and call mappings
now reduce remaining unique operand candidates329→306. This is not full
semantic equivalence or an additional completed release gate. Overall43/103.

Item25 retained-context operand inventory added:380 unique old/new operand
pairs across833 sites, complementing exception classification. Explicit pose/
state field map links initial/final commit audits rather than accepting address
normalization. Other field/local/call operands remain contextual candidates;
this inventory does not claim full semantic equivalence. Overall43/103.

Item25 mixed Audi/Indy isolated synthetic probe passes2556 full original/native
updates with zero compared player/opponent/physics/cache differences. Original
does not finish, and native correctly also has no finish/result time; this is
not reported as a completed race. Source OPPAUDI untouched; only exclusive test
copy changes opponent car. Probe generator Buffer.slice alias bug corrected to
independent copies (disk source was never written). Full comparison coverage
8327 frames across five recordings/probes. Overall43/103 unchanged.

Item25 Audi opponent capture passes2556 full updates/finish2536, including both
cars' suspension/wheel caches. Fresh full-frame coverage5771 across four races.
Original harness hardened for next mixed-car checks:opponent SIMD validated
against replay header, optional actual opponent-car resource, independent
per-car resistance tables within allocated pre-header arena, source preservation.
Existing same-car OPPFAST reference recaptured with separated tables.
Overall43/103 unchanged; mixed-car/collision acceptance still pending.

Item25 fresh direct original OPPFAST20Hz opponent capture passes1471 complete
update frames and finish1451. Original route preparation uses actual OPP1.PRE;
player/opponent both Indy match configuration. Comparator strengthened to check
four suspension banks and all12 wheel-position words for opponent as well;
zero physics/body-cache/route/player/opponent differences. Sources unchanged.
Total fresh complete-frame comparisons3215 across three recordings. Exceptional
terrain/collision and mixed-car opponent cases remain open. Overall43/103.

Item25 direct original complete race-loop captures pass:Countach QA20Hz796
frames/finish776, packaged Indy Vancouver10Hz958 frames/finish948. Both execute
original race initialization and full update_gamestate; native comparison has
zero position/physics/cache differences. Comparator strengthened to independently
check all four retained suspension banks and12 wheel-position words everyframe;
both captures still pass.1744 full update frames total, sources unchanged.
Coverage does not yet prove exceptional terrain/collision full-race cases or
opponent sessions. Overall43/103 unchanged.

Item25 corrected stale direct combined harness:initial original body cache now
supplied and compared on every sequential frame, matching production requirement.
Countach QA91R001 full796 recorded-control sequence passes exact position,
rotation, engine, grip, suspension, wheels and body cache at every step from
the explicit controlled initial position. All33 combined driving cases/all11
cars also pass with corrected harness; sources unchanged, typecheck passes.
These are controlled chassis captures, not original replay-start/finish or
full race-loop acceptance. Overall43/103 unchanged.

Item23 exceptional branch classification complete:17 explicit exceptions,
0 pending destinations/unpaired entries. Final sound merge retains proven car
pointer; reverse-pass planeID>=4 exit enters snapshot/cache selector, positive
distance exit enters cache commit.210 retained candidate edges still require
whole-chassis contextual acceptance under item25; no full branch semantic claim.
Verified total43/103,60 remaining,41.7%.

Item23 three plane-crossing destinations reconciled against exact complete
old/new predicate blocks:legacy +/-6 thresholds become modern0; noncrash exits
now enter explicit31-byte current-wheel cache commit before increment. This is
versioned behavior, not old/new target equivalence.676 native guard regressions
pass. Fourteen exceptions classified,3 destination candidates remain.
Overall42/103 unchanged.

Item23 all unpaired branches classified:three exact old signed32 SAR6 loops
replace with committed wheel-cache reads; modern plane-ID mismatch and mode1
guards exit to cache commit. Old first-loop/new plane guard automatic pairing
explicitly identified as independent operations, not equivalent branches.
Eleven exceptions classified,6 destination candidates remain,0 unpaired entries.
Overall42/103 unchanged.

Item23 two more destinations reconciled:modern8142 reaches point-X conversion
without old duplicate pointer reload (taken source explicitly sets/retains BX);
modern84DE enters hoisted6*wheel cache destination setup before three retained
signed32 SAR6 coordinates. Complete cache bodies hash-pinned to existing audit.
Seven exceptions classified,7 destination candidates and3 unpaired entries
remain. Overall42/103 unchanged.

Item23 two more exceptions reconciled:modern7635 jump reaches retained car-field
test after deleted BX reload (source block demonstrably retains car pointer);
new7DB2 JNE skips explicitly decoded second signed wheel-position update unless
cadence10Hz, joining common coordinate conversion. Five exceptions classified;
remaining9 destination candidates and3 unpaired entries. Overall42/103 unchanged.

Item23 three cadence branch exceptions explicitly reconciled: old jump into
constant divisor now enters modern10Hz/20Hz dispatch; new JNE selects fallback
15360, new JMP joins at zero-highword after10Hz divisor7680. Exact complete
dispatch instructions asserted. Remaining10 destination candidates and4
unpaired branch entries;210 mapped agreements still require semantic context.
Overall42/103,61 remaining,40.8% unchanged.

Item23 whole-chassis branch inventory added:223 legacy/225 modern branches,
all targets internal and decoded.210 candidate destination mappings agree;
11 mapped-site destinations and2 legacy/4 modern unpaired branches require
explicit contextual reconciliation. Candidate agreement is not semantic proof.
Current verified total remains42/103,61 remaining,40.8%.

Current verified total:43/103 complete,60 remaining,41.7%.
Item24 helper difference classification complete:25 direct dependency targets,
85 callsites and transitive math/geometry/state helpers reconciled. Audio request,
allocation, lifecycle, initializer and stop boundaries classified; selected
driver export30 is the explicit terminal sound-category interface. This closes
classification only, not complete chassis branch/race acceptance (items23/25)
or sound driver/output acceptance (sound category still open). New code fixes
and original/native initializer/all-car regressions are recorded below.

Item24 active all-car audio regressions pass after extension integration:
PC15 4400 callbacks, TD15 8800, AdLib/MT32 17600 across all11 cars and both
core versions (TD/AdLib/MT32 also both retained driver generations). Total30800
active engine/crash callbacks in154 allocated sessions. MT32 uses an explicit
synthetic PIT/ready host; an initial ready-only host correctly rejected modern
PIT delay, not counted passed. Tests verify state/control integration only,
not hardware timing, audible output or complete race trajectory acceptance.
Replay bytes preserved. Overall41/103 unchanged.

Item24 all four allocated adapters pass impact/effect-tick/stop/restart in both
core engines, with canonical neighbors preserved. Tick fixture explicitly has
no active engine voice; it verifies effect wait progression, not engine-note or
hardware playback. Real PC15 allocated startup/replay reload regression also
passes both engine combinations and retains boot driver, replay bytes unchanged.
Overall41/103 unchanged; audible/backend full-race acceptance remains open.

Item24 allocated adapter integration now passes AdLib/Tandy/MT32 impact, stop
and restart operations in both core versions, using actual read/resource/start/
bridge/write paths. Pointer boundary rules and all neighboring canonical timer
records preserved; six backend/core combinations. Hardware playback and PC15
allocated integration not included in this fixture, remain separate checks.
Overall41/103 unchanged.

Item24 extended timer bridge connected to all four allocated sound adapters;
each allocated owner retains96 extension bytes while canonical memory writes
remain72-byte records. Read/operate/write, stop and tick commits use the bridge.
Note/voice/completion helpers accept full76-byte records; four effect-stop paths
clear added words. Tests pass extension lifetime, failed-commit preservation,
new-owner isolation, legacy passthrough, pointers and existing sample/memory
regressions. Full backend integration QA remains open. Overall41/103 unchanged.

Item24 lossless modern timer codec added:24 canonical72-byte records plus96
owner-held extension bytes roundtrip all76-byte records without expanding the
occupied canonical memory bank. Tests cover all8 effect-start resets, unchanged
neighbor/source records and malformed lengths. Codec not yet connected to
allocated race adapters; no full extended-state integration claim.
Overall41/103 unchanged.

Item24 pure effect-start supports complete76-byte MS91 records and clears both
additional words, while preserving legacy72-byte validation and canonical72-
byte adapters. All336 original/native comparisons now match full72/76-byte
records, not truncated shared fields. Extended source/neighbor preservation,
mixed-stride rejection and legacy rejection tested;131072 pointer cases,
typecheck and sample-host regression pass. Allocated race adapters still use
canonical72-byte tables; full extended-state integration remains open.
Overall41/103 unchanged.

Item24 original/native initializer corpus expanded to336 complete cases across
all8 effect slots, both versions and all21 pointer boundary combinations. Every
retained72-byte timer record matches; original modern additional4 bytes clear.
Original captures additionally prove neighboring timer records unchanged for
everycase. Source images preserved; silent execution. Extra-word state design
and full initializer classification remain unaccepted. Overall41/103 unchanged.

Item24 original executable initializer boundary oracle:42 isolated complete
calls across both versions, three pointer segments and seven boundary offsets
pass. Native effect-start matches all72 retained timer bytes for every captured
case; actual modern executable clears new words48/4A. Captures preserve source
images and execute no sound device. Extra-word state representation and broader
initializer/driver acceptance remain open. Overall41/103 unchanged.

Item24 entire364-byte/132-instruction original voice-stop comparison passes
explicit relocated state fields, timer stride and branch mappings. Both invoke
selected driver export30; actual device export acceptance remains sound scope.
Initializer retained timer-field writes also match; modern additionally clears
per-slot notes/markers and new timer words48/4A. Extra-word representation and
remaining initializer loop/pointer regions still need reconciliation.
Overall41/103 unchanged.

Item24 core sound-generation propagation corrected:allocated sound factory now
receives session.physicsEngine independently of sound-driver generation. All
four backends retain effectEngine through state snapshots; all six effect-start
callers prefer this explicit core generation. Manual, replay and demo factories
forward it. Opposite core/driver impact-start integration cases pass both ways,
driver generation unchanged;131072 pointer cases and five memory regressions
pass. Classification/complete race acceptance remains open. Overall41/103.

Item24 effect-start remaining allocator semantics routed:modern loaded-resource
validation before voice selection, modern unsigned instrument counts0..255;
legacy default preserves previous count rejection and ordering. Exhaustive
pointer suite plus all256 count values, invalid-resource ordering and truncated
resource rejection pass. Typecheck and both-generation sample-host regression
pass. This does not prove complete downstream initialization/voice-stop or
close item24. Overall41/103 unchanged.

Item24 sound-pointer gap fixed:effect-start explicitly uses MS91 offset-only+4,
legacy combined ADD/ADC retained when engine absent orms-1990. All six crash,
impact and skid callers forward physicsEngine. Exhaustive131072 actual starts
pass every offset for both versions, plus segment0/8000/FFFF boundaries, absent
version legacy identity and caller-state preservation. This does not close
remaining initializer difference classification or driver acceptance.
Overall41/103 unchanged.

Item24 pointer-helper correction:1436 is a complete26-byte plain far-pointer
load, not normalization. Exact11 instructions verified, no downstream calls.
Initializer then adds4 to offset without segment carry; legacy inline sequence
adds4 with carry. Native shared effect-start currently uses combined32-bit+4,
so modern boundary behavior needs explicit engine routing and regression tests.
This newly identified implementation gap is not accepted. Overall41/103.

Item24 complete modern deeper audio scopes established:260-byte/92-instruction
playback initializer and364-byte/132-instruction voice stop, all internal
branches and complete returns. Initializer calls far-pointer normalization1436
twice; stop calls selected driver's export30 through two explicit local far
pointers. Legacy comparisons and actual driver acceptance remain separate.
Overall41/103 unchanged.

Item24 complete76-byte/32-instruction slot-stop comparison passes with explicit
timer stride, field and call relocations. Both restrict handles to16..23, clear
the timer resource pointer and call voice-stop then zero-resource initialization.
Versioned PC15 effect-end regression also passes both generations. Remaining
audio targets explicitly2F65:1332 (voice stop) and2E0E:CF8 (initializer); do not
infer downstream acceptance from wrapper equivalence. Overall41/103 unchanged.

Item24 engine-voice stop helper complete34-byte/13-instruction comparison passes,
no transitive calls/branches. Both versions set remaining duration to one, then
let later sound callbacks release it; native crash runtime performs that write.
Allocator's two deeper targets remain explicit: slot stop586 and playback CF8.
Overall41/103 unchanged; downstream driver/output acceptance not inferred.

Item24 allocator difference classification complete: full306 legacy/304 modern
byte partitions compared, including guards, selection, validated pointer reload,
startup and returns. Three changes: timer stride72→76, loaded-header validation
moved before allocation/victim stop, instrument count signed→unsigned byte.
Playback initializer and stop bodies still require sound evidence; this does
not claim allocator runtime compatibility or close item24. Overall41/103.

Item24 crash lifecycle wrapper complete54-byte/21-instruction comparison passes
under explicit state and stop-call relocation. Modern effect allocator complete
304-byte/125-instruction body has two returns and internal branches; calls stop
586 and playback CF8. Legacy allocator comparison still pending, not accepted
from decoding alone. Overall41/103 unchanged.

Item24 all three chassis audio request wrappers compared:188 bytes per version,
82 instructions, explicit state/call relocations and complete returns. Request
behavior unchanged. Their downstream targets are now explicit: effect allocator
2E0E:456 and crash lifecycle18FD:3C5. This is not audible playback acceptance;
those two targets still need linked sound-category evidence. Overall41/103.

Item24 direct chassis dependency registry reconciled against freshly executed
structural audits:25 of25 targets across85 callsites now linked. Complete contact
scope covers388 legacy/368 modern bytes, both returns and nine calls to four
previously audited math helpers. Exact changed reduction/saturation blocks
pinned. This is structural linkage, not complete semantic or full-race acceptance;
transitive audio callback closure remains separate. Overall41/103 unchanged.

Item24 whole-selector difference classification reconciled:63 shape groups,
365 mapped nonbranch operand changes,41 callsites,555 retained branch mappings.
One load and two jump cross-alignment exceptions have independent exact-region
evidence (guard/cache and shared crossroads),explicitly not equivalent pairs.
No pending candidates remain in this selector inventory. Classification is not
full race acceptance; complete chassis dependency registry reconciliation still
required before closing item24. Overall41/103 unchanged.

Item24 retained branch-destination reconciliation now agrees on555 candidate
edges with dispatch,explicit collapsed signed-abs/helper/redundant width entries
and padding destinations accounted for. Two unmatched candidate pairs cross
independent code roles (old bounds-exit/new abs merge; old crossroadX merge/new
crossroadZ comparison); remain separate rather than accepting target equality.
Alignment-map agreement still requires validated surrounding semantic context.
Overall41/103 unchanged.

Item24 all selector retained call sites reconciled against explicit eight-target
map: trig, signed fixedpoint product,hypot,atan,long arithmetic and local slope
mapping. Complete287-byte local mapping helper oldFCC:3B8E→new105C:38C2 is
byte-identical, complementing65536 original/native inputs. Removed signed-abs
call classified separately. Branch destination reconciliation remains required;
overall41/103 unchanged.

Item24 selector operand map reconciles365 nonbranch differences with explicit
globals, six-byte relocated old local slots, descriptor base and unchanged296-
byte geometry table bank (DS2E00→2E20). One cross-aligned candidate remains:
old C48 physics-ID load paired to new375 local-X load,which are independent
operations already covered by dispatch/cache regions. Do not label those loads
semantically equivalent. Branch/call destination correspondence still required.
Overall41/103 unchanged.

Item24 last three selector shape groups classified. Removed BX reloads retain
point pointer from EDA/1022; register aliases/BP/argument writes/calls checked,
no external branch or dispatch enters after definition before use. Deleted old
second130-width test was redundant after primary absX<130 gate and unchanged X;
modern primary150 gate then assigns road surface directly. All63 instruction-
shape groups now classified. Operand/field and complete branch correspondence
still require reconciliation; this alone does not close item24. Overall41/103.

Item24 two curve groups classified: old signed-absX/CMP120/JGE-radius/JMP-road
becomes cached CMP120/JL-road with equivalent radius fallthrough. Second curve
JGE-skip/JMP-large-radius becomes JL-large-radius; preceding comparison exact,
large-radius target already paired. Pending shape groups5→3; remaining two
pointer reload removals and deleted twisted-pipe repeated width path need audit.
Overall41/103 unchanged.

Item24 three split straight/crossroads groups reunited with exact old26-operation
nonpadding block. Negative-X route reaches shared NEGAX then CMP120; crossroads
tests absX first then absZ through same comparison/surface-write exit. New cached
comparison paths already checked; both retain strict less-than120 and road
surface only on accepted axes. Pending shape groups8→5; overall41/103 unchanged.

Item24 rotation branch classified: old CMP256/JNE-skip/JMP-rotation is equivalent
to modern CMP256/JE-rotation. Complete116-byte/43-instruction coordinate rotation
block matches under explicit branch destination map,including common exit.
No rotation-rule change. Pending selector shape groups9→8; overall41/103.

Item24 four cross-aligned diff groups classified by independent exact regions:
modern signed absolute-Z cache paths confirmed; old/new physics-range guard
retains maximum74, same unsigned comparison and identical index/double/table
dispatch sequence under explicit table/exit relocation. Sequence matcher had
aligned unrelated guard operations with new abs setup; this is not a behavior
change. Pending shape groups13→9. Overall41/103 unchanged.

Item24 five more shape groups classified: complete21-byte old signed-abs helper
checked (including wrapped negation), its270-threshold call replaced by retained
cache, and two full seven-instruction abs/120 comparisons split across diff
groups reunited against exact source boundaries. All thresholds unchanged.
Pending selector shape groups18→13; overall41/103 unchanged. This does not close
remaining operand correspondence or the whole helper item.

Item24 expanded pipe-width-boundary catalogue passes all19 terrains:191862
full-selector probes (10098 perterrain), comparing plane/surface/wall,origin,
bounds and198 landmark outputs perterrain. No skipped primary IDs; replay
unchanged. Full TypeScript noEmit check also passes. Whole-selector structural
inventory still has18 pending shape groups after cached-abs/padding/width
classification; this does not close all operand/branch correspondence.
Overall41/103 unchanged.

Item24 actual selector change classified: twisted-pipe width130→150, pinned
old1A5D CMP82→new1018 cached CMP96. Existing versioned twistedPipeSelection
already implements this, preserving legacy threshold. Catalogue now adds exact
signed129/130/149/150 boundaries; flat-terrain10098 complete-selector probes
pass origin/bounds/plane/surface/wall. New expected count enforced. Other terrains
with expanded boundary set not yet rerun. Overall41/103 unchanged.

Item24 repeated absolute-coordinate optimization classifier added: requires exact
old seven-instruction signed branch/negate/merge/CMP pattern, both branch targets
point to the expected positive load/comparison, and modern cached CMP retains
the identical threshold. Only exact matches classified; truncated or ambiguous
diff groups remain pending. This batches repeated optimizations without treating
numeric normalization as semantic evidence. Overall41/103 unchanged.

Item24 divider optimization bounded-behavior sweep passes26637 cases: every
localX from-1024 through1024 and13 previous-X positions at/around divider and
road boundaries. Both original versions and native agree on planeGroup,surface,
wall and upperlimit; combined tunnel/sweep run28366 passes. This covers valid
local geometry range,not arbitrary signed-word extrema or full crash response.
Source image files unchanged. No runtime patch needed. Overall41/103 unchanged.

Item24 exact dispatch batch now incorporates verified math-call relocations,
NOP-only padding removal and explicit shared-threshold/surface exits. It
reproduces the earlier radius comparisons for types2/3 and entry blocks4/5.
Other entry blocks remain pending rather than auto-equating optimized branches.
Divider inspection confirms old repeated absolute-coordinate tests versus
modern cached tests alter block length,so naive equal-length pairing is rejected.
Existing3620 original/native tunnel/divider runtime evidence stays separate.
Overall41/103 unchanged; no duplicate completion claimed.

Item24 shared large/small curve-radius regions compared completely: both retain
same coordinate additions,hypot calls, signed comparisons and thresholds
1416/1656 and392/632. Exact nonpadding instructions match with verifiedhypot
relocation and explicit local/common-exit/upper-threshold branch maps. Different
jump widths andNOP padding are not physics changes. Straight-entry absolute
tests remain separately classified. Overall41/103 unchanged.

Item24 dispatch-bounded exact comparator added. Types4/5 entry blocks match
10/3 instructions under explicit global relocations and mapped dispatch/local
branch destinations. Threshold immediates retained; no blanket numeric stripping
used for acceptance. These blocks share downstream curve code,which remains
separate; do not call entire reachable branches closed from entry blocks alone.
Ambiguous/nonmatching blocks stay pending. Overall41/103 unchanged.

Item24 straight/crossroad selection optimization identified: modern computes
signed absolute localX/localZ before dispatch, then tests retainedBP-32/BP-2E
against120 instead of repeating old negative-coordinate branches. Exact new
absolute-X branches,cache store,straight test,crossroad OR path and shared surface
write/exit asserted. Valid loaded-track/catalogue probes already compare behavior.
Signed-word extrema remain bounded original behavior,not general JS abs proof.
Overall41/103 unchanged; remaining selector branches still open.

Item24 physics dispatch pairing established for75 types as39 unique old/new
entry pairs; alias sharing is unchanged for every type pair. Start-line branch0
complete41-byte block matches under explicit mode9307→9595 and plane9834→9ACE
globals; thresholds-380/-300 and special groups131/132 unchanged. This anchors
branch comparison to table entries instead of ambiguous repetitive sequence
alignment. Remaining branch classifications stay open. Overall41/103 unchanged.

Item24 whole-selector difference inventory now retains raw operands for every
candidate alignment:63 instruction-shape groups and965 operand pairs. These are
unclassified diff candidates,not new release checks or verified behavioral
changes. Repetitive branch bodies can misalign in sequence matching; next compare
by the verified75-entry physics dispatch table rather than accepting candidate
group correspondence. Numeric normalization explicitly is not semantic proof.
Overall41/103 unchanged.

Item24 old whole-selector boundary now verified FCC:8DE..246E (7056 bytes),
2379 codeinstructions, two75/12-entry jump tables separated. All644 direct
branch targets and87 table entries align. New selector has6468 bytes and2126
codeinstructions; fewer bytes alone does not imply equivalent behavior. Paired
whole-selector difference classification remains next,using established exact
boundaries rather than guessed prefix matches. Overall41/103 unchanged.

Verification-tool quality pass: full TypeScript noEmit check passes after fixing
three implicit-any errors in new multi-tile fixture tool with explicit TrackObject
typing. Both structural audits rerun:85/85 chassis changed groups classified,
10 paired helper scopes and3 geometry scopes checked; original images unchanged.
No release item increment for tooling checks. Remaining whole-selector paired
difference classification/callback reconciliation stays open. Overall41/103.

Item24 particle-generation rule differences pinned to actual opcode sequences:
modern6*random with arithmetic quarter shift replaces legacy wrapped24*random
then shifted signed-magnitude truncation; vertical signed product also changes
to arithmetic quarter shift. Native lib/game/particles.ts explicitly routes
both differences; existing400 original/native cases cover retained slots/RNG.
Complete old392-byte and modern354-byte boundaries retained; pointer reload
optimizations distinct from changed arithmetic. Overall41/103 unchanged.

Item24 original crash-handler timer changes now explicitly pinned: two legacy
80-tick crash assignments become4*framesPerSecond, and legacy20-tick finish
delay loads framesPerSecond. Complete original handler boundaries identified;
exact changed opcode sequences asserted, complementing2000 original/native
cases at10/20Hz. Modern preserves delay duration at either cadence rather than
assuming20Hz. Pointer reload/padding differences remain distinct from timer
rules; no arbitrary timing correction introduced. Overall41/103 unchanged.

Item24 complete plane-movement legacyB55C→modernBBD6 comparison passes402 bytes/
163 instructions. All relative branches/operands match under explicit state,
cache,matrix-bank and verified math-call relocations. Near matrix wrapper mapped
by actual relative target rather than disassembler signed-address formatting.
No movement-rule change found in this helper; earlier536-plane original/native
reprojection evidence remains separate. Overall41/103 unchanged.

Item24 complete paired distance and normal-product bodies compared explicitly:
legacyB6EE→modernBD68 (140 bytes) and B77A→BDF4 (122 bytes). Exact instructions/
relative branches match under identified plane-cache/bank/origin fields and
verified long-arithmetic call relocations. This closes their version-difference
classification, complementing1072 original/native distance results; not full
chassis acceptance. Overall41/103 unchanged.

Item24 complete geometry helper dependency scopes pinned: plane movement402
bytes/163 instructions, distance140/50, normal product122/62. Every direct
branch internal; exact call sets resolve to verified transform/transpose/atan/
Yrotation/matrixwrapper and long arithmetic, with distance calling normal product.
Independent-seed initialized-matrix reprojection matches all536 original planes.
Corpus:/private/tmp/ms91-plane-motion-20261011-seed7.json. Remaining audit closure
must reconcile all direct targets and callback boundaries; overall41/103.

Item24 particle generator complete354-byte/129-instruction body decoded;
allbranches internal. Only dependencies are verified longmultiply/divide and
78-byte random helper, now fully decoded with internal branches and no callees.
Refreshed400 actual-original/native generators pass including real RNG/math,
all24 particle slots and retained random state. Corpus:
/private/tmp/ms91-particles-20261011-refresh4.json. All400 differ from legacy
generation as expected by version routing. Rendering acceptance remains separate.
Overall41/103 unchanged.

Item24 complete modern crash handler scope pinned BA32..BBD6:420 bytes,
148 instructions, both return paths included, allbranches internal. Only calls
particle generatorBE6E and two audio requests18FD:74C; no hidden additional
callees. Existing2000 original/native state/request corpus rechecked successfully,
including400 event5 cases. Request parity does not verify rendered particles or
audible sound; those callbacks remain explicit separate scopes. Overall41/103.

Item24 complete overlap helper legacyAE4A→modernB50E compared through next
function boundary (876 bytes,352 instructions), not first early return. Every
opcode/relative branch matches under explicit two field relocations and verified
length/combined-rotation/vector-transform calls. All branches internal; only
those verified math callees present. Existing1000 paired/native rotated-car
cases provide runtime evidence separately. Field initialization scope remains
explicit; no full chassis closure inferred. Overall41/103 unchanged.

Item24 collision-sound dispatcher legacyAA92→modernB178 complete46-byte body
matches under explicit sound-enabled flag A446→A6DC and two callback entry
relocations7CE→7CC,792→790. Flag masks10/20, arguments, cleanup and internal
branches unchanged. Callback semantics and browser sound acceptance remain
separate audio scopes. Direct X-rotation target2DF4:6 was already covered by
full paired85-byte axis helper audit; do not duplicate as new release completion.
Overall41/103 unchanged.

Item24 landmark output comparison now passes198*19=3762 catalogue outputs
across all terrains, plus900 synthetic layout tile outputs containing all44
multi-tile elements/markers. Complete selector geometry still passes in those
runs. Refreshed full original MS90/MS91 two-rotated-car overlap corpus1000 cases
across eleven car resources matches native carsOverlap; corpus
/private/tmp/ms91-paired-overlap-20261011-refresh3.json. This exercises complete
overlap routine, not every exceptional caller or transitive classification.
Overall41/103 unchanged.

Item24 landmark helper runtime oracle connected to loaded original track context.
For198 catalogue elements on terrain6, actual105C:194C output count and every
signed XYZ landmark point match native trackCollisionPoints, including original
hill-height global. Existing5346 surface geometry probes also pass in this run.
Other terrains and proper marker layouts still require this landmark-output
extension; this is not full overlap/collision acceptance. Overall41/103 unchanged.

Item24 helper105C:194C is landmark-boundary builder, not merely surface height.
Complete944-byte/364-instruction body matches legacy1212E under explicit field
and table-pointer relocations; all branches internal and no transitive calls.
All102 bytes of referenced dimension bank match at legacyDS2EB6→modernDS2ED6.
Referenced object/row/terrain globals still require context/runtime verification.
Earlier short-helper description corrected; no first-return truncation used.
Overall41/103 unchanged.

Item24 far-matrix wrapper legacy74A8→modern74E6 fully compared (54 bytes).
Copies nine words from far matrix to stack, restores DS, calls previously
verified vector transform with matching arguments and restores SI/DI/SP/BP.
Every opcode/operand/relative offset matches except explicit verified transform
call relocation. No branches or additional dependencies. Surface helper105C:194C
has an early return plus later code and must not be truncated at first RETF;
its remaining body stays open. Overall41/103 unchanged.

Item24 direct chassis dependency reconciliation identifies25 unique targets.
Two additional complete helper bodies match byte-for-byte: matrix transpose
legacy248A8→modern24E9E (105 bytes, both return paths) and unsigned long divide
legacy2096A→modern20DD2 (97 bytes, RETF8). All bytes decoded, direct branches
internal, no calls/interrupts. Reproducible paired audit assertions added.
Remaining direct targets must still be reconciled; isolated identity does not
prove native runtime or full chassis closure. Overall41/103 unchanged.

Item24 original selection mode flag located at DS9595; explicit zero comparison
in branch0420 controls start-line special planes. Mode1 complete catalogue
passes101574 probes across19 terrains/198 elements, matching plane/surface/wall,
origin and bounds. Mode0 previously passed same corpus. Selection mode is not
the separate runtime-mode body-crossing flag. No live or stored data changes.
Overall41/103 unchanged; whole chassis dependency closure still open.

Item24 synthetic multi-tile geometry passes24300 full-selector probes with all44
primary multi-tile elements and proper253/254/255 marker cells. Compares plane,
surface,wall,origin and bounds; source replay unchanged. Catalogue layout is not
a connected circuit,so original route-analysis rejection is expected and only
geometry entry is exercised. Fixed oracle-loop indentation that produced zero
probes for noncatalogue mode after catalogue extension; now exact5346/24300
expected-count assertion prevents vacuous passes. Earlier preextension loaded
track runs valid; postextension zero-probe attempt is not evidence. Overall41/103.

Item24 catalogue geometry outputs now compared directly: all101574 probes
across19 terrains also match complete three-axis tileOrigin and wallLower/
wallUpper, in addition to plane/surface/wall. No skipped primary entries.
Original global offsets96EC/96F8/9702,9694/9798 used for oracle outputs. Returned
rotation and multi-tile marker layouts/mode variants remain separate; this
does not close the whole transitive audit. Overall41/103 unchanged.

Item24 whole-selector terrain catalogue passes all19 terrain types0..18 with
198 primary element IDs, nine local positions and three heights:101574 probes
including prior flat run,5346 perterrain. Every comparison matches original
planeId,surface,wall; no skipped primary IDs and replay unchanged. This does
not yet compare returned tileOrigin/rotation/wall bounds or complete multi-tile
marker layouts/mode variants; acceptance scope must remain explicit.
Overall41/103 unchanged.

Item24 catalogue failure resolved as test-scope error, not a runtime fix:
extract_static_tables.py defines198 primary route/object entries; subsequent
byte slots include unused physics255 and out-of-table text. Element247 is not
an ordinary primary catalogue element. Primary IDs0..197 pass5346 full selector
comparisons on flat terrain, nine positions and three heights, no skipped IDs.
No runtime/source-table change made. Multi-tile marker layouts and terrain
combinations remain separate scopes. Overall41/103 unchanged.

Item24 flat-terrain element catalogue oracle added, but not passed. Native
selector rejects physics255 IDs (explicitly reported as unused) and then a
physics99 catalogue entry. Harness now preserves exact failing probe context.
Must resolve whether99 is an invalid placement/multi-tile marker or a missing
supported path before acceptance; do not suppress the exception or count this
catalogue green. Source replays untouched. Overall41/103 unchanged.

Item24 whole-selector spatial expansion: nine positions per tile (center,
road-edge offsets+-120/270, corners+-511 and longitudinal edges), three heights.
Original DEFAULT and QA91R001 both pass24300 probes each (48600 total), matching
native planeId/surface/wall. Source replays unchanged. These loaded-track tests
still do not guarantee all element IDs/rotations/terrain/mode combinations.
Overall41/103 unchanged.

Item24 first whole-selector oracle passes2700 loaded QA91R001 track probes:
all900 tile centers at heights0/144/450, previous point16 units behind. Runs
complete original105C:8 with loaded resources/track context and compares native
planeId,surface,wall directly. Replay unchanged. Tools:
check_ms91_full_selection_oracle.ts and --selection-probes extension in original
track harness. This is stronger than bounded branch tests but does not cover
all track elements,edge positions,rotations or mode values. Overall41/103.

Item24 native tunnel/divider selection now directly matches3620 paired original
boundary/random cases (1729 tunnel,1891 divider). JSON oracle exposes actual
surface,planeGroup,wall and upperlimit values; TS compares allfour against native
branches, rather than only comparing the originals to each other. No runtime
fix needed. Tools:check_ms91_selection_branch_oracle.ts and expanded
compare_original_tunnel_selection.py. Whole track selection remains a separate
scope. Overall41/103 unchanged.

Item24 bounded original selection comparison expanded to nine current and prior
height boundaries (-1/0/1,143/144/145,239/240/241). MS90/MS91 tunnel outputs match
1729 cases; divider outputs match1891 cases, including surface,plane,wall and
upper collision limit. Source files unchanged. Initial preservation assertion
incorrectly compared writable emulator memory against the whole image; fixed
to compare source files before/after, then both runs passed. This does not prove
all enclosing track selection branches or full collision response. Overall41/103.

Item24 native slopeRoadMap reconciliation passes all65536 original helper
inputs directly. Oracle returns actual nonzero outputs; TS comparison checks
every pair including implicit zero results. No runtime change needed. Tools:
check_ms91_element_mapping_oracle.ts and check_original_ms91_element_mapping.py.
Enclosing selection behavior and remaining chassis transitive closure are not
proved by this isolated lookup. Overall41/103 unchanged.

Item24 local surface helper105C:38C2 now fully decoded through39E0 (287 bytes),
all direct branches internal and no transitive calls/interrupts. Exhaustive
65536 kind/element byte combinations match the explicit24-entry mapping;
unsupported pairs return0. Original image unchanged. Tool:
check_original_ms91_element_mapping.py. This verifies original helper behavior;
native mapping reconciliation and full selection comparison remain open.
Overall41/103 unchanged.

Item24 surface helper reconciliation: signed fixed-point product modern20E5:1620
and legacy209E:161E have identical complete26-byte bodies, hash-pinned and fully
decoded with no calls/branches/interrupts. Trig, long multiply/divide, length and
atan calls refer to earlier paired structural evidence; local38C2 track-element
mapping remains separately required. No claim of native arithmetic acceptance
or full selection equivalence from byte identity alone. Overall41/103 unchanged.

Item24 surface-selection dependency inventory now partitions6468 bytes into
code and two jump tables (75 and12 entries). All87 table destinations and566
direct branches align with decoded code boundaries. Removing table bytes also
removes spurious calls from the preliminary linear scan. Eight real unique call
targets remain for dependency reconciliation. This is structural evidence only,
not semantic acceptance. Tool:audit_ms91_surface_selection_calls.py. Overall41/103.

Item23 groups58/71 caller differences classified: complete57-byte reverse and
68-byte current selection blocks decoded/hash-pinned. Current selection passes
local current point and retained car point; reverse selection passes copied old
point and current snapshot. Both call105C:8 with4-byte argument cleanup; copy
preserves SI/DI where required. Selected-plane comparison and distance inputs
are explicit. All85 changed groups now classified. This does not close item23:
full branch/path coverage and item24 transitive selection-helper classification
must be reconciled before claiming complete chassis acceptance. Overall41/103.

Item23 group60 classified: complete24-byte modern distance caller hash-pinned,
pushes retained point Z/Y/X then selected plane, uses far-return ABI and8-byte
argument cleanup. Refreshed1072 original plane-distance cases cover all536
shipped planes in cached and uncached paths; native arithmetic matches every
case. Corpus /private/tmp/ms91-plane-distance-20261011-refresh2.json. Ledger
83/85 classified,2 pending (58,71). Selection helper remains open; overall41/103.

Item23 groups57/59 classified together: complete80-byte legacy reconstruction
computes12*wheel and three signed32 SAR6 coordinates. Modern instead copies the
retained three-word point at car+8C+6*wheel. Both blocks hash-pinned; all three
legacy reduction-loop branches checked. This records an intentional changed
source of collision state, not equivalence. Ledger82/85 classified,3 pending
(58,60,71); selection/plane-distance call semantics remain open. Overall41/103.

Item23 group56 classified: modern selected-plane global9ACE is saved in BP-E;
the explicit898E comparison/8991 branch skips crossing checks when the previous
point selects another plane. Native bodyPlaneContact retains this same-plane
condition; full selection helper semantics remain separate. Refreshed moving
PMIN tunnel probes pass9 cases with3 actual collisions, matching cache/pose/
crash/roadSpeed; input replay unchanged. Ledger80/85 classified,5 pending
(57,58,59,60,71). Overall41/103 unchanged; item23 not yet closed.

Item23 group65 classified: exact31-byte modern cache-commit block computes
6*wheel and copies three words from BP-17C to car+8C+6*wheel while preserving SI.
No branches/calls occur within the block. Refreshed original/native PMIN tunnel
comparison passes40 consecutive steps across rows12/13/14, including retained
cache, pose, crash and roadSpeed; source replay unchanged. This is intentional
modern state, not legacy equivalence. Ledger79/85 classified,6 pending (56..60,71).
Overall41/103 unchanged; selection helper and full race acceptance remain open.

Item23 body-cache prerequisite refresh: test_ms91_body_cache_required.ts and
test_ms91_body_cache_codec.ts both pass. Active modern race supplies four cached
points; incomplete direct callers reject before geometry without changing source
memory. Signed codec, sliced-buffer decoding, malformed lengths and independent
previous-position initialization pass. These are prerequisite regressions, not
closure of the seven remaining original-code groups. Overall41/103 unchanged.

Item23 groups72..74 classified: complete car-contact helper bodies decoded,
hash-pinned and internal branch targets checked. Refreshed1000 paired original
cases match native both versions,including681 differing results from versioned
rounding/unsigned low-speed clamp. Modern caller retains selectedcar in DI;
2000 original crash-handler cases confirm DI preservation across allcauses,
bothcars and10/20Hz. Native full state/effect requests still match.
Ledger78/85 classified,7 pending; overall41/103 unchanged. Transitive helper
closure remainsitem24; original arithmetic tests are not full race acceptance.

Item23 groups76..79 classified: three dimension/radius records relocated
from DS592/59A/5A2 to5F0/5F8/600. Entire24-byte bank matches at independently
identified image DS offsets32090/32A90. Values retained:5/40/5/10,
6/121/6/9 and1/10/1/10. Structural audit checks all four MOVAX constants
against explicit pointer map. This classifies data relocation only,not the
surrounding overlap helper. Ledger75/85 classified,10 pending; overall41/103.

Item23 groups66..70 classified:1024 paired original local body-point preparations
match allfour wheel slots and signed height/coordinate inputs. Modern computes
6*wheel before assigning DI and preserves DI across the copy; BX remains tuning
pointer,so reload removal is redundant. SI/SP preserved,local point matches
independently calculated X/(height<<6)/Z. Both bounded blocks hash-pinned.
Also refreshed PMIN complete original/native body-collision integration: eight
roll poses, five collision cases; cache,pose,crash and road speed match.
Input replay unchanged. Ledger71/85 classified,14 pending; overall41/103 open.

Item23 groups61..64 classified: expanded cached-plane guard comparison passes
676 paired original executions including signed extrema, exact+-6 boundaries,
zero crossings and mode flags0/1/2/255. MS90 crashes only across strict+-6;
MS91 crosses strictzero unless runtime mode equals1.180 decisions differ.
Native modern bodyPlaneCrosses passes matching676 cases. Global event5 handler
is intercepted here; full plane selection/cache integration remains separate.
Ledger66/85 classified,19 pending; overall41/103 unchanged,item23 open.

Item23 groups53/55 classified: BX/DI car pointers defined at88DE/88E1
survive the complete status/output branch region before891C. Register aliases,
BP/argument writes and calls checked; every branch target either stays inside,
reaches891C or exits to892A/8F04 without reaching the removed-load anchor.
Ledger62/85 classified,23 pending. Overall41/103 unchanged,item23 open.

Item23 groups51/52 classified: complete260-byte/99-instruction block containing
both four-wheel rotation loops and intervening pitch decision matches exactly
under explicit two-byte stack-bank relocation and verified atan/vector-transform/
X-rotation helper mappings. Every branch destination is checked by relative
position,including loop back edges and boundary exits. No physics change found
in this bounded block. Ledger60/85 classified,25 pending; overall41/103 unchanged.

Item23 group44 classified after full suspension-helper review. All helper
bytes decoded through RETF; no calls/interrupts and every direct branch remains
inside the body. MS90 saves DI and recomputes wheel pointers; MS91 retains SI
more often and removes redundant writes/reloads. Branches retain rc5 decay by4
toward zero, distance suppression, zero-distance128 relaxation, positive192
increment/384 cap/rc4 reset, negative-288/-384 thresholds and height return.
Intentional arithmetic change: wrapped3*distance quarter uses old sign/truncate
sequence versus two modern SARs, already routed by engine in stepSuspension.
Far CALL becomes PUSH CS/near CALL with the same far-return argument layout.
Hashes pin complete reviewed bodies; 2000 full-range original executions
provide complementary native evidence. Ledger58/85 classified,27 pending.
Overall41/103 unchanged; surrounding race/helper24 acceptance still open.

Item23 group44/helper24 suspension coverage extended: original MS90 and MS91
each match native stepSuspension in1000 signed-full-range cases across allfour
wheel slots. Original emulator additionally asserts no other car bytes change,
and both input images remain unchanged. Corpora:
/private/tmp/ms90-suspension-20261011-allwheels-check1.json and
/private/tmp/ms91-suspension-20261011-allwheels-check1.json.
These executions cover the relocated helper's complete return,not just its
entry. Full changed-helper instruction classification remains pending; no
overall acceptance or structural group count increment claimed for this test.

Item23 groups40..43 classified together: modern hoists car+6*wheel address
into DI rather than recomputing BX for every axis. Three signed32-to-word
SAR/RCR reductions remain unchanged. Isolated original-code checker passed
1024 paired executions across all four wheels, three axes, signed boundaries
and deterministic random coordinates; expected results calculated independently.
Source images unchanged. Both complete blocks hash-pinned in structural audit.
Scratch register identity and surrounding race behavior are separate scopes.
Ledger57/85 classified,28 pending; overall41/103 unchanged,item23 remains open.

Item23 group18 classified by exact bounded16-bit instruction audit: wheel
index AL survives modern776A..7789 copy block. Opcode98 is unprefixed CBW
in this16-bit image, preserving AL while sign-extending AH; other instructions
do not write AL/AX/BP. Six-byte copy destination BP-1C6 does not overlap BP-E8.
Original images remain unchanged. Ledger53/85 classified,32 pending.
Overall41/103 unchanged; this is structural evidence,not a full race pass.

Item23 group12 branch merge proven: explicit bounded CFG from modern75F3
through height-response paths reaches7640 only with BX equal immutable BP+6
car argument. Calls conservatively invalidate pointer knowledge until reloaded;
implicit BX/BP writes and direct argument changes checked. This proves deleted
legacy7604 reload redundant at merge,not merely linear-nearest-load reasoning.
Ledger now52/85 classified,33 pending. Overall41/103 unchanged,item23 open.

Item23 groups22/23 pointer pairs classified: both BX origin-buffer pointer and
DI proposed-buffer pointer independently retain defining modern782B/782F loads
through783D/7849 anchors. Register-alias/source-slot checks prove both deleted
loads before classifying either group. Other candidate wheel-index/branch-merge
loads fail conservative straight-line proof and remain pending,not assumed safe.
Ledger now51/85 classified,34 pending; overall41/103 unchanged,item23 open.

Item23 pointer batch:15 additional deleted BP-DC point-pointer reload groups
classified under the corresponding modern BP-DE slot. Added exact modern
alignment anchors from structural diff; backwards straight-line register-access
audit finds defining load and rejects intervening branches,calls,interrupts,
BX/BL/BH/BP writes or direct pointer-slot changes. Groups16/17/20/21/29/30/
32/33/34/35/36/46/47/49/50 pass; examples correction83CA retains pointer for
both Y/Z updates. Scope is the existing valid chassis point-buffer layout,not
arbitrary aliasing of corrupted pointers. No classifications applied to rejected
or multi-instruction groups. Ledger now49/85 classified,36 pending; acceptance
41/103 unchanged,item23 open. Original images unchanged.

Item23 groups26/27/28 classified:216 original modern fall-step executions
cover both cadences,four wheel slots,nine signed speed boundaries and three
increments. Native retained speed and height match,including overflow wrap and
both10Hz increments/displacements. Confirms changed indexed-slot access and
extra10Hz substep;20Hz remains one step. Corpus
/private/tmp/ms91-fall-steps-20261011-a.json. Source image unchanged. Ledger
now34/85 classified,51 pending; overall acceptance41/103 unchanged, item23 open.

Item23 groups37/38 classified by paired original landing sequence:384 cases
across both engines,four wheel slots,signed extrema/exact boundaries and three
retained flag values match native sound flag,event1 request and fall-speed reset.
MS90 strict limits190/931 become MS91 250/23275; signed comparisons preserved.
Corpus /private/tmp/landing-limits-20261011-a.json. Global handler intercepted
but separately original-checked earlier. Ledger now31/85 classified,54 pending.
No runtime correction required for these existing versioned limits. Overall
acceptance41/103 unchanged; item23 remains open.

Item23 padding batch: six additional changed groups contain only opcode90 NOP
insertions/deletions (13/31/39/48/54/75). Every changed instruction independently
decoded and checked for no implicit register/flag writes; whole-routine branch
targets remain instruction-aligned. This classifies padding only,not neighboring
branches or physical timing. Ledger now29/85 classified,56 pending. Landing
threshold groups37/38 identified for next review: signed JLE guards and sound/
crash/reset sequence must be included,not just constants. Overall41/103 unchanged.

Item23 orientation matrix bank relocation: complete43-byte inverse-angle
builder/copy block matches under explicit pose globals and verified combined
rotation target. Both copy nine original matrix words into old8D80/new8FDE.
Changed single AX/DI pointer constants for that bank are now classified as
relocation,not altered geometry. This does not classify surrounding response
branches merely because they use the bank. Ledger output is authoritative for
new classified count; overall acceptance41/103 unchanged, item23 still open.

Item23 groups1/9 classified: exact local stack allocation grows1E2→1E4 bytes;
argument BP identity is retained,while individual local-field equivalence remains
explicitly separate. Added modern75AF BX reload is redundant: from initial7525
load there are no calls/interrupts,implicit or explicit BX/BL/BH/BP writes,or
changes to its BP+6 argument. Capstone register-access assertions cover implicit
writes,not only operand strings. Ledger now17/85 classified,68 pending.
Overall acceptance41/103 unchanged; item23 remains open.

Item23 groups7/8 classified: exact modern cadence branch selects1E00 only at
10Hz,otherwise retains old3C00. Both reachable constants positive below32768,
so old CWD and modern SUB DX,DX produce identical high divisor word0. Complete
instruction sequences/branch targets pinned,not inferred from compiler labels.
Original cadence identity and native per-cadence movement tests remain separate
existing evidence; this closes two structural change classifications. Ledger
now15/85 classified,70 pending. Overall acceptance41/103 unchanged; item23 open.

Item23 exact changed-group ledger added: structural inventory's85 groups now
have stable IDs and bounded evidence linkage.13 groups classified,72 remain;
classified: initial pointer copies2/3/4,quarter rounding5,padding6,wall threshold
24/25,final pointer copies80..85. Groups spanning compared-region boundaries
remain pending; helper/runtime tests do not silently classify adjacent groups.
Quarter classification retains documented raw legacy minimum-word limitation;
classification is not proof that every legacy state word matches. Ledger exposes
actual remaining group IDs for subsequent review. Overall acceptance41/103
unchanged; no new release item passed merely by reporting granularity.

Item23 full prepared-state modern wall path:512 original MS91 entry79A4 through
geometry/helpers/threshold/reposition/retry executed,129 contacts and383 no-
response cases. Native wallResponse matches complete four-wheel output,wheel
angle,sound flags and crash event requests in every case. Each run restores
original-generated cardinal matrices plus original sine/atan tables and unknown
cache. Global crash handler intercepted; separate original crash corpora verify
its state/effect requests. Corpus /private/tmp/ms91-wall-response-20261011-a.json;
source executable and legacy capture unchanged. This closes the bounded full
wall-response comparison,not original race-loader/whole-race verification or
all85 chassis differences. Items23/24 remain open; overall41/103 unchanged.

Item23 wall entry/setup classification: complete141-byte old7990..7A1C versus
modern79A4..7A30 region compares exactly after explicit six global fields and
stack+2 mapping. Wall sentinel,height strict lower/upper checks,wheel-history
addressing,relative coordinates and signed32-bit proposed-point shift retain
instruction/branch order. No calls/interrupts. This joins the already compared
upstream geometry block; all source coordinate setup now has bounded equivalence
evidence. Full prepared-state integration execution still needed to validate the
entire wall path as one unit. Other chassis blocks remain; overall41/103.

Item23 enclosing upstream wall geometry: complete483-byte old7A1D..7BFF
versus modern7A31..7C13 region compares exactly with explicit stack-field+2
mapping (BP-C temporary unchanged),four globals,five verified helper identities,
relative internal branches and explicit no-response exit. This covers local
rotation,crossing-side swap,zero-endpoint split,intersection/distance split and
response-offset matrix construction before the independently verified threshold.
Combined helper bodies/runtime matrix corpus and legacy full response corpus
support this bounded caller equivalence. Earlier coordinate input setup and
remaining exceptional chassis branches remain; items23/24 not complete.
Overall41/103 unchanged.

Item23/24 initialized matrices original execution: each engine's own Y-rotation
code generates identity/90/180/270-degree tables into explicit original runtime
addresses; own sine-bank bytes copied,cache initialized unknown.512 combined
roll/pitch/yaw calls then retain real cache across cardinal/noncardinal inputs.
Both originals' complete9-word matrices match each other and native rotateZXY.
Corpus /private/tmp/wall-rotations-20261011-a.json. This closes the bounded
initialized matrix dependency for wall geometry,not full caller contact state
or every chassis transitive helper. Items23/24 remain open at41/103 overall.

Item23/24 wall rotation chain code closed: complete85-byte X and85-byte Z
builders compare exactly under verified trig call mappings; no other calls,
branches or interrupts. Complete128-byte matrix multiply is byte-identical,
fully decoded with all branches aligned and both return paths covered. Combined
builder report now has no unverified identified transitive code bodies. All five
upstream immediate wall helpers plus code/lookup dependencies compare; initialized
cardinal matrices/runtime cache and enclosing caller state remain independent
runtime acceptance scopes. This does not close all chassis dependencies/item24.
Items23/24 remain open; overall41/103 unchanged.

Item23/24 combined rotation immediate body:384-byte region (151 code
instructions plus16-byte dispatch table) compares exactly under explicit nine
matrix/cache fields,four helper call mappings and aligned relative branch/dispatch
targets. All five immediate upstream wall bodies now compared. This builder
still calls X/Z rotation and matrix multiply; these three complete transitive
bodies and initialized cardinal matrices remain explicit requirements,not hidden
behind immediate-body equivalence. Runtime matrix cache must not be assumed
valid from unpacked bytes alone. Items23/24 open; overall41/103 unchanged.

Item23/24 angle dependency closed: complete134-byte atan routine partitioned
into code plus embedded16-byte quadrant target table. Both code sections compare
exactly under explicit lookup/table relocation; eight targets map to decoded
instruction boundaries and preserve relative positions. Identical257-byte atan
lookup banks located by unique signature; no transitive calls/interrupts. This
closes vector-length helper's outstanding angle dependency. Four immediate wall
helpers now have their identified dependencies compared; final combined rotation
builder remains. Items23/24 stay open; overall41/103 unchanged.

Item23/24 vector-length helper bodies: complete33-byte wrapper matches under
explicit old209E:1690→modern20E5:1692 hypot2d mapping. Full106-byte hypot2d
body compares exactly after sine/cosine call mappings and aligned relative
branches. Initial assumed entry based on another routine's relocation failed
the assertion; corrected from actual old wrapper call,not a blanket offset.
Atan2 helper remains an explicit transitive dependency,so complete length-chain
equivalence is not yet claimed. Four of five immediate upstream bodies compared;
remaining combined rotation builder and angle dependency still required.
Items23/24 remain open; overall41/103 unchanged.

Item23/24 wall Y-rotation dependency closed: complete88-byte rotation builder
matches under two explicit trig-call mappings. Complete sine/cosine89-byte
region compared with its eight-byte quadrant jump table separately classified;
four jump targets map exactly and signed lookup/negation logic matches. Both
original images contain identical514-byte sine banks located by unique signature.
No trig calls/interrupt dependencies remain. Upstream wall helpers now3/5 bodies
proven; two remain. This is original-version equivalence,not a new standalone
claim that every native geometry case is covered. Items23/24 remain open41/103.

Item23/24 wall intersection helper closed: full85-byte old209E:446A versus
modern20E5:45F0 bodies are byte-identical,fully decoded with aligned internal
branches,no calls/interrupts,two signed IDIV operations and identical final
RETF. Signed-difference denominator-halving path is unchanged. Together with
vector transform,two of five unique upstream wall helpers now have complete
body equivalence; three remain. This does not itself prove native intersection
outputs for all inputs or total caller geometry equivalence. Items23/24 remain
open; overall41/103 unchanged.

Item23/24 upstream vector transform closed: complete260-byte old209E:3D44
and modern20E5:3ECA bodies are byte-identical,fully decoded,all internal
branches aligned,and no calls/interrupts. This covers three of seven upstream
wall call sites. Remaining four unique upstream bodies still unproven; report
marks only this helper body equivalent. Original images unchanged. Full category
and items23/24 remain open; overall41/103 unchanged.

Item23/24 upstream wall dependency map now exact: seven call sites map five
unique helpers. Old2D94:60→modern2DF4:5C;209E:3D44→20E5:3ECA (three sites);
209E:446A→20E5:45F0;209C:C→20E3:4;1696:149A→1718:14A2. Inventory verifies
both actual routines contain the expected calls and matching site multiplicity.
Their body equivalence is explicitly false/unproven in the report until audited;
call-address mapping alone is not proof. This narrows upstream wall verification
to five specific bodies plus caller geometry state,not an unspecified dependency.
Items23/24 remain open at41/103 overall.

Item23 modern wall-loop execution:512 original four-wheel reposition runs
execute real long-multiply/divide helpers and match extracted production
repositionWallWheels exactly across zero/nonzero approach,signed offsets and
varied points/speeds. Original image unchanged. Corpus
/private/tmp/wall-reposition-20261011-a.json. Existing3000-case full legacy
wall-response corpus still passes after behavior-preserving helper extraction;
typecheck passes. This verifies the reposition loop,not upstream intersection/
geometry setup or every chassis exceptional branch. Item23 remains open;
overall41/103 unchanged.

Item23 dependency24 wall arithmetic helpers: complete156-byte signed long
divide (74instructions) and52-byte long multiply (23instructions) are byte-
identical between old1EC1 and modern1F07 modules at explicit+8 entry relocation.
Fully decoded,all direct branches internal,instruction-aligned; no calls or
interrupt dependencies; final RETF8 cleanup matches. Thus previously compared
109-instruction wall reposition loop has equivalent arithmetic helper bodies,
not merely similarly named call targets. This closes that bounded dependency,
not all transitive chassis helpers/item24 or full wall-entry geometry. Other
exceptional branches remain; items23/24 open, overall41/103 unchanged.

Item23 wall reposition loop:109 instructions in old7C5B..7D81 versus
modern7C65..7D8B compare exactly with explicit simultaneous stack-field mapping,
relative loop/retry targets and two long-arithmetic helper mappings. No hidden
cascading address replacements; per-instruction relative offsets match. This
proves unchanged loop structure and state-access sequence,conditional on helper
equivalence (old1EC1:1C8C/1BF0 versus modern1F07:1C94/1BF8). Full helper bodies
must be checked under item24 dependency before claiming full modern reposition
equivalence. Original modern execution with initialized geometry remains useful
integration evidence. Item23 stays open; overall41/103 unchanged.

Item23 full legacy wall response corpus refreshed: read existing original
3000-case wall-response-oracle.json and its generation harness. Native default
and explicit MS1990 wallResponse match every expected result,including753
four-wheel repositioning contact responses and null/no-response cases. Capture
source unchanged. Harness uses initialized work/contact-frame0.bin and relocated
DS/CS globals,not just unpacked EGA bytes; a modern equivalent must use correctly
initialized modern memory and explicit relocated fields. Do not blindly replace
the executable path and call it modern proof. Checker:
tools/check_wall_response_capture.ts. Modern full repositioning original oracle
and remaining chassis branches still open; overall41/103 unchanged.

Item23 wall decision oracle: all1024 directions in both originals tested at
threshold-1,threshold,threshold+1 (clamped byte-word range):6144 cases. Exact
event1 request boundary and retained/crash wheel-angle output match extracted
native wallImpactDecision now used by production wallResponse. Handler call is
intercepted; its global effects already have separate original corpora. Native
wall regressions and typecheck pass. Corpus /private/tmp/wall-decision-20261011-a.json.
Repositioning and other exceptional chassis paths remain open. Item23 stays
open; overall41/103 unchanged.

Item23 complete wall-threshold arithmetic original oracle:1024 paired original
MS90/MS91 folded-direction cases execute multiply-by70,signed conversion,
subtract/negate and byte-packed CX result. Native wallCrashThreshold matches
every original output for both routes and legacy default;297 differences are
verified against executable outputs,not only expected SAR formulas. Corpus
/private/tmp/wall-threshold-20261011-a.json. Remaining wall speed decision,
repositioning and other exceptional chassis paths still require comparison.
Item23 stays open; overall41/103 unchanged.

Item23 enclosing eight-bit site resolved:7C19 belongs to wall-response impact-
direction speed threshold,not inverted attraction. Native wallResponse previously
always truncated; added explicit MS1991 SAR8 threshold and routed track engine
identity. Legacy/unlabelled (and experimental BB path) retain existing behavior.
All1024 folded direction inputs checked;297 modern thresholds differ as original
instructions require. Folded domain cannot produce product-32768,so legacy
minimum-word overflow is unreachable at this site. Existing five wall-contact
regressions and typecheck pass. Original instruction exhaustive probe supports
arithmetic; full changed wall-response original execution/capture remains needed.
Item23 stays open; overall41/103 unchanged. No live data/deployment changed.

Item23 eight-bit signed-scaling branch: original legacy7C05..7C12 versus
modern7C19..7C1C exhaust all65536 input words. Modern matches signed SAR8;
legacy truncates except minimum-word overflow-32768→128 rather than-128.
32641 input words differ. This branch follows multiply-by70 in the chassis,
not necessarily the same domain as front-wheel quartering. Native track-contact
currently has simplified constant invertedPull±192; need map the enclosing
original branch and reachable input domain before asserting its full behavior
matches or changing legacy. The quarter-edge rotation-periodicity result must
not be reused for this scaling site. Item23 remains open at41/103 overall.

Item23 quarter overflow impact: keyboard input clamps±240,but grip/roll paths
prevent claiming a universal frontWheelAngle bound without further proof.
Original legacy-32768 quarter result8192 differs from preserved helper-8192 by
16384=16 complete1024-unit rotations. All65536 wheel-angle values produce
identical sine,cosine and rotation matrices under either result. Geometry thus
has no angular difference from this edge; retained raw angle words still differ
and are not claimed bit-exact. Shared legacy helper remains unchanged to preserve
current playback. Test tools/test_chassis_quarter_edge.ts passes. Any exact
retained-angle requirement must use a chassis-site-specific policy rather than
changing all shared scaleSteeringWord callers. Item23 remains open at41/103.

Item23 exhaustive original steering-quarter instruction probe:65536 words per
engine. Modern SAR scaling matches signed shift for every input. Legacy
absolute/shift/sign sequence matches truncation except original overflow at
-32768,which returns8192 rather than-8192.24577 inputs differ between originals.
Current shared scaleSteeringWord returns mathematical truncation at that edge;
do not globally change it because other callers represent different original
instruction sites and legacy playback must remain unchanged. Need determine
reachable front-wheel input bounds and scope any exact instruction helper to
the verified chassis site. Probe is memory-only,no game data changes. This is
a newly exposed edge-case classification task,not a passed item23. Overall41/103.

Item23 initial state-copy classification: three deleted BX reloads at legacy
74FC/7512/7528 are redundant. Complete old74E7..7533/new7525..7568 regions
compare exactly after explicit global mappings; no intermediate BX writes,
calls or branches. Position/history copies and first orientation copy preserve
the same car pointer. Together with final commit this proves nine removed
reloads are compiler optimization,not physics changes. Full85-group semantic
classification remains open; overall41/103 unchanged, item23 not passed.

Item23 final chassis commit classification: six deleted legacy BX reloads at
8F33/8F43/8F53/8F5C/8F65/8F6E are redundant in this bounded final commit.
Modern8F04 retains the same car pointer without intervening BX writes/calls.
After explicit nine global-field mappings and car flagB0→C8 layout mapping,
the entire final position/orientation commit plus epilogue compares exactly.
This is a proven compiler/register optimization,not six physics changes.
Audit asserts reload count,retained pointer and exact normalized instruction
sequence. Other85-block inventory entries remain separate; item23 stays open.
Overall41/103 unchanged.

Item23 legacy global crash handler:1000 original MS90 cases pass full retained
state and ordered particle/audio request comparison,including200 underside event5
cases. Legacy timers remain fixed20Hz (80 crash ticks/20 finish ticks); modern
cadence-aware handler corpus remains2000 cases. Explicit old global/car offsets
and original old effect-entry boundaries used,not modern addresses applied to
legacy memory. Corpus /private/tmp/ms90-crash-check-20261011-a.json. Native legacy
behavior needed no changes. Enclosing motion and remaining exceptional branches
remain open; item23 stays open at41/103 overall.

Item23 modern global crash effects refreshed:2000 original MS91 crash-handler
cases match native crash state and ordered audio/particle requests,including400
event5 underside cases across both cars and10/20Hz. Speed/road speed,abort/timer,
evaluation cause and statistics retention/restoration match; input state remains
unchanged. Corpus /private/tmp/ms91-crash-check-20261011-new.json. Actual
audio/particle implementations are deliberately intercepted,so this proves
requested side effects rather than their rendering. Added explicit400-per-cause
coverage assertion. Legacy full-handler comparison and enclosing motion/other
exceptional branches remain; item23 stays open at41/103 overall.

Item23 direct original correction block:60 paired MS90/MS91 cases match each
other and native arithmetic across signed penetration extremes,zero/positive
distance,crash flag0/1 and three cardinal matrix orientations. Compares retained
distance and complete32-bit point after correction; includes16-bit shifted-wrap
and signed matrix transforms. Corpus /private/tmp/penetration-correction-20261011-b.json.
Initial a-corpus was invalid: test separated SS/DS despite original near stack
vector pointers,so transforms read zeros. Native comparison caught this. Shared
original SS=DS harness corrected; b-corpus passes and supersedes a entirely.
Original code executes its real transform helper; no crash handler substitution
inside this isolated correction block. Enclosing motion/crossing,global crash
effects and other exceptional branches remain separate. Item23 stays open;
overall41/103 unchanged.

Item23 original underside handoff:576 MS90/MS91 cases now continue beyond the
guard,intercept only the event handler call and verify original event5/handle0
arguments plus retained correction flag (legacy BP-134,modern BP-136). Crash
branch sets flag1; normal/fallback leave0. All pass. This supports the native
undersideCrash flag routing but intentionally excludes global crash-handler
effects and later plane position correction. No original images/production data
changed. --handoff option retains earlier guard-only behavior. Item23 remains
open; overall41/103 unchanged.

Item23 native underside response integration:84 wheelPlaneContact cases cross
both engines and signed heights around-12/-24. Ground fallback selects ground,
sets underside and preserves proposed point without event5. Crash branch emits
event5,keeps selected roof and applies signed penetration correction; normal
contact has no crash. All pass. These are native integration invariants,not an
independent original full-response oracle; original global crash effects and
other exceptional chassis branches remain required. Test:
tools/test_underside_contact_response.ts. Item23 stays open; overall41/103.

Item23 underside guard expanded original comparison:576 cases now pass in
both original engines and native logic,covering flag bytes0/1/2/255 and signed
boundaries around-12/-24 plus extrema. Both originals treat every nonzero flag
as bypass,not only1. Normal/ground-fallback/underside-crash branch destinations
match. Existing wheel-plane-contact calls this shared guard with retained and
proposed plane-local heights. Probe deliberately stops before crash side effects,
so full response and other exceptional chassis branches remain open. Initial
permission review timed out before execution; one permitted retry succeeded.
No original or production data changed. Item23 stays open; overall41/103.

Scheduling dependency: item45 static/component classification finished but
browser acceptance requires the user's existing local tab (none currently
available). Leave45 open and continue first unfinished Engine/physics item23
instead of waiting indefinitely or opening unwanted tabs.

Item23 control-flow inventory: original chassis structural audit revalidated
2421 legacy/2400 modern instructions and85 changed groups. Added explicit branch
rows without removing raw operands:223 legacy/225 modern conditional/loop/jump
sites. All direct internal targets land on decoded instruction boundaries; no
modern branches exit the chassis routine. This supplies an exact branch-review
inventory,not semantic equivalence or a passed exceptional-branch check. Original
images unchanged. Item23 remains open; overall41/103.

Item45 removed-pitch comparison:1024 original MS1990 TD15:A23 cases match
preserved originalTandyPitch,including signed bends,boundaries4095/4096,wrapped
note/range indices and incoming-CX noise-table quirk. Driver memory/archive
unchanged. Corpus /private/tmp/td15-legacy-pitch-20261011-a.json. The modern
five-byte no-op replacement was already checked exactly.

Tandy difference classification summary: header jumps and code/data coverage
complete for2993/3241 bytes; supplied banks unchanged. Modern adds120-byte
sample-rate table, replaces BIOS vector/sample state with IRQ0/PIT/PIC and
differential decoder state; stock tone tables/gain/latches relocate unchanged.
Note-start switches descriptor retention to guarded playback-rate sample
request. Ongoing voice switches channel0 table,always retains current pitch,
uses direct sample output and gates zero-volume PC tone. Set-volume adds immediate
channel5 gate, now propagated. Frequency conversion changes one channel0 branch.
Direct-divisor remains equivalent after state relocation; pitch callback45 is
removed; flush remains no-op. Init no longer installs INT15 and resets C4;
shutdown/silence waits for explicit sample completion. Stop preserves original
modern unreachable sample branch and changed PC gate mask. Raw/differential
sample IRQ/start/stop,repeat/chaining/restore are separately original-checked.
Status changes BIOS readiness query to retained active flag. Both generations'
note/voice/lifecycle executables and legacy removed pitch callback now have
independent comparison evidence. This completes static/component classification,
not item45 acceptance: actual browser menu/race playback and integration QA
remain pending. Generic custom sampled instruments remain explicitly unsupported
in shipped tone host, as in legacy; supplied banks exclude that channel.
Overall41/103 unchanged; do not mark45 passed without browser acceptance.

Item45 legacy lifecycle executable evidence:512 original legacy initialization,
silence,shutdown and six channel-stop cases match full driver memory,ordered
port output,intercepted BIOS requests and installed/restored INT15 vector.
Existing512 modern idle lifecycle cases rechecked and pass. Legacy channel0
requests silent BIOS sample and clears active state; modern channel0 takes tone
stop because original CMP AX,0/JB cannot branch. Legacy PC stop AND FE versus
modern AND FC is preserved. Corpus /private/tmp/td15-legacy-lifecycle-20261011-a.json;
original package unchanged. Typecheck passes. Removed-pitch callback comparison
and final classification summary/browser acceptance remain; item45 stays open.

Item45 legacy voice oracle:1000 original MS1990 ongoing voice cases now match
complete2993-byte driver,46-byte voice,ordered port writes,retained CX and
intercepted BIOS INT1A requests. Sample active-state2→1 and two startup BIOS
requests are covered. Existing1000 modern voice cases rechecked and pass.
Corpus /private/tmp/td15-legacy-voice-20261011-a.json; archives unchanged.
This gives independent evidence for both version routes, including the modern
current-pitch retention and PC-volume gate differences already classified.
Remaining removed-pitch/startup/stop classification and browser acceptance
still keep item45 open. Overall41/103 unchanged.

Item45 legacy note executable evidence:512 original MS1990 TD15:061A cases
now compare complete2993-byte driver and46-byte voice against the preserved
legacy implementation,including noteFF register retention and sample descriptor
length/state. All pass. Existing512 modern0669 original cases also rechecked and
pass. Legacy sets retained BIOS descriptor/active state; modern instead returns
sample-start request only when channel0 and instrument flag requires it, using
the added playback-rate table. Corpus /private/tmp/td15-legacy-note-20261011-a.json;
original archive unchanged. Typecheck passes. Ongoing voice/removed pitch and
startup/stop classification plus browser acceptance remain; item45 stays open.

Item45 legacy coverage/sample classification: all2993 bytes partition with no
gaps/overlaps; entire0526..0BB0 code decodes739 instructions/1675 bytes and
all direct branch/call targets land on instruction boundaries. Legacy data
initializes to zero except the one-byte silent sample128. INT15 handler consumes
AX91FB and otherwise chains saved vector; sample start has two BIOS INT1A calls
and an unclamped16-bit DIV, unlike modern clamped PIT/IRQ0/DAC setup. Legacy
sample status asks BIOS AH81, while modern checks retained active state.
Static audit passes; source packages unchanged. Remaining changed note/voice,
startup/stop and removed pitch callback comparisons must be summarized against
the existing executable oracles before declaring full difference classification.
Browser acceptance remains pending. Item45 stays open; overall41/103.

Item45 modern data/state coverage: all3241 bytes partition into exported jumps,
gain/PC/sample-rate/PSG/sample/noise/velocity tables,31-byte note/sample/IRQ/PIT/
PIC state,signed16-byte decoder delta table,three differential state bytes,six
velocities,six gains,two five-byte latch tables,and1770-byte code. Partition
asserts no gaps/overlaps. Signed delta table matches implemented decoder; retained
initial PIT divisor2E9C is explicit and other state initializes to zero. Package
audit passes. Remaining static scope is legacy changed-body classification;
modern inventory is no longer an unidentified region. Browser QA still pending.
Overall41/103 unchanged; item45 remains open.

Item45 modern code coverage: entire05BF..0CA8 region fully decodes754
instructions/1770 bytes. Every direct code branch/call lands on a decoded
instruction boundary; six changed component bodies (note,stop,voice,sample-stop,
sample-IRQ,sample-start) are individually hash pinned to original executable
regions already used by component oracles. This is coverage/identity evidence,
not a new semantic parity claim. Remaining static work is now explicit:
legacy changed-body comparison/classification and complete modern data/state
inventory, followed by browser acceptance. No modern code bytes remain undecoded.
Overall count41/103 unchanged; item45 remains open.

Item45 sample-status callback: fully decoded modern C91..CA8 matches explicit
zero return only for active channel0; all other cases return1. Isolated sample
host exposes this query, tested idle/active/completed states in raw and
differential runs and split-block invariance. Static package audit and typecheck
pass; no public custom-sample support is implied by the isolated host.
Browser inventory currently has zero IAB tabs and no local Chrome tab; user
requested reuse, so no replacement opened. Browser acceptance remains pending.
Overall41/103 unchanged; item45 not complete.

Item45 full frequency callback comparison: old0784..07E4 and modern07E0..0840
fully decode with identical instructions/relative branches except one JB target:
channel0 now takes the PC conversion block rather than sample conversion. The
old sample-conversion instructions remain present but unreachable through that
dispatcher. Existing explicit generation routing implements this distinction.
The full test:tandy-versioned-control suite passes (control,full memory snapshots,
resource checksum,note,ongoing voice and idle lifecycle). Packages unchanged.
This completes this callback comparison, not the entire driver or browser QA.
Overall count remains41/103; item45 remains open.

Item45 exported callback map: all21 modern header jumps are pinned to their
original targets and both headers fully decode as21 three-byte near jumps.
Direct-divisor callback12 instructions compare exactly after sample-divisor
field relocation. Modern callback45 is now a five-byte no-op (legacy had a
pitch/note routine); callback48 is the same no-op stub. Ongoing voice callback39
remains separate and must not be removed because callback45 became a no-op.
Full audit command passes with package hashes unchanged. Remaining body regions
and browser acceptance still prevent closing item45.

Item45 direct volume oracle: original modern TD15:0744 ran1536 isolated virtual-
port cases (all256 byte volumes across six channels, varied port61). Native
set-volume plus explicit gate output matches every complete3241-byte driver
snapshot and ordered write list. Original package checksum unchanged; corpus
/private/tmp/td15-volume-20261011-a.json. This validates the actual original
zero-gain callback, not merely its interpreted predicate. No physical audio or
production state touched. Complete driver classification and browser output
remain open; overall count stays41/103.

Item45 race gate propagation: engine start/instrument assignment,note allocation,
effect sequence volume,live engine volume and effect mute adapters now deliver
the modern gate using explicit current port61. Car smoothing updates host port
state before deferred stop/restart; race mute commits emitted writes through
the existing output accumulator. Missing modern gate context is rejected rather
than guessed. Owned inactive effect-channel mute targeted tests pass with legacy
no-extra-write behavior. Combined all-car8800 callbacks,400 replay replacement
callbacks,80 dialog cycles,20k music ticks and2,947,200 PCM-sample checks pass;
typecheck passes. Further targeted original-executable volume oracle and complete
driver classification/browser acceptance remain required. Item45 stays open.

Item45 gate propagation into music: runtime volume effects and score volume
commands now emit the immediate modern gate while retaining port61. Track
controller7 returns ordered writes; an owned zero-volume channel5 requires
explicit port context rather than inventing a host value. Targeted owned-slot
tests pass both generations, including legacy no-extra-write behavior. Four
score/20000-tick and2,947,200-sample partition regressions pass; existing PCM
hashes unchanged for the supplied corpus. Typecheck passes. Instrument-assignment
and remaining race volume/mute adapters still need gate propagation; item45
stays open at41/103 overall.

Item45 gate fix first integration: explicit originalTandyVolumeGateWrites models
the audited modern channel5 zero-gain predicate using caller-supplied port61.
393216 channel/volume/port combinations pass; omitted/legacy generation emits
no additional writes. Allocated dialog now delivers the ordered gate write and
retains port state before voice callbacks.80 allocated pause/resume cycles pass,
including an explicit owned inactive channel5 case. Unowned channel5 does not
invoke the original volume callback and is not required to emit the gate.
Music/controller/instrument and remaining race paths still need propagation;
the overall defect is not closed and item45 remains open. Typecheck passes.

Item45 further control audit: 42 controller/owner-volume/no-op wrapper
instructions compare exactly under explicit call relocation. Volume callback
shared prefix/epilogue matches, but modern adds seven instructions: when shifted
volume is zero and channel index is5, read port61, AND FC and write port61.
Current setOriginalTandyVolume only updates driver memory, so this immediate
speaker-gate side effect is missing. This is an open implementation defect,
not a passed acceptance check. Fix must propagate ordered device writes through
volume/controller/instrument callbacks in music, dialog and race adapters,
retaining actual port61 state; legacy must remain unchanged. Current PCM and
dialog regressions do not prove this behavior and must be supplemented.

Item45 static helper comparison: fully decoded83-byte old0526..0578 and
modern05BF..0611 regions compare exactly after latch-table relocation. All46
instructions retain tone saturation,nibble packing,C0/C1 output order,volume
mapping and exported stubs. Branch targets are checked relative to each region;
both archived packages retain their hashes. Remaining driver regions and browser
acceptance are not covered by this comparison. Item45 remains open.

Execution order requested by user: finish current item45, then work categories
top to bottom (Engine/physics, Sound/music, Graphics/menus/controls, Replays/
scores, Backups/final tests/release, Documentation/GitHub). Explain any dependency
that prevents completing a category before moving to another. No acceptance
requirements or totals are removed by this scheduling change.

Item45 allocated dialog regression: 80 pause/resume cycles on actual native
race allocations cover both sound-driver generations crossed with both physics
generations. Pause flags and guards balance; music/sound settings and sequence
positions remain intact; owner volumes restore; subsequent audio callbacks and
cockpit rendering pass. Modern route makes no BIOS sample requests. CTKFIN.RPL
source bytes remain unchanged. Test registered in test:tandy-all-car-resources.
This is local memory/runtime evidence, not audible browser output verification.
Item45 remains open and overall count remains41/103.

Item45 offline PCM regression: four supplied scores, both boot generations and
44.1/48kHz output produce 2,947,200 finite, non-silent samples. Each complete
four-second render matches bit-for-bit against irregular 17/512/333/4096/1
sample partitions, with identical resulting driver, timers and voices. Source
seeds remain unchanged. Registered in test:tandy-versioned-music. The two
generations have different PCM hashes; this test does not claim cross-version
audio identity or original-hardware equivalence. Browser output, complete TD15
difference classification and final integration acceptance remain open, so
item45 and the overall 41/103 count are unchanged.

Retry-dialog executed follow-up: check_original_retry_guard.py passes16 actual
original-code cases (7 cancel/9 continue), verifies cancellation choice2 and
stack/frame restoration without resource mutation. check_original_retry_prompt.py
passes12 original body cases across both prompt modes, empty/named filename,
and dialog responses0/1/2. Original copy and append helpers execute; only input
save/restore, resource lookup and dialog presentation are doubled. Text, button
count, return mapping, retained filename and stack match. Required two-button
mode maps dialog0 to1 and nonzero to0; optional one-button mode returns1.
This distinguishes internal dialog selection from caller cancellation choice2;
do not conflate the two. Rendered UI and resource ownership remain unverified.
No real IO/audio/live changes. Item28 remains open, overall46/103 unchanged.

Retry-dialog guard follow-up: audit_original_retry_prompt.py verifies the complete
332-byte/133-instruction MS91 boundary, both returns, and the added guard at
2C27..2C3F. It returns cancellation choice2 if either far pointer at DS009C/009E
or DS00A0/00A2 is null; both must be present before input/dialog services run.
All16 zero/nonzero word combinations were checked against the decoded guard
(7 cancel,9 continue). Both filename branches have three append calls using
the same helper and check retained filename DS3428. This is static inventory,
not runtime dialog acceptance; pointer ownership and presentation still need
verification. Item28 remains open; total46/103 unchanged.

Result helper review: like-for-like EGA retained-window block helper
209E:4F8C /20E5:5114 compares all352 bytes/148 instructions with explicit
CS state-field relocation +0188 and indexed bank displacement mapping.
Every branch destination is inside the compared body; no calls/interrupts.
Its last physical opcode is an out-of-line JMP to the earlier return, so the
audit now checks branch closure rather than incorrectly requiring a terminal
RETF for this body. Fresh full results inventory passes; unresolved helper
references decrease38 to37. This is code equivalence, not rendered UI proof.
Browser results resource retry currently throws an explicit error rather than
presenting the original disk prompt; preserve this distinction for integration
review, and do not claim DOS dialog rendering accepted. Item28 remains open.

High-score table body audit: audit_original_high_score_table.py passes complete
581-byte/219-instruction like-for-like EGA tables, five branches,28 mapped calls
and seven byte-identical identifier/separator strings. No structural table-body
change. Nested row formatter does change: MS91 saves active cadence DS96DC,
forces20 for the HIG time formatter, then restores cadence. Native
originalHighScoreRow currently accepts active cadence metadata, so experimental
10Hz HIG semantics must be reconciled with record construction before changing
it; normal20Hz path agrees. Full row formatter/entry and drawing dependencies
remain open. This newly identified difference changes the next investigation,
not the overall accepted count (46/103).

MS91 score-row correction: check_original_ms91_score_row.py executes26 actual
original rows across active10/20Hz, sentinel and signed/unsigned boundaries,
including real string/time helpers. Rows always use20Hz, restore active cadence,
and leave source52-byte records untouched. Native high-score-format now matches
that rule for explicitMS91 only; legacy routing unchanged. Exhaustive portable
test_ms91_score_row_cadence.ts passes262144 row checks/all65536 tick words,
both modern cadences and legacy/default paths, input immutability checked.
Earlier test_ms91_high_score_time.ts assumed active-cadence HIG formatting;
its assertion failed after this correction and was updated to the observed
original behavior, not retained as misleading acceptance evidence. Typecheck
passes. Experimental10Hz score construction still requires separate review;
this display fix neither rewrites score files nor accepts all of item28.

Score entry cadence follow-up: original MS91 adds41F0..41FA: if active cadence
is10, SHL the candidate time word before qualification and record construction.
check_original_ms91_score_row.py now executes14 original entry-prefix cases
including word-wrap edges, in addition to26 full row cases; all pass.
Native entry now mirrors this only for explicitMS91/10Hz and copies the caller
candidate instead of mutating it. Both packed and alternate display entry paths
receive panel engine/cadence metadata. test_ms91_score_entry_cadence.ts passes43
cases (legacy/default and modern10/20, unsigned wrap, scaled qualification refusal,
no save on refusal, caller immutability). Typecheck and existing full results
suite pass. Both new cadence regressions added to test:ms91-results. Saved
production scores/replays untouched. Full entry-body/helper review remains open;
do not infer public10Hz support or complete item28 acceptance from these tests.

Complete score-entry comparison: audit_original_high_score_entry.py passes all
398 legacy/408 modern bytes (150/153 instructions). The verified10-byte cadence
prefix is the only structural addition. Remaining150 instructions match with
nine branch mappings,15 helper calls and explicit retained pointer/name/colour
relocations. Both141-byte save bodies match: copy seven52-byte records by display
order into a separate buffer, then filename construction and DOS write under
the retained read/write flag. Helper identity mapping is not full transitive
dialog/drawing acceptance. Fresh test_global_score_native_results.ts with
QA91R001 passes4/4, zero skipped: completed race metadata/download reload,
legacy isolation, private offline tables and explicit public submission boundary.
Only isolated memory stores used. Item28 remains open, total46/103 unchanged.

Score-name dialog engine routing: a new test_dialog_text_entry.ts regression
reproduced packed MS91 entry using legacy geometry (fieldY106 instead of108 for
the grouped synthetic prompt). Native packed and alternate entry adapters now
pass candidate.physicsEngine to their dialog renderer. Regression passes4/4,
including existing legacy field/cursor colour checks. Existing general
test_ms91_dialog_spacing.ts passes modern packed and CGA/Tandy/EGA bounds/hit
geometry/backdrop checks. Typecheck passed after production routing fix.
Attempted direct alternate score-entry test lacked the resource allocator arena
and failed with slots; that incomplete mock was removed, not counted passed.
Direct allocated alternate entry still requires a proper fixture. Item28 open,
overall46/103 unchanged. No live/stored-data change.

Allocated alternate score-entry regression now verified: new
test_allocated_score_dialog_engine.ts uses createNativeDisplayCommonState with
real initial display data, resource catalog, heap descriptors and drawing host.
All six CGA/Tandy/EGA ×legacy/modern cases pass explicit field geometry, original
10Hz candidate conversion, name entry (Escape still saves), actual framebuffer
change while dialog is visible, and complete backdrop restoration on dismissal.
Scores are captured in test memory only. No live/source score or replay writes.
This supersedes the failed incomplete allocator mock noted below. Both packed
field/cursor and allocated alternate-entry regressions added to results suite.
Full original dialog dependency classification remains open; item28 and overall
46/103 unchanged.

Dialog keyboard difference discovered and corrected: originalMS91 up/left
9B8..9EA and down/right9EE..A25 wrap at edges and skip disabled word entries;
legacy clamps. check_original_ms91_dialog_wrap.py executes1242 cases with
counts1..6, both directions and every table with at least one enabled choice.
Portable test_versioned_dialog_wrap.ts passes14200 cases/counts1..8; legacy
default/explicit paths match. All-disabled malformed tables retain selection
under a bounded safety adaptation rather than reproducing an original loop.
Engine routing now reaches originalDialogInput through session/interaction.
test_ms91_dialog_spacing.ts verifies keyboard wrapping through actual native
dialog lifecycle and legacy clamping, alongside existing display geometry.
Full dialog body comparison identified37 structural groups; navigation is now
verified but font-derived spacing/disabled initial selection and other groups
still require classification. Item28 remains open, total46/103 unchanged.

MS91 disabled startup-choice correction: original726..760 advances a disabled
initial choice forward with wrapping before interactive input. Native dialog
session now routes this only for modern mode2; legacy keeps its selected value.
Original navigation checker extended to1863 executed cases including startup.
Portable tests pass3550 startup selections plus14200 navigation cases; native
runtime verifies pressing Enter after disabled startup chooses the next enabled
modern entry and preserves old selection for legacy. General dialog geometry
and restoration checks pass. All-disabled tables keep the explicit bounded
safety adaptation. Added test:ms91-dialog to reusable results regression suite.
Other original dialog groups remain open; overall46/103 unchanged.

Font-derived dialog spacing correction: originalMS91 font selector2372..238E
reads selected font header word+14 into DSA6F6; dialog200..20A adds2 for normal
row/choice height. Native modern layout/content/drawing/input now receive actual
font header height and use signed-word(height+2), retaining group gaps4/3 and
legacy fixed10 spacing. Default eight-pixel fonts are unchanged. Tests exercise
heights6/8/10/12 across content bounds, field/choice positions, real packed drawing,
bottom-edge hit testing and backdrop restoration; explicitlegacy stays fixed.
This is targeted source-instruction evidence and native regression, not complete
original dialog geometry execution. Whole item28 remains open,46/103 unchanged.

Executable original dialog geometry comparison: check_original_ms91_dialog_layout.py
executes the complete MS91 prefix1E4..343 up to the first backup/drawing service.
Only reset-input and proportional measurement services are doubled (unit-width
measurement shared by comparator); real bounds/centering/spacing code executes.
Capture /private/tmp/ms91-dialog-layout-20261011-check1.json contains96 cases:
four font heights6/8/10/12 ×eight text patterns ×three automatic/explicit positions.
compare_original_ms91_dialog_layout.ts passes every x/y/innerWidth/bounds/height,
including group delimiters, name-field text, choices and unterminated final lines.
No actual graphics/audio/DOS file services execute. This upgrades layout evidence
from instruction checkpoints to original execution within this scope; full
proportional-font measurement and remainder of dialog still separate. Item28
remains open; total46/103 unchanged.

Original dialog content execution verified: layout checker --content runs1E4..6A8
through complete text/field/choice parsing and full-width hit-area adjustment.
Reset-input, measurement and drawing services are explicitly doubled; no actual
display/audio/file service executes. New capture
/private/tmp/ms91-dialog-content-20261011-check1.json contains96 cases matching
every text line byte/x/y, editable-field x/y, and choice offset/length/left/right/
top/bottom against native originalDialogContent. Four font heights, eight text
patterns, three positions; grouped choices and editable fields included.
Native parser required no further change after font-height fix. This accepts
the tested original parsing geometry, not remaining dialog input/rendering
dependencies or whole item28. Overall46/103 unchanged.

Original complete dialog input-iteration comparison: check_original_ms91_dialog_input.py
executes921..A54 branches until7F1, retaining actual hover filtering, ASCII
shortcut conversion, Enter/Space/Escape returns and wrap/disabled navigation.
Only button-release service is doubled; choices/count/key/hover are seeded as
device outputs. Capture /private/tmp/ms91-dialog-input-20261011-check1.json has
1020 two/three-choice cases, every nonempty enabled-mask, all selected/hover
positions and ten keys (including uppercase/lowercase shortcuts and arrows).
compare_original_ms91_dialog_input.ts passes all selected/done values. No
production correction needed after wrap/startup fixes. Character classification
is explicitly seeded ASCII in this corpus, not arbitrary extended codes.
No graphics/audio/file services or existing-data writes. Remaining dialog
render/helper inventory still open; overall46/103 unchanged.

Original dialog render-request comparison: content capture now records EGA
clip bounds, clear colour, outline endpoints/colour and font foreground/background
requests. Fresh /private/tmp/ms91-dialog-render-requests-20261011-check1.json
contains96 cases; comparator invokes native drawOriginalDialogDisplay with a
unit-width synthetic font and compares all four rectangle edges with the
original outline endpoints, exact clip/clear requests and both15/0 font settings.
All cases pass, along with prior text/field/hit-area values. This verifies mode3
render requests, not final hardware pixels or interactive selected/disabled
colour sequences. No further production change needed; item28 remains open,
overall46/103 unchanged.

Original selected/disabled dialog colours verified: new
check_original_ms91_dialog_colours.py executes7FB..8DA redraw loop with actual
choice/disabled branching; input-reset/font-colour/text output are service doubles.
Capture /private/tmp/ms91-dialog-colours-20261011-check1.json has32 cases covering
all selected indices and disabled masks for two/three choices (all-disabled is
safe here because only drawing executes). compare_original_ms91_dialog_colours.ts
compares every choice foreground/background against native EGA dialog drawing;
all pass, including selected inversion0/15, ordinary15/0 and disabled1/0.
No production colour change required. Final pixel rasterization and full helper
classification remain separate; item28 open, total46/103 unchanged.

Full EGA text drawing helper comparison: audit_original_ega_text_draw.py passes
all760 bytes/311 instructions of legacy209E:5DE6 and modern20E5:5F6E with
36 branch mappings, seven explicit state/palette/font relocations, four far
helper mappings and two unchanged BIOS interrupts. Relocated16-byte palette
bank is identical. No structural text-drawing change; source-level renderer
does not need a new version-specific glyph algorithm on this evidence.
Four nested hardware/service helpers remain distinct dependencies; this is
full body equivalence, not final planar-pixel or full transitive acceptance.
Item28 remains open, overall46/103 unchanged. No live or stored-data mutation.

Text-drawing nested helper inventory: audit_original_ega_text_dependencies.py
passes complete like-for-like EGA bodies for video-mode capture40 bytes,
retained drawing state52, exit callback registration61, page restore33 and
page creation294. All instructions/branches map with explicit field/helper
relocations. The page creator's first RETF gives an incomplete262-byte scope;
294-byte boundary includes both out-of-line fatal branches before next prologue.
No new logical difference found. BIOS execution and fatal-error presentation
are not verified by body equivalence; do not call this final pixel acceptance.
Item28 remains open, overall46/103 unchanged.

Actual original font pixel comparison: check_original_ms91_font_pixels.py executes
modern20E5:5F6E transparent glyph code on four isolated software planes, not
drawing doubles. Capture /private/tmp/ms91-font-pixels-20261011-check1.json has
48 cases: two glyph heights, four aligned/unaligned x offsets, three foreground
colours and plain/newline text, with retainedA5 background and13-pixel glyphs.
compare_original_ms91_font_pixels.ts matches all1024 plane bytes per case and
final cursor against native drawOriginalEgaDisplayFont(opaque=false).
No real hardware/audio/DOS services; source binary unchanged. This verifies
actual software-plane pixels for this transparent text helper, not opaque
dialog glyphs, planar hardware output or all rendering. Item28 remains open,
overall46/103 unchanged.

Opaque dialog text pixel comparison: font checker --opaque executes original
20E5:806D glyph writes directly into software planes. Capture
/private/tmp/ms91-opaque-font-pixels-20261011-check1.json contains144 cases:
two heights ×four aligned/unaligned starts ×three foreground ×three background
colours ×plain/newline text. Native opaque EGA font compares all1024 plane bytes
and final cursor in every case; all pass, including selected0/15 and ordinary15/0.
No production change required. Transparent48-case and opaque144-case evidence
remain separate; hardware planes/proportional glyphs and full remaining helper
classification are not inferred. Item28 open, overall46/103 unchanged.

Proportional opaque font pixels verified: checker --opaque --proportional runs
864 actual original software-plane cases with glyph widths0/1/7/8/13/16,
two heights, four aligned/unaligned x positions, foreground/background colours
and plain/newline text. Capture
/private/tmp/ms91-proportional-font-pixels-20261011-check1.json compares all
four256-byte plane outputs and final cursor to native font code; all pass.
Zero-width glyphs included. No production fix required. This extends previous
fixed-width coverage, without claiming hardware-plane or full-dialog acceptance.
Item28 remains open, overall46/103 unchanged.

Transparent proportional-font follow-up: synthetic zero-width case did not
return within50000 instructions (height6,x0,foreground0,textAB,IP60A4).
This is not a passed comparison or confirmed infinite loop; supplied-font
relevance still needs inspection. Checker keeps the full corpus unchanged by
default and provides explicit --positive-width scope. Positive widths1/7/8/13/16
pass240 actual original/native plane/cursor comparisons in
/private/tmp/ms91-transparent-positive-font-pixels-20261011-check1.json.
No unsafe original behavior copied into production. Zero-width transparency
remains explicitly unresolved; overall46/103 unchanged.

Supplied-font edge-case relevance resolved for bundled files: new
test_ms91_supplied_fonts.ts checks all256 glyph entries in FONTDEF/FONTN/FONTLED,
full-file equality against isolatedMS91 originals, glyph pointer/bitmap bounds,
and nonzero widths for every present glyph. Pass:111/101/17 present glyphs,
all height8, minimum widths1/2/6. No present zero-width glyph exists in any
of the three supplied fonts; full hashes match MS91 originals. Synthetic
zero-width transparent non-return is therefore not reachable from these intact
bundled font resources. Custom/corrupted-font handling remains a separate safety
case, not an excuse to claim its original pixel equivalence. Files read-only.
Item28 remains open for other dependencies; overall46/103 unchanged.

Original score-save execution verified: check_original_score_save.py passes28
cases across both original versions, seven cyclic record orders and their
reversals. Real record-copy and filename helpers execute; every DOS write is
intercepted in memory. Exact364-byte ordered output and C:\SAVES\TEST.hig name
match; source records/order retained, write flag reset, frame/stack restored.
Initial expectation incorrectly uppercased original extension and was corrected
to original lower-case resource text; no production filename change needed.
No real files written or existing scores/replays accessed. Item28 still open
for remaining dependencies, overall46/103 unchanged.

Results dependency ledger reconciliation: six complete straight-line wrappers
now compared and linked to already verified nested helpers: select result window,
restore screen, select/clear results, centred text measurement, font selection/
height caching and normal-font restoration. Bodies17/17/28/26/29/16 bytes pass
explicit fields/calls; underlying11-byte EGA font-segment selector also matches.
Full results inventory passes and unresolved references decrease37 to31.
These are complete body/dependency identity proofs, not new hardware execution.
No production change needed. Item28 open; total46/103 unchanged.

Resource lookup body comparison: audit_original_result_resource_lookup.py passes
complete221-byte/104-instruction directory lookup and51-byte localized identifier
wrapper under explicit DS/error-string/helper/branch relocations. Both missing
resource messages are byte-identical. No structural lookup change; required
missing-entry path still invokes fatal presentation/termination in original.
Native required lookup throws an error instead, an explicit host adaptation,
not verified DOS fatal UI equivalence. This comparison includes all return/tail
paths but does not accept transitive fatal presentation. Item28 remains open,
overall46/103 unchanged.

Original resource lookup execution: check_original_ms91_resource_lookup.py
passes24 synthetic-bank cases (counts0/1/3, bank offsets0/256, exact and short
names/missing entries). Real221-byte lookup executes; missing-entry fatal UI
intercepted before presentation. Capture
/private/tmp/ms91-resource-lookup-20261012-check1.json compared by native lookup:
all far pointers, identifier padding and required-missing failures match;
source banks remain unchanged. Browser throw versus DOS fatal presentation is
an explicit adaptation, not pixel equivalence. No code correction needed.
Whole item28 remains open, overall46/103 unchanged.

Outlined result text execution: check_original_outlined_text.py compares64
original legacy/modern wrapper cases (four x positions including32767, two y,
two cached heights, one/three-character text). Real colour setters execute;
measurement and glyph output are explicit service doubles. Original returned
bounds match signed-word x-1/x+width+1/y-1/y+height+1; SI/DI and stack preserved.
Capture /private/tmp/ms91-outlined-text-20261012-check1.json matches native
five transparent drawing positions/colours in every case. Modern uses retained
SI/DI/bounds for repeated coordinates; tested behavior remains unchanged.
This is request/bounds execution evidence, not complete wrapper structural
classification or full hardware pixels. Item28 open, overall46/103 unchanged.

Outlined wrapper structural closure: audit_original_outlined_text.py evaluates
every instruction of complete180-byte/72-op legacy and172-byte/64-op modern
straight-line bodies using symbolic modulo65536 linear expressions for x/y,
width/height and retained registers. Full call order/arguments and returned
bounds match for all word values, not just64 execution samples. Modern SI/DI
reuse and save/restore account for the instruction changes. Callee execution
is outside the symbolic tool; separate body/pixel evidence remains scoped.
Linked wrapper evidence in results ledger; unresolved references31 to30.
Item28 remains open; overall46/103 unchanged.

Disk-prompt wrapper execution: check_original_disk_prompt.py passes24 cases
across both versions, disk kinds1/2/3 and zero through three failed probes.
Actual wrapper executes with disk/resource/dialog/reset services doubled;
retry ordering, id1/id2/id3 selection, cleanup byte and SI/stack retention match.
Modern selects DS50B6 (EGA1111 pattern) instead of legacyDS4EC2 (4444).
This low-level disk-id prompt is not the browser's separate eihd saved-track
dialog: original MAIN.RES distinguishes eid3 "Insert Disk B" from eihd
"Please insert your track disk". Do not apply its colour change blindly to
the browser eihd fallback. Virtual-filesystem adaptation/full drive-check helper
classification still separate. Item28 open, overall46/103 unchanged.

File-search dependency verified: check_original_file_search.py compares complete
90-byte bodies, including failure JMP after first RETF, with explicit globals
and branch mappings. Executes32 cases across both versions, four DOS-style
patterns, two returned names and success/failure. DTA/set-search requests are
simulated; found-name reconstruction, AX null/non-null, SI/DI/DS/SP and source
pattern retention pass. Original treats colon/backslash, not slash, as directory
separators; this is captured, not blindly copied to browser path normalization.
No real disk access. Disk-prompt structural/host adaptation review remains
separate; item28 open, overall46/103 unchanged.

Prompt reset/drawing-state dependency: check_original_prompt_reset_state.py
compares complete17-byte reset wrapper,60-byte cursor-background restoration
and32/28-byte drawing-state save/restore helpers under explicit relocations.
No logical difference.16 actual save/restore calls verify complete60-byte state
round trips across both versions and four nonzero patterns, retaining DS/SI/DI
and stack. This is drawing/cursor cleanup, not a newly tested hardware mouse
reset. Cursor bitmap blitter remains a separate dependency. Source binaries
unchanged; no hardware/audio/file service executes. Item28 open,46/103 unchanged.

Bitmap dispatcher partition comparison: audit_original_bitmap_dispatch.py passes
6643-byte span including2647 actual code instructions,48 embedded jump-table
pointers,32 identical immutable mask bytes and one padding byte. Code/data are
separated: old6768..67C8/new68F0..6950 are96-byte tables; old7C1F is padding,
7C20..7C40 masks;7C40 starts the next function and is excluded.446 direct
branches map; all48 table targets are decoded code entries and relocate+0188.
Three indirect jump sites and external far tail209E:7D09/20E5:7E91 remain
explicit. Source behavior matches under named state/template/callee relocations,
but indirect callees/external decoder are not yet accepted. This resolves why
first-return/linear disassembly could not establish the helper boundary.
Item28 open; overall46/103 unchanged.

Bitmap indirect-kernel closure: audit_original_bitmap_kernels.py now follows all
direct targets after early near returns. Six kernel bodies match completely,
including shifted branches and their six byte-identical8-byte mask banks.
First-return19/23/25-byte prefixes alone were insufficient and are not accepted
as complete helpers. External tail7D09/7E91 is shared code inside decoder entry
7C40/7DC8, requiring earlier entry coverage; its separate transitive dependency
remains explicitly pending in tool output. No hardware-execution claim. Item28
still open, overall46/103 unchanged.

Shared bitmap decoder boundary resolved: complete old7C40..7EB3 /modern7DC8..803B
is627 bytes/272 instructions, including out-of-line blocks after three returns.
Final physical JMP loops back to an earlier return; following padding and
nine-byte mask bank are not instructions. Next font prologue is old7EBD/new8045,
not the later unclipped entry806D. All decoder instructions/branches and mask
bytes match under known relocations. Kernel audit now passes seven complete
bodies, zero unresolved body boundaries. Its rectangle-fill call5908/5A90 remains
a separate dependency; first-return176-byte rectangle scope is incomplete.
No pixel/hardware acceptance inferred. Item28 open; overall46/103 unchanged.

Rectangle-fill dependency code closure: audit_original_rectangle_fill.py passes
complete725-byte/311-instruction clipped and unclipped code,49 direct branches,
16 identical colour-mask bytes and no transitive calls. Last JMP goes to shared
return; following97 bytes are separate data before next prologue and excluded
from code. First-return176-byte scope was incomplete. Bitmap-kernel audit now
runs this dependency audit and reports its body comparison verified, retaining
hardware/pixel execution as unaccepted. No engine-specific fill change found.
Item28 open, overall46/103 unchanged.

Actual raw bitmap pixel verification: check_original_ms91_bitmap_pixels.py
executes original20E5:6407 dispatcher and real kernels, without rendering doubles,
into four software planes. Capture
/private/tmp/ms91-raw-bitmap-pixels-20261012-check1.json contains36 cases:
one/two/three-byte widths ×heights1/4/8 ×x0/1/7/8. Native unclipped raw-copy
renderer matches all1024 output bytes per case and preserves source bitmap.
No hardware/audio/file service access. This verifies real aligned/unaligned
raw-copy pixels, not clipping, compressed decoder or all operation variants.
Item28 still open, overall46/103 unchanged.

Clipped raw bitmap pixels verified: checker --clipped executes original63D5
and real dispatcher/kernels for81 cases (three widths ×three heights ×nine
positions crossing left/top/right/bottom and fully outside). Native clipped
copy matches all four256-byte planes in every case, source bitmaps unchanged.
Capture /private/tmp/ms91-clipped-bitmap-pixels-20261012-check1.json. Raw entry
references now link full code/table/kernel/rectangle body proofs and36/81 actual
software pixel evidence; results ledger reruns the structural dependency audits.
Unresolved result references30 to28. Compressed and physical hardware rendering
remain separate; item28 open, overall46/103 unchanged.

Compressed bitmap pixel verification:108 unclipped and243 clipped original/native
cases pass repeated/literal/mixed streams, three widths, three heights and
aligned/unaligned/edge positions. Actual decoder executes; all four plane bytes
and source immutability match. Correct captures:
/private/tmp/ms91-compressed-bitmap-pixels-20261012-check2.json and
/private/tmp/ms91-clipped-compressed-bitmap-pixels-20261012-check2.json.
The initial clipped-check1 capture used7DC8, an anchored positioned *unclipped*
entry, and failed against clipped native output; that capture is not acceptance
evidence. Source inspection located actual clipped7A96 and header-position
unclipped7E0A; checker routing fixed, production renderer unchanged. No pixel
mismatch remained in corrected corpora. Typecheck passed. Hardware and other
format/operation variants remain scoped separately; item28 open,46/103 unchanged.

Compressed decoder result reference linked after fresh full kernel/rectangle
audits and108/243 pixel comparator reruns. Ledger now records the positioned
compressed entry and its627-byte shared body, while preserving explicit
hardware/operation scope limits. Unresolved references28 to27; fresh dependency
inventory confirms27, not a narrative estimate. Remaining list includes dialog
body classification, file/resource services, result surfaces and input wrappers.
Whole item28 remains open, overall46/103 unchanged.

Browser result-dialog routing correction: base browser menu host has no engine
setting, so allocated result dialogs inherited legacy behavior even forMS91.
New bindResultDialogEngine binds actual runtime engine in packed/alternate
allocated results and panel engine in standalone results; missing metadata stays
legacy and cannot inherit a future-race default. New nine-case native dialog
regression crosses inherited/default and completed engines, checks wrap versus
clamp and backdrop/host reference preservation. Pass; added to dialog suite.
This is a local integration fix, not a live update. Other item28 dependencies
remain open; overall46/103 unchanged.

Result counter wrapper verified: check_original_result_counter_delta.py compares
complete6-byte wrapper and29-byte nested delta helper (not a keyboard-read
service), and executes288 cases across both versions. AX:DX equals unsigned
32-bit now-minus-previous across low/high word carry and wrap; previous snapshot
updates to now, live counter and stack retained. CLI/STI occur only inside
emulated CPU, not host hardware. Ledger independently validates code/field
identity and links execution evidence; unresolved references27 to26.
Item28 remains open, overall46/103 unchanged.

Cache-release dependency comparison: `audit_original_cache_release.py` verifies
the complete 19-byte wrapper, 169-byte allocator/cache release body and 83-byte
backward paragraph mover against both original EGA executables. All instructions
match after explicit global, far-call and internal-branch relocation. The last
resident descriptor does enter the cache-copy path; this agrees with existing
`freeResource` behavior and needs no speculative change. This is a complete-body
version comparison, not native runtime or fatal-dialog acceptance. Item28 stays
open; overall46/103 unchanged.

Cache-release runtime evidence: `check_original_cache_release.py` passes twelve
actual original executions (six paths per edition): last/interior release,
insufficient cache gap, descriptor/cache-edge equality, missing-resource fatal
dispatch and zero-page release. `test_cache_release_paths.ts` passes the same six
native fixtures, including unchanged caller memory. Original copies, returned
pointers, descriptor/cache updates and preserved registers match expectations;
missing stops before fatal UI. No files, audio or live stores touched. Full item28
and broader malformed/overlapping allocation coverage are not inferred.

Results dependency ledger now reruns the cache-release and resource-lookup body
proofs rather than leaving their existing evidence unlinked. Fresh complete
inventory passes:26 linked helper references and23 unresolved operand references
(previously26 unresolved). Fatal-resource presentation remains explicitly outside
these helper acceptances. Whole item28 and overall46/103 remain unchanged.

Cursor cleanup dependency ledger: fresh static comparison covers the17-byte
outer cleanup,60-byte nested cursor restore,32/28-byte drawing-state copies and
33-byte drawing-page restore, with the raw bitmap dependency already verified.
The new explicit static-only mode reports zero executions rather than claiming
runtime round trips; the separate full run still passes16 actual state-copy calls.
Fresh results inventory passes with27 linked helper references and22 unresolved
operand references (down from23). Hardware cursor behavior and whole item28 stay
open; overall46/103 unchanged.

Results ledger reconciliation: fresh complete-body proofs for EGA text drawing,
high-score loading, score-table rendering and score entry are now rerun and linked
by the inventory. Their scope explicitly excludes unresolved nested services;
this does not turn body equality into full browser or hardware acceptance.
Fresh inventory passes:31 linked helper references,18 unresolved operand
references (down from22). Whole item28 remains open; overall46/103 unchanged.

Explicit resource-pointer wrapper: full22-byte old14f6/new15f6 body passes
like-for-like comparison and forwards the same three stack arguments to the
already compared lookup body. Added to the repeatable lookup audit and results
ledger. Fresh inventory passes:32 linked helper references,17 unresolved operand
references (down from18). Input polling/release loops remain among the unresolved
helpers; no speculative menu/input changes made. Whole item28 stays open.

Results UI input bodies: `audit_original_result_input_poll.py` compares complete
branch-closed541-byte input poll,66-byte control-release wait and24-byte cursor
enable routines. All206 instructions match under explicit DS/call/branch
relocations. This is not the race-input function previously audited: it is the
separate UI polling path. Nested keyboard/control/mouse sampling and cursor draw
dependencies remain explicit, so these three references are not yet removed
from the17 unresolved ledger entries. No production input behavior changed.

Results input services: expanded `audit_original_result_input_poll.py` verifies
the complete31-byte BIOS keyboard poll (including the branch after its early
return),144-byte keyboard control-mask builder and440-byte joystick sampler
(including post-return tails). All217 service instructions match under explicit
field/call/branch relocations. Actual BIOS/port execution, key translation, mouse
sample and cursor draw remain separate; unresolved ledger remains17 rather than
claiming these service comparisons complete the input dependency tree.

Control-mask execution: `check_original_control_masks.py` passes2048 actual
original executions (all1024 ten-key combinations in both editions), including
the empty-key path with joystick disabled. `test_control_mask_combinations.ts`
passes all1024 matching native combinations, verifies keyboard input suppresses
joystick sampling and verifies fallback word masking. Held-key bytes and source
binaries remain unchanged. Physical joystick sampling is not inferred; whole
item28 remains open and unresolved ledger stays17.

Regression wiring: cache-release path and exhaustive driving-key combination
tests are now part of `npm run test:ms91-results`, not standalone-only evidence.
The expanded suite and TypeScript typecheck pass. Existing mouse-input exhaustive
capture concerns race steering and does not substitute for results UI polling.
No additional whole checklist item accepted;46/103 and17 unresolved references
remain current.

Menu input execution: `check_original_menu_poll.py` records256 actual modern
UI-poll executions with explicitly doubled keyboard/controller/mouse/cursor
services. `compare_original_menu_poll.ts` matches returned keys, all retained
input words/flags and ordered cursor events against native `pollOriginalInput`.
Coverage includes64 controller masks, four timing deltas including signed timer
rebasing and mouse inactivity, keyboard priority and mouse-button synthesis.
Capture: `/private/tmp/ms91-menu-poll-20261012-check1.json`. This verifies the
polling routine with host services, not cursor pixel drawing or physical input
hardware. Whole item28 stays open;46/103 and17 unresolved references unchanged.

Legacy menu polling preservation: checker now routes explicit1990/1991 service
addresses and DS fields.256 actual legacy executions match the native comparator;
all256 complete legacy captures also equal their modern counterparts, including
retained flags/words, return keys and cursor event order. Total512 original polling
cases now verified across both editions. Legacy capture:
`/private/tmp/ms90-menu-poll-20261012-check1.json`. Host service/cursor-raster
limitations remain explicit. Whole item28 open;46/103 and17 unresolved unchanged.

Cursor-show wrapper: complete139-byte/45-instruction old186e/new196e routine
matches after explicit resource-pointer, coordinate, division-unit and service
call relocations. Added as the fifth body in the cursor-state checker; static
mode correctly reports zero execution cases. Background save/page restore,
background capture, cursor preparation/render and final state restore retain the
same call order. The three remaining nested raster bodies are not inferred from
wrapper equality. Fresh results inventory passes with17 unresolved references;
whole item28 remains open,46/103 unchanged.

Cursor bitmap entries: `audit_original_cursor_bitmap_entries.py` separates each
pair of32-byte clipped/unclipped entry wrappers from its32-byte pointer table.
Both AND and OR entry pairs match, with all32 kernel pointers explicitly
relocated. First-return linear decoding would incorrectly interpret embedded
tables as instructions; the new audit avoids that. Individual AND/OR kernels and
background capture tail remain separate. No whole item accepted;46/103 and17
unresolved results references unchanged.

Cursor kernels: the expanded cursor bitmap audit passes all32 unique AND/OR
kernel bodies. Shifted variants jump backward into a shared seven-byte epilogue;
the audit verifies its exact bytes rather than decoding onward into unrelated
functions. All internal branches close and explicit retained-plane field
relocations match. This establishes full kernel code equivalence, not hardware
pixel execution. Background capture routine remains pending; item28 remains open.

Cursor background capture: full311-byte/128-instruction body including its
post-return tail and16-byte mask bank matches across editions. Cursor enable is
now linked in the results ledger with complete wrapper, background, AND/OR kernel
and state-helper comparisons rerun automatically. Fresh inventory passes with16
unresolved references, down from17. Hardware pixel/runtime acceptance is not
inferred. Whole item28 remains open; overall46/103 unchanged.

Menu key callback dispatcher: complete90-byte/40-instruction body matches under
explicit callback-table, ASCII/extended-key selector and reentrancy-flag
relocations. Includes all early-return tails and the indirect callback-table
call, whose target behavior is not inferred. This is not scan-code conversion.
Added to repeatable menu input body audit and inventory assertion (seven bodies).
Callback targets and mouse sampling remain separate;46/103 unchanged.

Menu mouse service: `check_original_menu_mouse_service.py` compares both complete
58-byte wrappers and passes384 actual original executions across both editions.
Coverage includes X-word boundaries, Y/button delivery and eight shift counts,
with the DOS interrupt bridge explicitly doubled. Coordinates, button state and
stack restoration match; no real mouse hardware called. Generic interrupt bridge
and key callback-target behavior remain separate. Whole item28 stays open;
overall46/103 and16 unresolved references unchanged.

Menu input ledger reconciliation: UI poll/release references now link their
complete-body comparisons, seven nested input bodies, mouse wrapper and cursor
dependencies.512 actual polling cases and384 mouse wrapper cases retain their
explicit host-service scope. Static-only mouse mode correctly reports zero
executions and no doubled bridge. DOS hardware/custom callback execution is a
host-adaptation boundary, not a claim of browser acceptance. Fresh inventory
passes with14 unresolved operand references (down from16); whole item28 remains
open and46/103 unchanged. Browser end-to-end input checks are still required.

Miscellaneous results wrappers: full60-byte entropy-seed wrapper and50-byte
animation resource cleanup match under explicit field, branch and far-call
relocations (`audit_original_result_misc_wrappers.py`). These are not number
formatters: inspection identified their actual roles. Nested seed services and
animation stop remain separate, while resource release already has execution
evidence. Whole item28 and14 unresolved references remain open;46/103 unchanged.

Seed dependency tree: complete40-byte linear generator,78-byte six-byte
generator,10-byte counter reader and52-byte multiply (including its second return
path) match across editions. Repeated by the misc-wrapper audit and linked to the
seed reference. Fresh results inventory passes with13 unresolved references,
down from14. Host timer behavior and animation stop remain separately scoped;
whole item28 stays open and46/103 unchanged.

Music fade dependency: complete251-byte/90-instruction original fade body matches
including both driver branches and final restore. New `test_music_fade_paths.ts`
passes1536 native cases across all256 initial volumes, both driver routes and
three signed-duration boundaries. Step order, pause flags, delays, stop count,
final alternate volume restore and unchanged initial volume are verified without
audio output. Original driver callbacks/timing execution remain separate;
cleanup reference and whole item28 remain open,46/103 unchanged.

Original fade execution:20 actual original cases across both editions and both
driver branches match the native expected volume/delay/wait/stop event sequence.
Zero, odd/even and maximum initial volumes are covered; retained source volume,
stack and SI survive. Audio/timer callbacks are explicitly doubled and no sound
played. Cleanup reference now links complete cleanup/fade/resource-release bodies
and their scoped execution evidence. Fresh inventory passes with12 unresolved
references (down from13); whole item28 and46/103 unchanged.

Plain resource discard: full59-byte/24-instruction routine matches, including its
jump to the already verified shared missing-resource tail. Added to allocator
body audit and results ledger; fresh inventory passes with11 unresolved
references, down from12. Native fade coverage has a named repeatable command
`npm run test:ms91-music-fade`, freshly passing1536 cases. Discard runtime remains
separate from this static comparison. Whole item28 and46/103 remain unchanged.

Bitmap allocation release: full80-byte/35-instruction body includes its fatal
out-of-order tail, ending at the next verified prologue rather than the early
return. Explicit retained-page-stack and allocator relocations match; both error
message strings match. Nested discard is already compared; fatal presentation
and runtime page release remain separately scoped. Fresh results inventory
passes with10 unresolved references, down from11; whole item28 and46/103 unchanged.

Window release execution:24 actual original runs across both editions and12
matching native fixtures pass valid release, wrong-order errors and missing
backing allocation paths with four height-word boundaries. Nested discard runs
unmocked; only fatal UI is intercepted. Retained window/resource stack pointers,
descriptor flags and successful-call register restoration agree. Native caller
memory remains untouched. This strengthens cleanup runtime evidence without
accepting fatal presentation or whole item28;46/103 and10 unresolved unchanged.

Resource-type dispatcher: complete code/data partition verifies61 paired
instructions and all nine jump-table entries. Only structural addition is the
explicit18-byte diagnostic basename prefix, not a loader selection change.
`audit_original_resource_dispatch.py` asserts the prefix instructions and all
branch/table targets. Nested loader and retry bodies remain separate; this
reference remains in the10 unresolved entries. Whole item28 stays open.

Dispatcher execution:36 actual original runs cover all nine resource routes,
success and cancellation across both editions. Loader choice/event sequence,
returned pointers and stack cleanup match. Modern diagnostic-prefix arguments
are asserted. Loaders, retry and diagnostic services are explicitly doubled,
not accepted as real file-loading coverage. Nested loader/retry review remains
open; whole item28 and46/103 unchanged,10 unresolved references remain.

Native dispatcher comparison: the36 original runs now export their common18
scenario capture, checked directly by `compare_original_resource_dispatch.ts`.
All nine loader routes, optional kinds1/7, retry/cancellation and returned native
pointers match both editions. Capture:
`/private/tmp/ms91-resource-dispatch-20261012-check1.json`. Results use raw/packed
RES/PRE plus opponent bitmap routes; codecs remain separately scoped. Whole
item28 and46/103 unchanged,10 unresolved references remain.

RES/PRE wrapper: complete134-byte/55-instruction code matches across editions.
New native fallback test passes18 cases using extension strings read directly
from both original executables, three names and first/second/retried success.
Filename construction, retry-choice2 being ignored by this particular caller,
returned pointers and unchanged source names are asserted. File loaders remain
service doubles and are separately pending; whole item28 and46/103 unchanged.

Original RES/PRE fallback execution:18 actual runs across both editions execute
real copy/append helpers, checking constructed filenames and first/second/retried
success. Both editions match, retain source names and ignore retry-choice2 in
this wrapper as documented. Loader/prompt services remain explicitly doubled.
The matching native fixtures and cleanup/control tests are grouped in
`npm run test:ms91-resource-lifecycle`. Whole item28 stays open;46/103 unchanged.

Raw-file loader body: full109-byte/43-instruction span covers explicit required,
optional and default-required entry paths plus the post-return zero-file tail.
All branches/calls match under explicit relocations, stopping at the next
verified prologue. Cache lookup, paragraph allocation, file-length query and
read-into-buffer dependencies remain separately scoped. No broad loader
acceptance inferred; whole item28 and46/103 unchanged,10 unresolved references.

Raw-file size query: complete164-byte body matches including three entry paths,
optional missing-file return, required fatal branch, seek-to-end/rewind/close and
paragraph ceiling arithmetic. This routine precedes the separate packed-file
size query, avoiding boundary overrun. DOS file services and size-boundary
execution remain separate. Whole item28 and46/103 unchanged,10 unresolved.

File paragraph query execution:64 actual original cases across both editions
pass zero/subparagraph/exact-boundary sizes,65535 bytes and1 MiB boundaries,
optional/required missing files, open/seek/rewind/close ordering and successful
register/stack preservation. DOS services simulated, fatal UI intercepted.
Original paragraph count wraps to zero at1 MiB; native raw loader intentionally
rejects counts above65535 instead of reproducing this unsafe allocation overflow.
That safety boundary is not ordinary shipped-resource compatibility acceptance.
Whole item28 and46/103 remain open/unchanged;10 unresolved references.

Native raw-resource boundaries:14 new cases pass missing/empty returns,1/15/16/17
byte allocation/copy and1 MiB rejection with optional/required host flags
forwarded unchanged. Oversized rejection leaves the allocation chain untouched;
all cases retain filenames. The host owns required-file failure presentation,
so this test does not claim DOS fatal UI compatibility. Allocator/codec dependency
comparison and whole item28 stay open;46/103 and10 unresolved unchanged.

Allocator/cache comparison: full181-byte allocator,109-byte cache compactor and
274-byte cache acquisition bodies match after explicit field/call/branch
relocations. All post-return/error tails are included; no first-return truncation.
Forward mover and basename helper dependencies remain separately scoped, so
the raw loader chain is not yet accepted. Existing results inventory now reruns
all eight allocator-related body comparisons. Whole item28 and46/103 unchanged.

Allocator dependencies closed at code-comparison level: complete72-byte forward
paragraph mover and32-byte basename helper match, with all branch targets inside
their verified bodies and no further helper calls. This joins the allocator,
cache acquisition, compactor and backward mover comparisons. Results inventory
rerun passes all ten allocator-related bodies. File-read/packed-loader chains and
whole item28 remain separately open;46/103 and10 unresolved references unchanged.

Parameterized read entry: raw-read body audit expands from130 to146 bytes,
including the actual20aa/20ac entry used by the loader.64 new original execution
cases through that entry with optional flag0 pass both editions, segmented and
short reads, open/read failures and retained tail bytes. DOS services simulated;
required fatal UI remains separate. Whole item28 and46/103 unchanged.

Packed loader partition: complete362-byte span contains354 code bytes and an
eight-byte table of two far decoder pointers, not six bytes of near pointers.
All147 instructions and both pointer relocations match. `audit_original_packed_loader.py`
separates embedded data from code and closes every branch including staging,
error and paragraph-resize tails. Decoder and resize execution remain separate;
whole item28 and46/103 unchanged,10 unresolved references.

Resource resizing: complete144-byte body includes shrink/expand returns,
non-last expansion errors, cache eviction and no-space tails. It matches under
explicit descriptor/high-water/error-string relocations; shared missing-resource
tail was already compared. Added as the eleventh allocator audit body. Decoder
and resize execution remain separate; whole item28 and46/103 unchanged.

Resize execution:40 actual original cases and20 matching native fixtures pass
shrinking, same-size, newest-block expansion, non-last expansion, missing
allocation and insufficient-space outcomes. Tests preserve partial descriptor
updates on space errors and untouched caller memory natively. Original shrink
returns requested pages in AX whereas successful expansion returns zero; the
test expectation was corrected, not production code. Fatal UI intercepted.
Decoder review and whole item28 remain open;46/103 unchanged.

Type2/VLE decoder: full649-byte/283-instruction body matches including post-return
branches and a shared jumped-to decoding tail. The initial519-byte boundary was
incomplete; the branch audit detected it and the scope was expanded before
acceptance. All direct branch targets now close within the audited body; there
are no external helper calls. Three retained CS workspace addresses are explicitly
relocated. A later verified prologue bounds the following data bank.
Execution and the type1/RLE helper chain remain pending; whole item28 open.

Type2 execution probe remains unresolved: twelve native synthetic one-bit
alphabet fixtures pass, but the first original fixture does not finish within
300000 instructions and leaves destination untouched (legacy IP431d/SPede6).
This is not accepted original/native parity or proof of an infinite loop. The
fixture/harness and original alphabet requirements need investigation, preferably
using shipped packed resources before changing production decoding. No production
decoder edited; whole item28 and46/103 unchanged.

VLE fixture investigation: a completely filled256-entry fast table overruns the
original initialization fill loop; changing to a partial two-width alphabet
resolves that harness fixture limitation.12 plain original executions (six sizes
per edition) now pass bytes, untouched output tails and register/stack restore.
Additive fixture still mismatches at size7: original11fc0d1e2f4051 versus native
11011223132435. No production change is justified yet; investigate original
flag/alphabet behavior and shipped resources. Explicit `--plain-only` reports
additiveVerified false. Full additive compatibility remains unproven.

Additive VLE trace: mismatch occurs when the synthetic second-width symbol
enters the slow decoding tail; captured AL/CH/DX events show this is not merely
an unfinished emulation run. Original signed BH width handling with the high flag
also differs from the plain fixture. This trace does not yet justify rewriting
the native decoder or treating the synthetic alphabet as shipped-compatible.
Investigation remains open; no production code changed.

Shipped VLE execution: all55 type2 first stages in the modern PRE/PVS/VSH
directory pass110 actual original executions across both editions, with identical
SHA-256 output hashes and untouched output tails. Native comparator matches all55
hashes including MISC/OPP resources. Capture:
`/private/tmp/ms91-shipped-vle-20261012-check1.json`. This covers first stages, not
remaining multi-pass stages or synthetic additive flags; those scopes remain
explicit. No production decoder change; whole item28 and46/103 unchanged.

Type1/RLE code comparison: complete535-byte span includes both near helpers and
their post-return tails. Every direct branch and near call closes within the
verified instruction set; its only far dependency is the already compared
backward paragraph mover. Full body matches across editions. Execution and
remaining multi-pass stages are still separate; whole item28 and46/103 unchanged.

Full shipped compression pipeline:55 PRE/PVS/VSH resources contain101 stages
(55 type2,46 type1);46 resources are multi-pass.202 actual original stage
executions feed each original output into the next stage, and all edition hashes
match. Native byte-pipeline comparator matches all101 hashes. Capture:
`/private/tmp/ms91-shipped-packed-20261012-check1.json`. No stage uses additive
type2 flags; that synthetic edge remains documented. Staging/allocation lifecycle
and loader integration are separately scoped; whole item28 and46/103 unchanged.

Allocated packed integration: all55 shipped resources pass native real allocator,
packed staging/multi-pass decoding and final paragraph resize, matching original
final output hashes. Resident descriptor size and retained allocation high-water
including four staging paragraphs are asserted; caller memory stays unchanged.
This does not compare every retained staging byte against the original whole
loader. Whole-loader execution remains separate; whole item28 and46/103 unchanged.

Whole packed loader parity:110 actual original runs cover all55 shipped files
with allocator/cache, file sizing, staging copies, decoders and resize unmocked;
only DOS services simulated. Native comparator matches final and entire retained
allocation hashes for every file, including staging tails. Capture:
`/private/tmp/ms91-whole-packed-20261012-check1.json`. RES/PRE reference now links
the full scoped dependency evidence and repeatable static proofs. Fresh results
inventory passes with9 unresolved references, down from10; whole item28 remains
open and46/103 unchanged. Synthetic additive edge remains separately documented.

Three-pixel border wrapper: original366-byte versus modern330-byte bodies differ
by register/local reuse. Symbolic word arithmetic proves all twelve line calls
have identical arguments/order for all16-bit coordinates/dimensions/colors;
retained SI/DI/BP restore identically. New `audit_original_border_wrapper.py`
covers every instruction, not sampled screenshots. Line-service execution and
the larger labelled-button wrapper remain separate; whole item28 stays open.

Border reference reconciliation: full62-byte line-service dispatch wrapper
matches, including clipping rejection and zero-length raster skip. Combined with
all-word symbolic border call proof, the reference is now explicitly classified
as wrapper-equivalent. Pixel clipping/raster execution remains a separate scope,
not accepted by this classification. Fresh inventory passes with8 unresolved
references (down from9); whole item28 and46/103 unchanged.

Labelled button execution:160 actual original cases across both editions compare
complete638/602-byte wrapper request streams: fill, twelve border lines, colour,
text measurement and final text positions. Empty/single/multiline labels, small
extents and signed coordinate boundaries match. Copy/length helpers execute
unmocked; drawing and measurement services are explicit doubles. Full structural
classification and native integration remain separate; whole item28 stays open.

Native labelled-button comparison: all80 common scenarios from160 original runs
match native fill/border geometry and text placement using the same six-pixel
measurement fixture. Native interleaves horizontal/vertical lines of the same
colour; comparison allows this commutative reordering, not mixed-colour changes.
Capture: `/private/tmp/ms91-labelled-buttons-20261012-check1.json`. No production
change required. Full structural classification/pixel execution remain separate;
whole item28 and46/103 unchanged,8 unresolved references.

Labelled-button prefix proof: all394/358 prefix bytes are symbolically covered,
including fill, twelve lines and the null-label branch. The36-byte difference is
equivalent local/register reuse for all word inputs; null-label exit targets
are explicitly checked. Text tail is a separate244-byte span awaiting complete
relocation proof. Two test-only TypeScript typing errors were corrected and
typecheck rerun passes; production code untouched. Whole item28 remains open.

Complete labelled-button classification: symbolic394/358-byte border prefix and
exact244-byte/93-instruction text tail cover both full638/602-byte wrappers.
All text-tail branch/call/workspace relocations are explicit. Combined with160
original requests and80 native comparison cases, this reference is now linked
in the repeatable results inventory. Fresh audit passes with7 unresolved
references, down from8. Nested pixel scope remains separate; item28 stays open.

Results window allocation: complete374-byte like-for-like EGA allocator matches
including all plane/row descriptor writes and fatal tail. Old EGA98ca target is
verified from actual results call sites, avoiding the unrelated canonical MCGA
6060 layout. Dependency allocator bodies already compared; memory execution and
fatal presentation remain separate. Fresh inventory passes with6 unresolved
references, down from7; whole item28 and46/103 unchanged.

EGA window allocation execution:72 original runs across both editions and36
native comparisons pass three widths, four heights (including320x200 results
surface and200x100 alternate) and three plane masks. Real original allocator runs;
complete descriptor bytes with retained0x7d fields, bitmap header bytes and page
counts match after only the row-table pointer relocation is normalized. Capture:
`/private/tmp/ms91-ega-windows-20261012-check1.json`. Whole item28 stays open.

Disk prompt scope correction: results use kind4, whose resource key is id4 and
probe pattern opp1.*. Earlier kind1..3 coverage omitted this actual results route.
Expanded checker passes32 actual original cases across kinds1..4, both editions
and zero through three retries. Resource/dialog/reset/probe services remain
doubled; source colour fields preserved. Full body difference classification
remains pending; whole item28 and46/103 unchanged,6 unresolved references.

Disk-prompt full classification: complete89/85-byte loops reduce to36 identical
core instructions after explicitly verifying saved SI/index reuse. All four
resource keys/probe patterns match; color pattern changes4444 to1111 are verified
from original data, not flattened as relocation. Combined with32 retry executions,
the reference is linked as scoped original behavior. Browser progress/eihd prompt
remains a separate adapter. Fresh inventory passes with5 unresolved references,
down from6; whole item28 and46/103 unchanged.

Timed selection outline: full118-byte timer wrapper and137-byte four-rectangle
dispatcher match under explicit retained counter/color/cursor relocations.
Nested counter, cursor and clipped rectangle bodies have separate complete
proofs. This classifies the wrapper reference, not browser timing/pixel execution.
Fresh results inventory passes with4 unresolved references, down from5;
whole item28 and46/103 unchanged.

Outline timing arithmetic:110 original cases and55 direct native comparisons
match counters around30/60, signed32767/32768 and65535 wrap with five deltas.
Inclusive60 endpoint and signed comparison retained. Explicitly isolated
arithmetic segment stops before drawing; timer service doubled. Capture:
`/private/tmp/ms91-selection-flash-20261012-check1.json`. Browser timing/drawing
still separate; whole item28 and46/103 unchanged,4 unresolved references.

Sprite display wrapper: complete137-byte body matches including immediate mode-2
and timed four-plane/input-exit paths. Explicit window/cursor/timer/input and
bitmap service calls are relocated; all branch targets close, including the
early immediate-mode return. Plane-display and blocking-input helpers remain
separate, so this reference is still unresolved. Whole item28 and46/103 unchanged.

Sprite dependencies: full15-byte input forwarder and492-byte patterned plane
display code match, including post-return kernels,16 indirect handler pointers,
schedule/mask and port-selection tables. No external helper calls in plane body;
hardware pixel execution remains separate. Sprite wrapper is now linked with
verified input/cursor/counter/raw-bitmap dependencies. Fresh inventory passes with
3 unresolved references, down from4; whole item28 and46/103 unchanged.

Item28 actual allocated opponent-animation loading passes72 cases: allsix
opponents, both win/lose banks, allthree selected display formats, two complete
replacement cycles. New test_allocated_evaluation_resources.ts uses the real
common-state initialization, selected-format loaders, heap and frame lookup;
repeated release is safe and input initial-data bytes remain unchanged. No score
writes or live requests. This verifies native resource integration only, not
original DOS loader equivalence or visual animation playback. Whole item28 stays
open; overall46/103 unchanged.

Item28 music-resource wrapper now complete: legacy198D:2266 and modern22E4
are91 bytes/35 instructions and match under explicit retained-pointer, enabled
flag and call relocations. Added to audit_original_result_misc_wrappers.py; full
suite passes. It loads kinds5 then4 and forwards the returned pointers to music
initialization/start. This does NOT close its dependency: initializer legacy
2DAF:0002..009B versus modern2E0E:000E..00B8 has genuine differences. Legacy
sign-extends the byte at resource+4 before multiplying by8; modern zero-extends.
Legacy writes a computed far pointer directly to the returned control block;
modern passes it by address to helper1464 instead. Modern returns the saved
control pointer explicitly. These branches and nested music helpers require
runtime/native comparison before acceptance. No production behavior changed;
three result references and whole item28 remain open, overall46/103 unchanged.

Item28 modern music initializer pointer helper resolved:2E0E:1464..14AB is
71 bytes/26 instructions, a four-byte bytewise copy with16-bit source/destination
offset wrapping. New check_original_music_pointer_copy.py executes144 actual
original cases includingFFFF crossings and verifies caller BP/SP and unchanged
binary. No services doubled, no sound/files. Thus this helper is not an extra
playback-state transformation. test_music_container_pointer.ts passes16 bundled
score/device seeds: retained container pointers match count*8+container+1, all
counts below128, so the initializer's signed/unsigned count change does not alter
these supplied scores. Already initialized banks and seed files stay unchanged.
This is not full initializer/driver/browser timing acceptance; item28 and three
remaining references stay open. Overall46/103 unchanged.

Item28 original music initializer envelope executed72 cases across both
editions: counts0/1/7/127/128/255, loaded flag0/1, successful lookup and either
missing lookup. Missing returns null without setup; already loaded returns the
same control pointer without writes; fresh initialization calls setup then
relocation, marks loaded and writes the computed container pointer. Modern
four-byte copy runs unmocked. Results confirm signed legacy versus unsigned
modern count at128/255, but all16 supplied score/device seeds avoid that range.
check_original_music_initializer.py explicitly doubles lookup, instrument setup
and sequence relocation; their full bodies and audio/browser timing remain
separate. Existing native high-count behavior is not claimed legacy exactness
for arbitrary custom banks. No production change or live data write; whole
item28 remains open, overall46/103 unchanged.

Item28 whole original music sequence relocation now executed without service
doubles: legacy2DAF:105E and modern2E0E:1190 run all nested string/resource/copy
helpers on TITL/SLCT/VICT/OVER supplied KMS banks. Eight original executions and
eight complete-bank native comparisons match every output byte across both
editions. New check_original_music_relocation.py and
compare_original_music_relocation.ts preserve all input binaries/resources.
Accepted capture /private/tmp/ms91-music-relocation-20261012-check2.json.
Initial check1 used separate SS/DS, violating near stack-name lookup's original
SS==DS contract; it produced repeated incorrect track pointers and is NOT an
accepted oracle. Corrected harness reproduces native bytes without changing
production code. This closes supplied-score sequence relocation, not arbitrary
custom banks, instrument initialization, playback timing or whole item28.
Overall46/103 unchanged; no audio or live data operations.

Item28 full music resource initializer parity now verified for shipped content:
check_original_music_relocation.py --initialize executes32 original cases
(both editions, four scores, AD/PC/TD/MT voice banks), with every nested lookup,
instrument-pointer setup, percussion lookup, sequence relocation and pointer
copy running as original code. Complete resulting KMS bank bytes, returned
header pointers and allseven percussion far pointers match native loadSoundEffect
through compare_original_music_relocation.ts --initialize. Voice banks, input
scores and original binaries unchanged; no mocked services, audio or live data.
Capture /private/tmp/ms91-music-initialization-20261012-check1.json.
This closes bundled resource initialization, not the subsequent start/playback
service or browser audio/timing; music wrapper reference and whole item28 remain
open. Overall46/103 unchanged.

Item28 original music-start envelope now verified48 cases across both editions:
resource null, blocked, uninitialized and ready with counts0/1/7/127/128/255.
check_original_music_start.py checks reset/driver/sequence request ordering,
allseven sequence arguments, retained track count, accumulator0, interval128,
active flag and update lock. Signed legacy versus unsigned modern instrument
count also appears here; ready supplied-score counts remain below128. Failed
guards leave the lock set after reset, matching original control flow; no native
guard change inferred. Reset, driver callback and sequence initializer are
explicit test adapters, not claimed original hardware/native timer parity.
No audio, live data or production changes. Whole item28 remains open and
overall46/103 unchanged.

Item28 timer initializer evidence extended using existing checker rather than
duplicating it: check_original_effect_pointer.py --all-slots executes1008
original cases across both editions and all24 timer owners (including music
and reserved slots), checking offsetFFFF crossings, segment0/1234/FFFF,
complete72/76-byte records, adjacent timer preservation and modern extra-word
clearing. Capture /private/tmp/ms91-all-timer-pointers-20261012-check1.json.
Existing native effect comparison still passes336 cases from this capture;
music-slot native startup is NOT inferred from effect-slot comparisons and
remains a separate integration check. No devices/audio/live data operations.
Whole item28 remains open; overall46/103 unchanged.

Item28 supplied-score load/start/timer integration now passes32 original
executions across both editions and four scores/devices. Existing resource
checker --initialize --start runs actual complete resource loading plus start
routine and timer initializer; only reset and driver output are silent adapters.
compare_original_music_startup.ts verifies200 active music timer records across
37 initializer-written shared fields each against native startup seeds, modern
extra words zero, track count, accumulator0 and interval128. Capture
/private/tmp/ms91-music-startup-20261012-check1.json. Seed files unchanged.
Reset-retained fields, callback pointers, reserved internal timer and actual
driver/browser timing are deliberately excluded from this bounded comparison;
whole music wrapper and item28 are not yet accepted. Overall46/103 unchanged.

Item28 reset boundary distinction verified12 original cases: music reset
legacy2DAF:288 and modern2E0E:2A6 stops owners0..15, runs actual null-resource
initializer for0..15, clears music active/track count and releases update lock,
then invokes voice update. Effect timers16..23 remain byte-identical when voice
stop/update are explicit silent adapters. Covers master0/127/255 and timer fill
0/AA. New check_original_music_reset.py passes. This is NOT the same contract
as native resetAudio, which currently resets all24 timers and hardware voices.
That native helper also serves complete race-audio initialization/shutdown;
caller scope must be reviewed before any behavior change. Existing separate
music runtime startup uses prepared seeds and does not directly call resetAudio.
No speculative production fix; complete reset/voice integration remains open.
Whole item28 and overall46/103 unchanged; no audio/live data operations.

Item28 music wrapper reference now classified with explicit ownership: complete
91-byte outer wrapper matches; whole bundled resource initialization and active
music timer startup comparisons are linked in audit_original_results_inventory.
Original/native output timing, reset/driver adapters and callback ownership are
still OPEN sound-category gates, not accepted by this results-boundary link.
Caller review finds resetAudio used by full race initialization/exit helpers;
music runtime startup uses separate prepared seeds, so no reset scope change was
made. Fresh results inventory reports2 unresolved references, down from3, and
wholeItemAccepted remains false. Remaining refs are the resource dispatcher and
full dialog. Whole item28 and overall46/103 unchanged; no live changes.

Item28 sound dispatcher dependencies inspected directly: kind4/5/6 wrappers
have identical successful filename/extension/prefix fallback requests but modern
adds conditional missing-resource fatal handling when DS4EEC is nonzero.
check_original_sound_bank_routes.py executes72 cases across both editions,
three kinds, enabled flag0/1, required flag0/1 and successful attempt1/2/none.
Request sequence matches both editions; modern fatal guard is verified with
explicit loader/fatal-presentation doubles. Native loadNativeSoundBank currently
returns null for exhausted fallback and leaves error/retry presentation to its
host; do not claim identical DOS fatal UI. Missing bundled resources already
throw through browser owners. Full filename-loader/bitmap dependencies and
resource-dispatch reference remain open; overall46/103 unchanged.

Item28 inner sound fallback now verified: full292-byte/104-instruction bodies
match under explicit filename-prefix and raw/packed/builder call relocations,
including post-return branches through next prologue. Misc wrapper audit passes.
check_original_sound_fallback.py executes64 original cases with actual filename
builders/string helpers, plain/path names and existing KMS extensions, success
on each of seven attempts or complete miss. Both editions produce identical
request streams. compare_original_sound_fallback.ts verifies allseven native
filename requests in four complete-miss cases, unchanged input names, real
cache miss path and optional reads. Raw/packed file services are explicit
original test doubles; successful native allocation/decoder paths remain
covered separately, not inferred from these missing-file cases. Capture
/private/tmp/ms91-sound-fallback-20261012-check1.json. Resource dispatch still
has remaining bitmap dependencies; whole item28 and overall46/103 unchanged.

Item28 full opponent EGA bitmap resource pipeline now verified: existing
check_original_whole_packed_loader.py --bitmap executes24 original complete
loads across12 OPP win/lose PVS banks and both editions, including actual
selection, decode/unflip, palette conversion, packing, allocator release and
compaction. Only DOS file/directory services are virtual. New
compare_original_opponent_banks.ts matches every final allocated-bank byte and
paragraph count for all12 native loads against both original editions. Capture
/private/tmp/ms91-packed-opponents-20261012-check1.json. Original binaries and
files unchanged; no graphics hardware/audio/live data used. Other display
formats and missing-resource presentation are not inferred from this EGA corpus.
Whole resource dispatcher reference and item28 remain open, overall46/103
unchanged.

Item28 bitmap coverage extended to ordinary planar and indexed loaders:
48 further whole original loads and24 native complete-bank comparisons pass
for all12 supplied opponent banks in both editions. Together with packed path,
72 original loads/36 native full-bank comparisons match exact allocated bytes.
Captures /private/tmp/ms91-planar-opponents-20261012-check1.json and
/private/tmp/ms91-indexed-opponents-20261012-check1.json. Fatal hook now targets
only actual error entry, reducing per-instruction test overhead. Generic loader
regression rerun passes110 executions/all55 shipped resources; typecheck passes.
Resource dispatch reference is now classified with explicit DOS retry/fatal UI
and absent historical-format adapter boundaries. Fresh results inventory has1
unresolved reference, the full dialog, down from2; wholeItemAccepted remains
false. Whole item28 and overall46/103 unchanged; no live data changed.

Item28 full dialog dependency discovery refreshed: legacy body1907 bytes/654
instructions versus modern2163/719, both branch-closed through post-return tail.
Nested backdrop owner has an added modern depth==3 early-failure guard; resource
size availability still gates allocation. Modern also reuses retained ES for
the second30-byte drawing-state copy instead of reloading its far pointer.
Browser presentation deliberately captures a complete screen with its own
allocator, rather than claiming exact DOS rectangle-allocation behavior.
New test_nested_dialog_backgrounds.ts passes18 actual allocator-backed restores
across three display modes, depth3 and two cycles, pixel-exact LIFO restoration
and harmless repeated dismissal. This does not prove arbitrary-depth DOS parity
or classify all37 full-dialog structural groups. Whole item28 remains open,
overall46/103 unchanged; no score/live writes.

Item28 direct dialog input coverage expanded beyond prior two/three choices:
check_original_ms91_dialog_input.py --expanded and native comparator pass16520
original/native cases for counts1/4/5/6/7/8/10, covering the actual ten-choice
modern graphics menu. Representative enabled/disabled patterns, every selected
and hover index, no key/Enter/Space/Escape/Y/N case variants/up/down are tested.
Original release-input service is explicitly doubled; full original iteration
and native selection/done results match. Capture
/private/tmp/ms91-dialog-expanded-20261012-check2.json. All-disabled masks are
excluded because navigation has no selectable item; no arbitrary-menu or browser
hardware claim. Full-dialog structural classification remains open, overall
46/103 unchanged. No audio/graphics/file/live services executed by emulator.

Item28 larger-menu content/geometry now direct: --menus adds actual modern
Graphics (ten choices), Options (seven) and Replay Menu (eight) text to the
original layout/content checker. All132 content cases and132 outer-bound cases
match native implementation over font heights6/8/10/12 and centered/explicit
positions. Text lines, editable-field placement, every choice hit area, bounds,
outline requests and initial color requests are compared; measurement uses an
explicit unit-width test font and graphics/cursor services are test adapters.
Captures /private/tmp/ms91-dialog-menu-layout-20261012-check1.json and
/private/tmp/ms91-dialog-menu-bounds-20261012-check1.json. Actual-font browser
rendering and complete structural classification remain separate open scopes.
No source resources, stored scores or live site changes. Overall46/103 unchanged.

Item28 full-dialog audit is now reproducible in audit_original_full_dialog.py:
complete branch-closed1907/2163-byte bodies,37 structural groups,23 paired
operand-change candidates and7 initially unmapped paired branch targets.
Four groups (measurement accumulation/group gap, NUL-loop branch rewrite,
centered Y and bottom bound) classified with direct original layout evidence;
33 structural groups remain, all23 operand candidates still explicitly pending.
This inventory is not acceptance. Proportional FONTN measurement now executes
the actual original routine rather than unit-width adapter;132 larger-menu
content cases match native real-font widths and hit areas. Renderer/input
services remain explicit adapters; artificial font-height variants do not
claim changed original glyph bitmap heights. Capture
/private/tmp/ms91-dialog-real-font-20261012-check1.json. No production changes.
Whole item28 and overall46/103 unchanged.

Item28 full-dialog structural classification advances8/37,29 remaining:
new font-pointer guard/font-derived row cache, shared failure epilogue, outline
bottom geometry and text-row advance added to the four prior classifications.
check_original_dialog_guards.py passes8 actual original cases, verifies null
font versus non-null far pointer, backdrop failure/success boundary, -1 return
and caller SP/SI/DI preservation. Backdrop-retention argument is explicitly1;
with0 the original skips capture, so an initial harness assumption was corrected
before accepting evidence. Cursor/measure/backdrop services are explicit adapters.
All23 operand candidates and remaining structural groups stay open; whole item28
and overall46/103 unchanged. No production/audio/live changes.

Item28 full-dialog classification now19/37 structural groups,18 left, plus
18/23 operand candidates classified,5 left. Text/field table register reuse,
choice index reuse, variable row-height hit bounds, } group flushes, equivalent
parser branches and NOP removal linked to direct content/geometry evidence.
Shared cursor/input/counter/drawing call relocations linked to prior complete
helper proofs. Character-classification256-byte table compares byte-identical;
text/disabled default color words equal. Character scratch shifts two bytes for
new row-height local. Two remaining operand pairs are suspected sequence-aligner
artifacts (outline versus font-color and @ versus }); do not classify these as
real service/predicate changes without correcting semantic correspondence.
Other three are still-unclassified nested dialog services. Original real-font
content comparator rerun passes132 cases. Whole dialog and item28 remain open;
overall46/103 unchanged. No production/live changes.

Item28 dialog structural classification advances31/37,6 remaining: original
disabled startup scan, up/down wrapping, equivalent repeat/key predicates and
padding now linked to original navigation/startup/input corpora. Fresh16520-case
expanded native input comparison passes. Nested backdrop restoration helper
legacy198D:120 and modern124 also compares full192 bytes/81 instructions under
explicit field/call/branch relocations, including two30-byte state copies,
bitmap restoration, resource release and cursor services. Hardware presentation
is still separate; native18 nested actual software backdrop tests already pass.
Five operand candidates remain pending until nested service links/correspondence
are fully checked. Whole item28 and overall46/103 unchanged; no live changes.

Item28 remaining nested dialog services compared completely:83-byte/43-op
mouse hit-area lookup matches enabled guard, signed inclusive rectangular edges
and first matching choice;42-byte delay wrapper and10-byte atomic clock read
also match under explicit field/call/internal-branch relocations. Added to misc
wrapper audit, whole suite passes. Together with prior192-byte backdrop restore,
these classify three remaining service operand changes. Dialog operand inventory
now21/23 classified,2 left (suspected alignment artifacts); structural31/37,
6 left. Actual host mouse/timing are not accepted solely from static bodies.
Whole item28 and overall46/103 unchanged; no production/live changes.

Item28 dialog operand review now23/23 classified,0 remaining. Explicit decoded
instruction assertions correct two shape-aligner artifacts: old367 outline
matches modern3AC outline, not added3BB color setter; old3F2 @ predicate matches
modern486 @ predicate, while450 is new } handling. No bogus outline-to-font or
@-to-} behavior change inferred. Semantic counterpart sites are retained in the
audit JSON. Structural31/37 remains,6 unresolved, and wholeDialogAccepted false.
No production behavior changed; whole item28 and overall46/103 unchanged.

Item28 structural classification now36/37,1 remaining (backdrop capture owner),
all23 operands classified. Full original dialog setup tested with retained
background3426 seeded7FFF:132 real-font larger-menu content cases explicitly
reset it0 and match native line/field/choice geometry and color requests.
Audit asserts the sole full-body direct write is3C3 storing0; later selected,
unselected and disabled backgrounds read the retained zero rather than old
literal zero. Extra initial identical color call and its stack cleanup are
classified alongside corrected outline correspondence. Arbitrary external/
reentrant mutation of the background field is not claimed. Seven initially
unmapped paired branch correspondences still require explicit review before
full-dialog acceptance. Capture
/private/tmp/ms91-dialog-background-reset-20261012-check1.json. Whole item28
and overall46/103 unchanged; no production/live changes.

Item28 nested backdrop depth guard now direct: original modern198D:0008
executed for depths0/1/2/3/4/255. Exactly3 returns failure0 with correct caller
SP; other values pass the guard and stop before arithmetic/allocation. This is
an equality guard, not an inferred greater-than-or-equal limit; malformed depths
4/255 are NOT claimed safe captures. check_original_dialog_guards.py retains
all8 full-dialog font/backdrop guard tests and passes6 new depth cases. Backdrop
owner body/classification and7 branch correspondences remain; no acceptance
invented from the guard alone. Whole item28 and overall46/103 unchanged.

Item28 seven remaining paired dialog branch correspondences classified with
explicit site/target assertions: measurement/choice paths enter added } handling,
selected/disabled drawing branches enter retained-zero background paths, and
up/down repeats enter modern wrap-aware navigation instead of legacy clamp.
One further sequence-aligner artifact corrected: old3F6 @-test branch matches
modern48A targeting4D4, not inserted }-test branch454. Audit records semantic
counterpart and destination pairs instead of claiming raw target equality.
Fresh16520 original/native input comparisons pass. Remaining counts: structural
1, operands0, branch correspondences0; wholeDialogAccepted remains false because
the nested backdrop capture owner and final integration scopes remain open.
Whole item28 and overall46/103 unchanged; no production/live changes.

Item28 all37 full-dialog structural groups now classified. New
audit_original_dialog_capture.py compares complete277/284-byte capture bodies
under explicit fields/calls, finding exactlythree groups: depth==3 guard,
equivalent unsigned-low-word availability failure branch sharing the earlier
epilogue, and second drawing-state copy reusing ES from prior LES DI. All old/
new direct branch instructions/targets asserted. Nonaliasing caller-owned state
bank is explicit precondition; malformed aliasing and hardware not inferred.
Combined full-dialog inventory now has0 structural,0 operand and0 branch
correspondence gaps, but wholeDialogAccepted remains false pending final
integration/scoped dependency acceptance. Whole item28 and overall46/103 remain
unchanged; no production or live changes.

Item28 connected allocator-backed dialog interaction passes36 cases across
both engine identities, allthree display modes, actual modern Options/Graphics
menus and legacy three-choice menu. Real bundled fonts, display drawing and
background capture join native input/session flow. Up-key clamp versus wrap,
mouse hover on inclusive right/bottom edges, Enter acceptance and Escape cancel
return expected selection and restore every original framebuffer byte exactly.
No mocked font/layout/drawing, score writes or live access. New
test_allocated_dialog_interaction.ts plus nested backdrop and evaluation-loader
checks are now included in test:ms91-dialog/test:ms91-results. Actual browser
event/audio/presentation checks remain separately scoped before release; whole
item28 still awaits final acceptance audit. Overall46/103 unchanged.

Item28 accepted: complete original finish/result routine difference audit has
all11 structural groups and all180 operand-change references classified, with
zero unresolved references. Nested full dialog has37/37 structural groups,
23/23 operand candidates and all branch correspondences classified. Capture/
restore differences explicitly bounded to native full-screen presentation;
malformed custom-resource aliasing and nonbundled formats are not invented as
supported features. Original arithmetic/input/resource/font corpora and expanded
test:ms91-results pass;36 connected allocator-backed dialog cases cover both
engines/three displays. Fresh test_global_score_native_results passes4/4 with
zero skipped, including actual completed MS91 fixture, copy-only download,
import/reload reproducing final car state and isolated score preservation.
All writes in that test are memory-only private fixtures, never live tables.
Browser events/presentation and audio timing remain explicitly OPEN in separate
checks36/39/43/45/47/55–71 and final release gates; this acceptance does not
close them or authorize publication. Standalone static auditors deliberately
do not own checklist acceptance. Next engine check29: ten-minute behavior.

Item29 native boundary evidence refreshed: three actual fresh stationary races
run12005 captured ticks with explicit engine routing, legacy20Hz/modern20Hz/
modern10Hz. Buffer prompt occurs exactly12000 frames (600/600/1200 seconds),
once, Continue Now restores input/audio callback order and rolls checkpoints/
input bytes without car crash. Existing test omitted capture helper engine
argument; corrected both calls, production callers already pass actual engine.
Fresh original6 legacy/12 modern recording-tail captures match complete native
checkpoint and input buffers, including far-offset wrapping. Captures
/private/tmp/ms90-rollover-20261012-check1.json and
/private/tmp/ms91-rollover-20261012-check1.json. Two genuine >10-minute finished
race proofs also pass isolated server verification for both engines, zero skipped.
This does not establish that the unmodified original legacy game freezes or
prove browser prompt presentation; remaining original prompt/control handling
must be reviewed before item29 acceptance. No live scores/replays touched.
Overall47/103 unchanged.

Item29 actual prompt mismatch fixed: check_original_recording_full.py executes
24 original cases across both editions, inactive/active pending flag, previous
done0/1 and choices0/1/FFFF. Dialog argument order confirms initial choice0
(Continue Now), not1 (See Replay); the pushed1 was backdrop retention. Native
handleNativeRecordingFull and boundary assertion corrected accordingly. Ordered
suspend/pause/resource/dialog/resume/counter/release and mode4 replay requests,
Escape-to-continue handling and pending/done flags match original envelope.
Service callbacks remain explicit test doubles, no hardware/audio. Fresh native
12005-frame boundary races pass allthree engine/rate combinations; typecheck
passes. No stored replay/score changes. Item29 final integration audit still
open; overall47/103 unchanged.

Overall acceptance checks:53/103 verified,50 remaining,51.5%.
Working item IDs are labels, not completed counts. Moving43→44 does not mark43
complete. Report that distinction and identify unfinished acceptance evidence.

| Category | Verified | Left |
| --- | ---: | ---: |
| Engine & physics | 25/26 | 1 |
| Sound & music | 8/17 | 9 |
| Graphics, menus & devices | 7/17 | 10 |
| Replays & scores | 11/13 | 2 |
| Backups, final tests & deployment | 2/25 | 23 |
| Documentation & GitHub | 0/5 | 5 |

For each update show: overall verified/total and remaining; active category's
verified/total and remaining; actual current check; new evidence passed since
last update; what still prevents completion. Show partial evidence as named
passed/pending subchecks, never invented fractional completion or elapsed-time
percentages. Categories partition the103 items exactly once. No status changed
by this reporting change. Detailed evidence continues below.

Current sound evidence: item43 real title/menu PCM generation and original/
remixed switching verified; browser result-score transitions pending. Item44
instrument callback/table and158-instruction operator region match after
relocation; controller/pitch/volume/status helpers now verified as described
below, while remaining startup/timing classification is pending.

Item44 controller update: added exact relocation comparisons for the36-byte
dispatcher (19 instructions),206-byte pitch/volume helper region (103), and
107-byte status/detection region (52 instructions). Five controller pointers match +004E and
all point into the already compared operator region. Pitch lookup72 bytes and
volume lookup120 bytes compare unchanged. Detection preserves its300-poll
limit and status-mask/return-carry logic; this does not prove physical OPL timing.
Changed write helper remains version-specific: legacy repeats four port writes
and uses PIT latch/status delays; modern uses retained cache, one port write per
address/data and calls its PIT-delay helper with1 before/after data. Full startup
and timer-helper classification remain required. Packages remain unchanged.

Item44 callback/timer update: thirteen fully decoded ordinary callback/reset
regions (352 instructions) compare exactly using explicit external-reference
classes, operator/velocity/result storage offsets and guarded local branches.
References into startup code are classified relocations, not audited bodies.
Modern AD15 04F6..0527 is byte-identical to modern MT15 0195..01C6 (50 bytes).
The existing PIT-delay test passes its register retention, low/high read order
and inclusive polling boundary. Physical elapsed time is still host-dependent.
Remaining: embedded dispatch regions, startup bodies and complete timing
classification. Item44 stays open; do not mistake callback parity for a full
driver audit. Original package hashes unchanged.

Item44 startup update: the two remaining callback regions now compare exactly;
fifteen ordinary callback/reset regions cover528 instructions. Startup matches
in detection order (388,318,288,218), controls, nine-voice reset and return value,
except two explicit changes: legacy initial PIT setup is removed; modern cache
initialization occurs only after successful detection. An initial inspection of
the sample IRQ tail found another real timing change: status-port read loop
count5 becomes10. That tail must be included in the full classification before
item44 can close; do not assume ordinary music parity covers sample playback.

Latest audio cleanup: user requests one persistent browser tab for native mute.
Test tab10 is unavailable; live inventory reports zero local tabs. Do not create
a replacement without user direction. Removed the temporary zero-gain facade,
mute query handling and misleading muted dataset. Only local observe-mode sample
diagnostics remain, still rejected by the release guard until removed. Music
lifecycle tests pass after cleanup. Browser result QA remains pending.

Baseline: 2026-10-11. This replaces the 50 grouped progress items for reporting.
Scope remains the full approved upgrade and safe release, not just audio.
Each entry is an acceptance check, not every assertion or every possible replay.
Any newly discovered requirement must be added explicitly, changing the total.
Passed entries retain the bounded evidence in MS91-RELEASE-CHECKLIST.md and
MS91-CURRENT-RELEASE-STATUS.md; they do not imply the untested final default passes.
Source backup is reopened because later audio edits postdate the restored archive.

Total: 103; completed: 45; remaining: 58; progress: 43.7%.
Current: #45 — Tandy differences and integration. Browser item43 remains pending.

Item45 first findings: original TD15 length2993→3241; both supplied Tandy banks
are byte-identical (TDENG1.VCE912,TDSKIDMS.VCE2528). Read-only package audit
fully decodes26 legacy and15 modern startup instructions; both return six
channels. Legacy installs DOS INT15 sample callback; modern has no vector
installation and writes direct DAC control at C4. This is a real device-host
difference, not just file relocation. Browser still loads legacy2993-byte driver,
uses BIOS sample requests and legacy memory offsets. Do not merely substitute
modern bytes: sample/control routing and remaining callbacks need audit and
implementation. Original packages unchanged. Item45 remains open.

Item45 table/sample audit: gain and original PC pitch-table prefix unchanged;
the modern PC lookup area adds120 bytes. Entire464-byte tone/sample/noise table
region matches after +0078 relocation. Tone gain/latch tables match after +0099.
New sample code hooks IRQ0, outputs to C5, restores saved timer/vector/mask, and
has a separate nibble-decoding branch. That is not equivalent to the current
BIOS request host. Modern frequency conversion routes channel0 through the
PC-tone divisor branch rather than the legacy sample branch; modern voice
update selects its PSG table for channel0..3. These changed sample paths require
explicit version routing and isolated original comparison before integration.
No runtime default, stored replay/score or production asset changed.

Item45 decoder evidence: implemented explicit MS1991 ordinary-buffer differential
sample step, matching original high/low nibble phase, signed delta addition with
8-bit wrap, retained sample byte and suppression of duplicate C5 output. Isolated
Unicorn capture ran2000 original modern TD15 IRQ cases with virtual ports only;
phase/state, pointer advancement and emitted sample writes all match. Source
archive checksum unchanged. Corpus: /private/tmp/td15-differential-20261011-a.json.
Scope excludes end-of-buffer reload, IRQ chaining, timer/PIC scheduling and browser
integration. Existing game does not yet call this module; item45 remains open.

Item45 full IRQ component: stepMs91TandySampleIrq implements one explicitly
delivered modern raw/differential IRQ,buffer wrap/repeat stop,EOI or prior-handler
chaining and exact timer/PIC/vector restoration.512 isolated original IRQ cases
match complete driver bytes,IVT,ordered port writes,source samples and return
kind. Corpus /private/tmp/td15-full-irq-20261011-a.json. No physical outputs;
archive unchanged. Scheduling,initial sample setup and browser host integration
remain outstanding. This is not yet a functional modern Tandy browser path.

Item45 sample-start component: idle-device setup matches512 original calls,
including complete driver bytes,frequency clamping100..20000Hz,PIT divisor,
raw/differential vector/buffer setup,repeat low-byte,zero-length early return,
saved PIC mask and ordered output writes. Corpus:
/private/tmp/td15-sample-start-20261011-a.json; virtual ports only,package checksum
unchanged. Prior active transfer is explicitly rejected until stop request and
actual IRQ completion,not silently treated as instantaneous. Start/stop/IRQ
lifecycle tests cover both sample formats. Browser host/scheduling remain open.

Item45 sample clock host: explicit modern timer host now connects start/stop,
raw/differential IRQ bodies,ordered output writes,PIT0 reload and prior game IRQ
chaining. Uses shared integer sample-clock math,retaining fractional overshoot
when the callback restores the old divisor. Raw and differential transfers match
across4800-frame versus17/100/333/4350 split blocks,including complete driver,
ports,chain offsets,timer/PIC/vector restoration and clock phase. Disabled or
masked IRQ delivery windows fail explicitly rather than invent latency/drop an
interrupt. CPU/PIC arbitration is still an owning-host responsibility. This
module is not yet enabled in browser race/music; generation/state and browser
integration plus broader regressions remain outstanding. No physical playback.

Item45 versioned controls: explicit boot-generation layout now supplies legacy/
modern driver size,velocity/gain storage,volume/tone latch fields,note scratch and
sample divisor. Tone/volume/controller/instrument/frequency/divisor helpers accept
an optional generation; omitted remains legacy.3072 volume/gain cases plus latch,
controller,frequency/divisor and default-legacy assertions pass; decoder/IRQ/host
suite also passes. Browser/native callers still omit modern generation until the
full codec and lifecycle routing are ready. These are unit contracts against
audited fields,not an original-executable control corpus or browser acceptance.

Item45 state/resource: explicit driverGeneration now selects complete2993/3241
byte driver snapshots in the Tandy memory codec; omitted preserves legacy object
shape and size. Exact whole-memory round-trip,last-byte retention,independent
snapshot ownership and size/generation mismatch rejection before writes pass.
Modern TD15 is retained as a separate exact-checksum source resource; each call
returns an independent copy. Legacy catalog and shared public assets unchanged.
Runtime lifecycle callers still remain legacy until remaining modern note/voice
and startup routing is integrated. These additions do not change stored replay
identities or default future-race physics. Typecheck passed for codec changes.

Item45 note-start component: modern0669 logic now matches512 original note
cases for complete driver/voice state and generated sample-start requests,
including noteFF retained registers,channel pitch tables,velocity and raw/
differential repeat choice. Original sample-start boundary was intercepted and
recorded; its implementation was verified independently earlier. Corpus:
/private/tmp/td15-note-20261011-a.json; no actual audio or archive mutation.
1536 additional channel/note contracts plus sample request and legacy-driver
rejection tests are registered. Browser note/voice/lifecycle routing still open.

Item45 ongoing voice: explicit modern voice-update logic matches1000 original
cases for complete driver/voice state,retained CX and all ordered virtual ports
across PSG,sample,PC speaker,pitch bend/modulation and inactive/mute branches.
Differences preserved: current pitch always written to voice+6; channel0 updates
C6/C7 and modern divisor/volume fields without BIOS requests; PC channel consults
its retained volume before enabling output. Public helper accepts optional
generation to dispatch modern; omitted stays original legacy. Corpus:
/private/tmp/td15-voice-20261011-a.json. Dispatch/inactive/unit tests pass.
High-level allocated wrappers,driver startup and browser still await generation
propagation and sample request ownership. No default switched or records changed.

Item45 shipped-resource inventory: all198 car instruments across11 cars/both
physics profiles and92 menu music patches exclude DAC channel0.4400 actual
allocated engine/crash callbacks pass on the retained legacy sound driver;
this does not prove modern allocated integration. Existing supplied Tandy BIOS
host already rejects general/custom sample playback. This bounds the existing
browser feature scope,not the original game's hardware capabilities.
Modern idle lifecycle helpers now implement audited init/silence/shutdown and
channel-stop behavior without BIOS vector installation. The original CMP AX,0/JB
sample-stop branch is unreachable; channel0 follows tone writes as in the binary.
Active sample silence still requires explicit stop completion before proceeding.
Unit lifecycle tests pass; original-corpus lifecycle verification and high-level
generation propagation remain before activation. Generic sample IRQ components
remain isolated for fuller future hardware-host support.

Item45 native integration: boot generation propagated through Tandy engine,
effect,voice-timer,control/mute/stop/reset callbacks,allocated state/dialog and
native device startup. Modern TD15 loads exact separate resource; old public
callers still omit generation. Both sound generations/both physics versions
run all11 cars:396 instruments exclude channel0,8800 allocated engine/crash
callbacks pass without modern BIOS requests. Generic sampled instruments still
fail explicitly,as they were unsupported in the existing supplied browser host;
the independently verified sample components are not silently treated as wired.
512 original idle lifecycle captures also match complete driver/ports. Music
generation routing and browser QA remain required for item45.

Item45 menu integration: Tandy music runtime/control/host now accept explicit
boot generation. Modern driver starts from exact resource,initializes its idle
state,and transfers captured logical velocity/gain fields to audited new offsets;
immutable legacy seeds remain unchanged. Four scores/20000 ticks retain exact
sequence clock,timers,voice ownership/duration,last notes and menu control state.
Only documented voice current-pitch bytes6/7 are excluded from cross-version
voice equality; modern callback behavior is independently original-code tested.
No modern BIOS requests. OpeningSequence passes the selected future engine to
Tandy menu music and both demo/race sound devices; public default remains legacy.
Race reload keeps boot sound identity separate from replay physics. Music,all-car
callback/reload suites and typecheck pass. Actual browser/setup/output QA still
required; generic sample host remains separate from the shipped tone-only path.

Item44 original-code evidence: AD15 operator region MS90 0537..067C /
MS91 0585..06CA is fully decoded (326 bytes,158 instructions each). Exact
normalized comparison matches after explicit OPL-write target and verified
operator-table relocation mapping. Every branch target is inside the region
or the known writer. Original package hashes unchanged. Operator packing and
voice-helper logic in this region introduce no additional version difference.
Controller helper and full initialization/hardware timing remain unclassified;
this bounded result does not complete item44 or prove hardware timing parity.
No live release or historical-record mutation authorized by a percentage.

1. [x] Explicit engine identity and legacy fallback. (Original gate 1)
2. [x] Versioned route/opponent resources across switches. (Original gate 2)
3. [x] All-car bounded engine/grip/contact corpus. (Original gate 3)
4. [x] Original 10/20Hz steering tables. (Original gate 4)
5. [x] Previous-position cache initialization/codec. (Original gate 5)
6. [x] Checkpoint capacity/growth input preservation. (Original gate 6)
7. [x] Versioned snapshot round-trip. (Original gate 7)
8. [x] Modern checkpoint body-cache restoration. (Original gate 8)
9. [x] Original player capture parity. (Original gate 9)
10. [x] Original opponent capture parity. (Original gate 10)
11. [x] Integrated movement/roll/crash corpus. (Original gate 11)
12. [x] Integrated tunnel-height corpus. (Original gate 12)
13. [x] Underside/tunnel selection corpus. (Original gate 13)
14. [x] Allocated load/growth/failure/cross-engine lifecycle. (Original gate 14)
15. [x] Marco legacy divider playback. (Original gate 15)
16. [x] Isolated migration preserves nine tables. (Original gate 16)
17. [x] Private backup/restore lifecycle corpus. (Original gate 17)
18. [x] Copy-only engine-labelled exports. (Original gate 18)
19. [x] Import cadence/identity/rejection lifecycle. (Original gate 19)
20. [x] Renderer regression corpus. (Original gate 20)
21. [x] Ranking/consent/offline/retention regression. (Original gate 21)
22. [x] Broad existing feature regression baseline. (Original gate 22)
23. [x] Classify remaining exceptional chassis branches. (Original gate 23)
24. [x] Classify chassis transitive helpers. (Original gate 23)
25. [x] Close chassis differences against original captures. (Original gate 23)
26. [x] Complete timer/input-loop differences. (Original gate 24)
27. [x] Complete race initialization differences. (Original gate 24)
28. [x] Complete finish/result differences. (Original gate 24)
29. [x] Verify ten-minute limit behavior in both engines. (Original gate 24)
30. [x] Package identities and checksums. (Original gate 25)
31. [x] Classify all shared decoded resource differences. (Original gate 25)
32. [x] Jaguar cockpit header and unchanged pixels. (Original gate 25)
33. [x] Complete upgraded menu text/resource routing. (Original gate 25)
34. [x] PC driver bounded original control/output corpus. (Original gate 25)
35. [x] PC all-car resource and allocated routing corpus. (Original gate 25)
36. [x] PC browser menu-music integration. (Original gate 25)
    Selected boot engine now reaches the PC music controller. Exact modern
    driver prefix/init and seven inactive slots are installed by a guarded
    pre-sequence seed adapter. Four scores/20000 ticks/384000 PCM samples and
    simulated Web Audio controller transitions/control/disposal pass via
    test:pc15-versioned-music. Legacy seed bytes remain unchanged. Both-edition
    real browser listening is confirmed at gate68. Original E2/E3 execution
    (72 cases) proves disputed51..54/67 fields are loop scratch, not callbacks.
    Original full timer loop (120 cases) dispatches only active track indices;
    retained unused owner6 is not dispatched for scores with fewer tracks.
    Full reset/start comparisons plus16000-tick retained-versus-original scratch
    differential and driver/resource checks complete the startup evidence.
    Earlier callback-installation blocker was a field-classification error.
37. [x] Roland original callback/init/upload corpus. (Original gate 25)
38. [x] Roland allocated startup/replay/dialog generation. (Original gate 25)
39. [x] Roland browser transport timing and full music. (Original gate 25)
    2026-10-14 acceptance reconciliation: user now reports testing the quoted
    final1991 Updated browser race/result transition check and hearing no
    Original leak. Together with earlier Original Roland acceptance70,
    all-four Suno loop approval, bounded original-note/timing differential,
    full-song actual-Munt render spans and current package/fade/lifecycle
    evidence, this closes the Roland/music integration check for the tested
    configuration. No every-device or every-browser extrapolation; unspecified
    device intersections remain tracked at47. No hardware-cycle or exact
    instrument-by-instrument Suno transcription claim. Historical pending
    statements below are superseded only at this accepted scope.
    Current evidence reconciliation2026-10-14: the user approved all four
    actual-Suno loops and confirmed Updated transitions/switching; the final
    MS91 Original Let's Drive slowdown also explicitly passed at70. Earlier
    reconstruction and sustained-note pending statements below are historical,
    not new requests for stems or replacement recordings. Current packaged
    hashes/approval, all-score Updated fades, three Original Menu fades and
    edition handover/power recovery pass with real synthesis and mocked WebAudio.
    Remaining final integrated browser/audio matrix is shared with47; these
    scheduler tests do not themselves establish live audible acceptance.
    Latest user clarification2026-10-14: use the actual Suno recordings for
    Updated music ONLY. Fix timing, loops and transitions as for1990; no
    reconstructed or resynthesized replacements. Original music retains the
    selected original sound driver unchanged. Earlier reconstruction acceptance
    wording below/historical evidence is superseded by this explicit scope.
    2026-10-14 acceptance audit (gate remains open): the earlier pending
    valid-live-finish subcheck now has actual QALAP91 keyboard finish2493ticks,
    exported2513-frame recording and independent originalMS91 differential
    capture68. Evidence is retained outside public/Git in
    verification-artifacts/ms91-original-replays-20261014 at the parent workspace.
    This closes that subcheck only, not full audio acceptance. Actual IAB
    menu→drive→menu trace85 has zero scheduled gaps and returns without saving;
    Node original/remix Victory repeats pass ten isolated runs, but a separate
    all-score run recorded26.41ms gap. Later live diagnostics identify a late
    refill with negligible render duration; bounded150ms runway now covers
    repeated105ms callbacks in fixtures. Two live1991 transitions and the full
    16-case original/remix-control timing matrix pass with zero scheduled gaps.
    This characterizes and mitigates bounded callback lateness, not arbitrary
    main-thread stalls or complete audible acceptance.
    Remaining: verify actual Suno recording timing, loops and transitions
    against original Roland playback, without replacing the recordings;
    complete final both-edition browser/audio acceptance. Do not repeat a
    natural-finish test as a substitute for these remaining requirements.
    Extended oracle executes original primary/nested IRQ bodies with original
    voice/music/MT15 routines for6000 callbacks/song. MIDI/timestamps, retained
    counters and normalized terminal voice records match all four scores.
    Explicit virtual PIT/I/O profile, callback/voice/null-memory installation
    fixtures and single pending PIC edge remain declared. This replaces the
    earlier outer-IRQ double at this bounded scope, not physical-machine proof.
    2026-10-13: loopback timed OpeningSequence explicitly integrates exclusive
    menu clock and shared music/race ownership. Both editions' live crash/
    results/replay/menu transitions observed, not valid live race finish or
    listening proof. Fade sync now prevents its two-tick wait starting before
    sound delivery reaches CPU command return; real Munt checks all50 waits,
    preserved51 packets, final50-tick handover and cancellation. Modern guarded
    run decreases55/62 ->22 in virtual fixtures; live1991 max19 remains unchanged
    from startup through transition, no measured music-buffer gap. User's
    sustained-note report remains pending audible/original-fidelity comparison.
    2026-10-13: four actual original1991 sequence/voice/MT15 bodies now match
    replacement across6000 callbacks per score, all MIDI bytes/PIT timestamps
    and normalized voice records, including repeats. Explicit virtual5-clock
    polls,16 installed voices, retained Title null-memory fixture and modeled
    skip-on-busy dispatch; extended outerIRQ evidence above uses explicit
    registration rather than a complete original DOS installation.
    Original80-case common-duration oracle exposed1990 wrap versus1991 retain0;
    explicit modern routing implemented with legacy behavior preserved. Real
    Munt stream/factory generation/cleanup tests pass and Menu browser lifecycle
    smoke passes. Local timed opening/race/replay/menu integration now passes
    crash cycles; enhanced-recording note alignment, full valid live finish
    and final browser/listening verification remain required; gate stays open.
40. [x] AdLib original cache/init corpus. (Original gate 25)
41. [x] AdLib allocated startup/replay/dialog routing. (Original gate 25)
42. [x] AdLib bundled score sequencing/cache corpus. (Original gate 25)
43. [x] AdLib browser output and score-switch integration. (Original gate 25)
    User confirmed listening tests in both editions: driving/gear/crash,
    replay crash, win/loss music and pause/resume/results without stuck or
    overlapping sound. Registered AdLib score-switch/controller/cache and
    real bundled OPL result-integration suites rerun successfully.
44. [x] Complete AdLib helper/timing classification. (Original gate 25)
45. [x] Complete Tandy differences and integration. (Original gate 25)
    Allocated legacy effect path now resolves live sample descriptor rather
    than omitting sampleAt. Both-physics synchronous/program BIOS/write/full
    memory parity and atomic invalid-descriptor rejection pass;512 original
    legacy note cases and512 modern regression cases pass. Shipped tone banks
    still pass8800 callbacks and80 actual allocated pause/resume cycles.
    Legacy sample/tone compositor now passes exact split-buffer PCM, live DMA,
    busy/repeat/completion/volume and explicit simultaneous-event ordering.
    Fake-Web-Audio adapter pause/resume/disposal parity also passes. Its caller
    formerly supplied BIOS/CPU/DMA timing externally; named virtual legacy
    owner and automatic sampled browser wiring now implemented and verified.
    User confirms both-edition menu/driving/crash/replay/win-loss/pause-resume
    listening and retained device selection after reload. Modern direct-DAC
    sample renderer passes raw/differential IRQ and split-block tests with
    explicit reset/byte-conversion/CPU window. Generic legacy samples now pass
    both-physics/rate allocated and automatic browser PCM/full-memory parity,
    segment/repeat/drain/abort/replay lifecycle tests. Functional completion
    audited in docs/TANDY-PHYSICAL-TIMING-EVIDENCE.md; no vintageCPU-cycle or
    analog accuracy claim. Whole-site audio gate47/finalrelease checks remain.
46. [x] Complete non-audio geometry/resource differences. (Original gate 25)
47. [x] End-to-end audio modes/settings regression. (Original gate 25)
    Completion audit2026-10-14: combine accepted Original-device listening/
    settings at45/68/69/70/71, user-approved actual Suno loop listening and
    final ordinary Updated transitions, unchanged distributed package hashes,
    automated failure/cancellation/pause/fade ownership checks, and actual
    final-package browser output observations below. This is orthogonal
    coverage, not a claim that each possible device/outcome was physically
    listened to again: all five selected devices now have actual TITL/SLCT
    exclusivity, race-effect output and OVER result samples. Shared result
    selection is device-independent: native-race-results passes only the
    panel outcome through originalResultMusic; outcome0 selects VICT, every
    other outcome selects OVER. The result/music matrix regression covers
    solo, win, tie, unfinished and loss. There is no separate loss recording
    to prove again for each device. Earlier wording requesting a full Cartesian
    device-by-outcome repetition is superseded by this explicit source-backed
    coverage audit, not silently treated as performed.
    Final actual VICT2026-10-14: export a new, no-overwrite QAVICT2.RPL from
    normal native input simulation on the existing private QA course, Indy/
    Auto versus Bernie/LM002. Rehearsal902ticks=45.10s, no crash/penalty,
    opponent unfinished. Independent replay/score-verifier run confirms full
    route902ticks, canonical roundtrip, engine routing and checkpoint rewind.
    File2730bytes,SHA256 a984afcdc7796fec06d1a4f2ddf3d91c01ccf9f30743834018d5dc9ac22e1c3e.
    Ordinary private upload/import as Mindscape1991 adds only this named replay;
    existing QA_LIVE track is reused. Loaded via native Options, played through
    transport, rewound to43.70s and continued through the explicit ineligible
    warning. Normal held Up crosses the line; native results45.05s(cont),
    opponent52.65s, average53mph,top69mph and opponent's losing evaluation.
    No result injection/public submission/save. VICT buffer2294120frames@44100,
    loop25.9705..51.770875,gain1,peak0.3873; simultaneous nonzero original
    Munt512-frame buffers gain0. No captured warnings/errors. Evidence:
    /private/tmp/ms91-updated-victory-output-probe-20261014.json and
    /private/tmp/ms91-updated-victory-result-20261014.png. This is a continued
    actual opponent win, not a fresh eligible score proof; fresh race/finish
    acceptance remains independently recorded at56, and audio selection has
    no continuation-specific branch. The source replay remains unchanged.
    PC Speaker missing TITL sample now supplied separately:2130067frames,
    gain1, original nonzero512-frame buffers gain0; evidence
    /private/tmp/ms91-updated-pc-title-output-probe-20261014.json.
    Restored Roland MT-32 in Setup, saved/reloaded, observer undefined. Suno
    distribution hash check passes unchanged. These samples are not continuous
    capture or new physical listening. Broad final site regression85 and all
    release/data/publication gates stay open.85/103 (82.5%),18 remaining.
    2026-10-14 victory-test correction: originalRaceResultOutcome explicitly
    returns2 for solo driving, even on a successful finish; originalResultMusic
    maps that to OVER. Therefore another fresh SOLO lap cannot close VICT.
    Required remaining case is a winning opponent result, not merely a finish.
    Added direct result/music matrix regression for completed/unfinished solo,
    opponent win, tie, opponent unfinished and loss; all7 result tests pass.
    Actual browser continuation: loaded retained QALAP91, fast-played then
    rewound with transport to2:02.55; selected Continue Driving and accepted
    the explicit no-high-score warning. Normal held Up crossed the finish:
    results2:04.05(cont),18mph average,45mph top. This establishes actual live
    continuation/finish but NOT VICT: decoded recording is correctly OVER.
    Probe installed after the existing remix gain graph was created, so its
    empty Suno pathGains do not establish gain/silence; original nonzero Munt
    buffers did have gain0. Do not interpret this as new exclusivity evidence.
    Evidence /private/tmp/ms91-updated-continued-solo-finish-20261014.{json,png}.
    No score submitted, replay saved or game outcome forced. Removed observer,
    restarted and reloaded; observer undefined. Gate stays open84/103,81.6%.
    2026-10-14 remaining device output smoke: ordinary MS1991 browser races
    with Updated music and PC Speaker, Tandy, AdLib and Sound Blaster selected
    separately in native Setup. Each reached a natural DEFAULT crash and DNF
    result without modifying inputs, result statistics, source or saved files.
    The temporary forwarding-only WebAudio observer found SLCT at gain1 and
    nonzero original music buffers at gain0 for all four menu samples. Tandy,
    AdLib and Sound Blaster also positively contained TITL at gain1/original0;
    PC Speaker title was not captured and is not claimed. Race-entry samples
    contained nonzero native effect buffers at gain0.6. Each settled DNF result
    positively contained OVER (2700639 frames@44100Hz, loop30.51853125..60.989)
    at gain1, and nonzero original music buffers at gain0; additional effect
    buffers, where present, were silent. An early Tandy sample was still the
    crashed windshield with silent effects, not results; the subsequent settled
    result sample is the evidence used. These are output-path samples, not
    continuous capture or physical listening. Evidence JSON and result PNGs:
    /private/tmp/ms91-updated-{pc,tandy,adlib,sb}-output-probe-20261014.json
    and /private/tmp/ms91-updated-{pc,tandy,adlib,sb}-result-20261014.png.
    No captured warnings/errors. Restored Roland MT-32 through native Setup,
    saved, reloaded and confirmed the observer is undefined. No production
    access or score submission. Fresh-race victory remains unverified; gate47
    stays open and progress remains84/103 (81.6%),19 remaining.
    Loaded-replay DNF explained, not changed: native allocated replay entry
    sets flags4; initialized-player-driving maps that bit to preserveStats.
    updateCrashState updates live event words but retains savedStats, and the
    results reader deliberately consumes the saved899A snapshot. Reused actual
    original captures ms90/ms91-finish-events-20261011-check1.json: all14 legacy
    and42 modern active-player finish cases with preserveStats set retain the
    exact prior saved statistics. Extended finish-timer regression verifies
    preserved snapshots without suppressing current event statistics at10/20Hz;
    passes. No runtime change or repeat original-executable run was needed.
    A loaded replay's evaluation is therefore not a suitable substitute for
    the remaining fresh-race victory transition. Do not modify snapshots or
    result outcomes just to make that audio test pass.
    Victory-path attempt limitation2026-10-14: browser catalogue contains
    retained QALAP91.RPL (4339 canonical bytes). Loaded through Options/Load
    Replay, rewound using the transport, and played all2:05.65 at normal native
    fast-play speed. Returning to Evaluation still shows retained DNF/zero
    statistics and selects OVER, not VICT. Therefore neither the initial load
    nor full replay transport establishes a victory result-music transition;
    do not repeat this route as a victory test or mark it passed. Evidence:
    /private/tmp/ms91-loaded-replay-retained-dnf-20261014.png. No submitted
    score or saved/imported replay was created. Temporary output observer was
    restored and then removed by reload; preview left idle. After an app/tool
    interruption the former tab and port5191 listener were confirmed absent;
    restarted the same local preview, now retained exec session52686, and opened
    a replacement in-app tab. This recovery is not a production deployment.
    2026-10-14 actual browser output observation, MS1991/Roland/Updated:
    non-mocking temporary CDP observer forwarded native WebAudio calls unchanged
    and sampled active decoded PCM plus settled connection-path gains. Title:
    2130067 frames@44100Hz,loop24.11046875..48.05084375,gain1,peak0.3972;
    simultaneous nonzero original512-frame Munt buffer had gain0. Natural
    driving had nonzero512-frame race output,gain1,peak0.4180. After a natural
    crash, actual DNF results reached OVER:2700639 frames@44100Hz,
    loop30.51853125..60.989,gain1,peak0.5064; nonzero original buffer gain0.
    Return to Menu played SLCT:4242929 frames@44100Hz,
    loop48.08084375..95.9615625,gain1,peak0.4032; original buffer gain0.
    No captured warnings/errors. Evidence:
    /private/tmp/ms91-updated-roland-output-probe-20261014.json and
    /private/tmp/ms91-updated-output-gain-results-20261014.png.
    These are sampled native decoded/output-gain observations, not physical
    listening or a continuous all-sample capture. Initial at-start observations
    were discarded because future gain automation had not settled; one early
    menu label still belonged to title and is not menu evidence. A bounded
    source-history ring also omitted older long sources, so absence alone was
    not interpreted as silence. Final retained observations positively contain
    each named recording and original buffer. Monitor restored prototypes,
    Restart stopped playback and reload removed all temporary state; no shipped
    source, replay, score or sound-device setting changed. Victory and remaining
    device intersections are still open; don't repeat these measured phases.
    2026-10-14 ordinary-browser continuation: selected1991 with Updated music,
    entered driving using held native Enter, accelerated/shifted into a natural
    crash at22.05s, then Replay Menu -> Return to Evaluation reached real DNF
    results (61Mph average,62Mph impact,83Mph top speed). No mocked results,
    submitted score, imported file or saved replay was used. No captured
    warning/error logs. Screenshot:
    /private/tmp/ms91-updated-natural-crash-results-20261014.png.
    A fresh startup subsequently delivered final ms91-v2 slct.mp3,vict.mp3 and
    over.wav with HTTP200. The diagnostic event buffer was truncated during
    startup; fetching a score is not proof that it played, and graph events do
    not establish audible exclusivity. Thus this adds actual DNF lifecycle and
    encoded-asset delivery evidence, not missing victory/loss/device listening
    acceptance. Playback stopped with Restart; ordinary tab remains Ready with
    Updated graphics/music selected. CDP Network/WebAudio observation disabled.
    Latest user result2026-10-14: quoted final1991 Updated browser race/result
    transitions tested, no audible Original leak. Accept that check without
    repeating it. User did not enumerate selected sound devices or individual
    victory/loss outcomes; do not silently mark every device intersection
    tested. Earlier Original-device and persistence approvals remain accepted.
    2026-10-14 final-gap reconciliation (avoid duplicate listening requests):
    do not repeat accepted PC/AdLib/Tandy original driving/replay/crash/results
    or saved-setting checks68/69/45/71. Roland accepted behavior70 and the
    corrected1991 menu fade also remain valid. Four short Suno loop approvals
    are limited to their audition scope; current package hashes/loop bounds,
    exclusive Original/Updated output, delayed-title mute, pause/resume and
    fade ownership have passing automated coverage with declared doubles.
    Remaining exact integration evidence is ordinary browser delivery of the
    final encoded MS1991 Suno package across title/menu, race entry and actual
    victory/loss results, with no Original-output leak on each selected device.
    The existing full-song Munt test and WebAudio render-capacity samples do
    not establish that combined output. Prior browser flow was Roland-only,
    and forced test results use mocked presentation. Complete only those
    missing intersections; do not re-run accepted original-device matrices.
    2026-10-14 audit: PC Speaker/AdLib listening evidence at68/69 and Tandy
    acceptance at45 remain valid at their tested scope. Setup persistence at71
    is separate from Roland listening at70. Final cross-mode race/replay/results
    regression must use the final music/runtime assets, not experimental offline
    candidates or mocked WebAudio. No final suite claimed from interim passes.
48. [x] Continuous moving tunnel/roof passage corpus. (Original gate 26)
49. [x] Original loader/menu divider replay in both versions; expected tree collision behavior concluded at user-clarified scope. (Original gate 27)
50. [x] Audit direct simulation callers/cache requirements. (Original gate 28)
51. [x] Fresh 10Hz browser race finish and result. (Original gate 29)
52. [x] Client unsupported-cadence submission guards. (Original gate 30)
53. [x] Server cadence validation and private-table separation. (Original gate 30)
54. [x] Final default cadence/import/ranking policy. (Original gate 30)
    User approved: standard20Hz for public high scores/shared races; MS91
    slow10Hz recordings stay private but playable/downloadable. Existing
    recordings retain their engine/rate. Policy decision is final; normal
    non-preview private10Hz import/playback must be verified before this
    implementation gate closes. Private upload and playback no longer depend
    on preview settings. Ordinary browser download/playback and duplicate
    upload rejection verified; automated private import/backup/reload passes.
    Fresh nonduplicate browser insertion now verified: QA_SLOW2 imports
    privately and exports exact original bytes; native playback reaches
    1:35.80. Normal non-preview QA_AUTO import additionally verifies MS91/10Hz
    persistence through actual browser backup, reload and duplicate rejection.
    Public cadence guards, private score separation, future-settings and
    import/backup/reload-to-finish suites rerun successfully. New track
    extraction preserves recordings and existing files; conflict UI language
    QA remains part of final site regression85. Modern-default activation
    remains gate81; this check does not authorize publication.
55. [x] Desktop fresh boot/version/options. (Original gate 31)
56. [x] Desktop fresh race/finish/results. (Original gate 31)
57. [x] Desktop car/opponent/track menus. (Original gate 31)
58. [x] Desktop replay/save menus. (Original gate 31)
59. [x] Desktop enhanced/original graphics switch. (Original gate 31)
60. [x] Mobile boot/menu layout. (Original gate 32)
    Both editions boot opening→main menu via touch Enter in live IAB at320px;
    navigation opens/closes and Play returns to its section. Document width
    matches320/390px, game/menu and equal-size touch controls stay contained.
    Proofs: /private/tmp/playstunts-ms91-mobile-menu-20261013-03.png and
    /private/tmp/playstunts-ms90-mobile-menu-20261013-04.png. Supplements user’s
    previously confirmed real touch-device driving in both editions (gate61).
    Responsive IAB is not a claim of every mobile browser/embedded display;
    replay/download and setup acceptance remain62/63.
61. [x] Mobile driving controls/race. (Original gate 32)
    User confirmed real touch controls worked in both editions on2026-10-13,
    answering simultaneous acceleration/steering, gear change, release, Menu and
    panel containment check. Complements actual pointer-driven manual races in
    both editions and multi-pointer/remapping/cleanup regressions. Mobile replay,
    setup and final device/site regressions remain separate.
62. [x] Mobile replay/download interactions. (Original gate 32)
    User confirms both editions: replay touch controls work; .RPL notice Cancel
    saves no file and OK downloads successfully. Track downloads intentionally
    bypass replay-only compatibility notice.
63. [x] Mobile graphics/audio/setup controls. (Original gate 32)
    Both editions live390px graphics/music switches round-trip original↔updated
    with visible state changes and restored initial preferences; no horizontal
    overflow. Setup now has original BIOS-queue touch navigation. User explicitly
    confirms new Setup controls respond/fit on real touch device in both editions.
    Live320/390px Sound submenu/Cancel/Exit checks pass; PC Speaker saved via
    touch survives reload under both edition selections, then initial MT32
    restored and reload-verified. Input isolation/FIFO/cancellation and530-message
    translated inventory pass. Proofs05–08 in current status log. This is mobile
    control usability, not full audio/listening/timing acceptance (39/45/47/70),
    nor full settings persistence matrix (71).
64. [x] Browser engine-labelled import/download QA. (Original gate 33)
65. [x] Browser rewind/restart/continuation QA. (Original gate 34)
66. [x] Browser private backup/restore QA. (Original gate 35)
67. [x] Browser track editor/import/export QA. (Original gate 36)
68. [x] Browser PC sound and persistence. (Original gate 37)
    User explicitly confirmed both editions, including replay crashes,
    win/loss music, pause/resume and retained sound-device selection on reload.
69. [x] Browser AdLib sound and persistence. (Original gate 37)
    Same explicit both-edition user confirmation; automated controller and
    synthesis checks complement, rather than replace, the listening evidence.
70. [x] Browser Roland sound and persistence. (Original gate 37)
    2026-10-14 user acceptance: everything else using Roland works in both
    editions; the remaining MS1991 Original Menu→Let's Drive exception now
    explicitly retested: normal fade, no slowdown. Updated transition and
    Original/Updated switching also explicitly passed. Saved device selection
    and reload were separately browser verified at71. Continuous output fade
    is restricted to MS1991 Original; native note data, Updated fade and MS1990
    route retained. Automated routing, cancellation/release and real-Munt fade
    checks supplement this audible evidence. Full score-timing/whole-site
    regression requirements remain independently tracked at39/47/85.
71. [x] Browser setup/reload persistence across engines. (Original gate 37)
    Evidence: original Setup serialization round-trips all30 display/sound
    pairs; both-engine launch/reload matrix retains configured/effective
    settings across directories and ROM availability without writes (560
    closed read connections). Actual IAB1990 and1991 each changedTandy→Roland,
    saved throughExit, reloaded and visibly retainedRoland, then restoredTandy,
    saved/reloaded and visibly retainedTandy/EGA. Escape cancellation preserves
    choices. Roland listening is separate open70; production defaults unchanged.
72. [x] Representative translated menus. (Original gate 38)
73. [x] Representative translated website/layout. (Original gate 38)
74. [x] Refresh and restore current-source backup after final changes. (Original gate 39)
    Latest runtime checkpoint67 includes all three PC15 stop/reset routes:
    SHA256 7c4f052ae9f6779241c0fc7df6eb07e66590b5a6b3e4e13afb7bc72274720121.
    All2456 entries restored/hash-verified in playstunts-source-restore-1QlM68.
    Supported build /tmp/ms91-pc15-reset-build.log passes;251 compiled JS files
    pass the diagnostic guard. Private source recovery only; this annotation
    postdates the snapshot. No production database/export claim.
    Latest runtime checkpoint66 (2026-10-14) includes PC15 sample-stop fix:
    SHA256 b8e275a560b9c953898c59052d9e55a16555f3aaf482a029b5435c0f5867ec98.
    All2456 entries restored/hash-verified in playstunts-source-restore-H2BTPS.
    Private recovery only; no production database or followed external assets.
    TypeScript passes after narrowing the new test callback. This annotation
    postdates the archive; runtime/tests are included.
    Latest runtime checkpoint2026-10-14: ms91-source-candidate-20261014-65,
    SHA256 c1e776b006065dd25fb6c01e29b46f775b3b7e3fc5ff9ac8f96c9a9849f352a9.
    All2455 entries restored/hash-verified after VANCOUVR import protection;
    temporary restore playstunts-source-restore-R3YnkD. Private recovery only,
    not a publication archive or production database backup. This annotation
    postdates the snapshot; runtime and tests are included.
    Latest candidate64 supersedes63 after camera identity propagation:
    e4c3f443cba73a0a44334afe09f3e87a39e642c8a59d54c5189e41c247332f4d;
    all2455 entries restored/hash verified, same private/source-only scope.
    Current receipt supersedes62: candidate63, SHA256
    80d28b8ebadf178d7b812556ce6997974da514836c57325a4aed2ab6dcf78d63,
    all2454 entries restored/verified after the versioned corkscrew classifier
    correction and README documentation cleanup. Same private/source-only
    limits apply; source remains under sibling verification-artifacts.
    2026-10-14 current built candidate checkpoint62 includes replay-download
    error handling and removal of public test telemetry. Archive SHA256:
    c7fa25aba6e1e6380f888962054a43b7eb4aa4a4f79994ffe71811e618e79d69.
    All2454 entries restored into a new empty temporary directory and checked
    against complete inventory/individual hashes; symlink targets retained,
    external assets not followed. Private recovery only, not a publication
    archive; production database absent. Artifact:
    ../verification-artifacts/ms91-source-candidate-20261014-62.
    Checklist/status annotations after capture document this receipt, not new
    runtime changes. Reopen/refresh if implementation or default changes before
    packaging; external assets remain separately covered by75.
75. [x] External asset checksum/restore inventory. (Original gate 40)
76. [ ] Complete production replay/score export. (Original gate 41)
77. [ ] Verify export completeness and checksums. (Original gate 41)
78. [ ] Isolated restoration of full production data. (Original gate 41)

Release authorization, 14 October 2026: the owner explicitly approved proceeding
without a verified production database backup. Items76–78 are waived/deferred,
not passed. No production restore, reset or historical-data rewrite is authorized
or required by this deployment. Existing DB binding must be retained.
79. [x] Document rollback procedure. (Original gate 42)
80. [ ] Verify rollback preserves historical data. (Original gate 42)
    2026-10-14 reconciliation: existing future-race rollback test covers
    alternating defaults, mixed private replay/score stores and unchanged
    downloads; migration preservation covers historical schema/rows in an
    isolated database. Those checks are already accepted and were not rerun.
    They do not close this production-data gate: verified production export
    and restoration remain deferred at the user's request (76–78).
81. [x] Enable modern future-race default. (Original gate 43)

Release delta, 14 October 2026: default nowMS1991; explicitMS1990 selection
and recorded-engine fallback remain unchanged. Five rollback/byte-preservation
tests, future-race settings tests, original-resource source boundary and
TypeScript checks pass. FAQ and both translations describe dual-edition release;
README documents preparation and selection without bug-fix narratives.
82. [x] Verify stored engine identities stay independent. (Original gate 43)
    2026-10-14 evidence reconciliation: actual selector modules evaluated with
    both legacy/modern default constants; untagged recorded metadata remains
    legacy and explicit player choices affect only fresh launches. Mixed
    private stores reopen across alternating future selections with unchanged
    replay/score bytes, engine tags,10/20Hz cadence and exported files; no
    persistence writes. Existing cross-engine manual loading and deferred
    legacy seek retain recorded identity. Compiled HTTP download verifies MS91
    output despite conflicting MS1990 launch query; retained download tests
    cover legacy/MS91/BB91 and shared import refuses wrong-engine reuse.
    Reviewed browser manual runner sends only fresh entries through future
    selection; replay entries/results retries retain session engine/cadence.
    Existing passing logs and targeted default-flip test reused, not repeated.
    Default activation81 and live historical byte comparisons101–102 remain
    separate; reopen on changes to selectors/loaders/storage identity.
83. [x] Final legacy playback regressions. (Original gate 44)
    2026-10-14 current-candidate evidence reconciliation, not a duplicate run:
    combined compatibility/input/results logs and post-menu-fix compatibility/
    manual lifecycle logs pass. Legacy deferred replay seek compares sequential
    playback; mixed-engine load and rollback preserve recorded identities and
    bytes; genuine legacy long-run verification passes. Existing browser/user
    legacy finish and accepted submission evidence remains valid. No physics/
    session changes followed these results. Reopen if relevant runtime changes.
    These are local candidate regressions, not live historical comparisons101–102.
84. [x] Final modern races/replay regressions. (Original gate 44)
    Current-candidate combined input/results checks cover modern timers/input,
    replay/result menus, verified finishes and genuine long runs. Post-selection
    fix import lifecycle passes atomic selection, failed-save paths, private10Hz
    import/backup/download/reload-to-finish and legacy-file preservation; manual
    lifecycle covers cross-engine load, cancellation/retry and cleanup. Forced
    lifecycle exits are not natural finishes: separate QALAP91 browser finish,
    original differential evidence and user accepted submission supply those.
    Logs:/tmp/ms91-combined-{input,results}.log,
    /tmp/ms91-atomic-selection-{compatibility,manual}.log and
    /tmp/ms91-release-import-final.log. No affected runtime changed afterward.
    Reopen on relevant changes; final audio/site85 and live97–102 remain separate.
85. [x] Final site/graphics/audio regressions. (Original gate 44)
    Final local integration audit2026-10-14: retain accepted desktop/mobile,
    editor/replay/graphics/translation checks55–75, current renderer corpus and
    camera-routing regressions, and completed final-package audio47. No repeat
    physical listening or full simulation corpus claimed. New final browser
    coverage:1440px home shows Recent Races/game/Keyboard Shortcuts together;
    1024/390px document widths equal viewports.390px expanded legacy score
    details stay in bounded540px tables within360px auto-scroll containers;
    modern filter loads its separate92 local car times versus82 legacy.
    FAQ renders current unreleased-default/version/rate/import/music guidance
    without bug-fix narratives; desktop language item remains in the same nav
    row. Local test scores are explicitly labelled, not production evidence.
    Bundled-track conflict regression via actual private import: a new fixture
    deliberately names VANCOUVR but embeds a different QA track. Warning blocks
    track replacement; Cancel leaves all32 private saved-file objects, bytes
    and engine/rate metadata exactly unchanged in backups(2)/(3)/(4). Fixture
    not imported. This covers the new demo-track catalogue protection.
    Found/fixed warning presentation only: portaled conflict dialog now reuses
    compatibility styling and centered layout, separated equal-width buttons
    wrap on narrow phones.390px:352px dialog within viewport,70px buttons;
    320px:282px dialog, vertically wrapped46px buttons, zero page overflow.
    Existing handlers/text/file logic unchanged.3 versioned-upload tests and
    fresh typecheck pass. Supported build passes all phases,531 language keys,
    source guard and251-file compiled instrumentation guard; chunk-size and
    dependency deprecation notices remain advisories. No production changes.
    Evidence /private/tmp/ms91-final-layout-{1440,390}-20261014.png,
    ms91-final-{scores,faq}-phone-20261014.png,
    ms91-final-track-conflict-{390,320}-20261014.png and
    ms91-final-layout-observations-20261014.json (all under/private/tmp).
    Future-default activation, source review/package and live safeguards stay
    separate.86/103 (83.5%),17 remaining.
    2026-10-14 after shared-import fix: reloaded the ordinary MS91 preview,
    opened downloads, paged the current32-file catalogue, and downloaded
    VANCOUVR.TRK through its visible button. All1802 downloaded bytes exactly
    match ms91DemoTrack; SHA256
    3068c4fa59d826232dbfc11dd6e7d4aa1fc57d4a195862f09b1d7589e5857020.
    Proof /private/tmp/ms91-vancouvr-browser-download-20261014.png. Existing
    saves remained visible; no import/write, race or submission performed.
    Download panel closed, preview remains ready. This verifies catalogue and
    download delivery, not browser import collision handling or all gate85.
86. [x] Final typecheck. (Original gate 45)
    Revalidated after final conflict-dialog markup/style correction2026-10-14;
    npx tsc --noEmit exits0.
    Revalidated after recorded-engine camera clearance propagation.
    Revalidated after corkscrew evidence width correction; no TypeScript errors.
    2026-10-14 current release candidate passes npx tsc --noEmit after the
    replay-download error fix and removal of public per-frame diagnostics.
    Reopen/revalidate if subsequent TypeScript/default configuration changes.
87. [x] Remove temporary audio mute/diagnostics and experimental preview-mt32/preview-tandy switches, pass release-instrumentation guard, then final production build. (Original gate 45)
    Revalidated after final conflict-dialog correction2026-10-14: supported
    Sites build passes,531 translated keys complete,251 compiled JS files
    contain no temporary audio/diagnostic instrumentation.
    Latest camera candidate build:/tmp/ms91-camera-build.log; compiled249-file
    instrumentation guard and production build pass.
    Latest revalidation:/tmp/ms91-corridor-build.log; all build phases and
    compiled249-file diagnostic guard pass after classifier correction.
    Source review found per-frame race dataset telemetry missed by the earlier
    marker inventory. Removed its public callback and dependent work-page
    diagnostic polling; original gameplay/audio callbacks remain unchanged.
    Expanded marker tests reproduce source rejection before removal. Source
    guard, negative-marker tests, TypeScript/diff checks and supported Sites
    build pass; compiled guard scans249 JavaScript files with zero findings.
    Log:/tmp/ms91-telemetry-free-build.log. This current candidate includes the
    replay-download error fix. Rebuild/revalidate after any later source/default
    changes; it is not publication, source packaging94 or default activation81.
88. [x] Final migration compatibility. (Original gate 45)
    2026-10-14 final schema audit: pending0011 remains a new engine sidecar
    only. Real migration applied to a populated historical schema preserves
    all9 historical tables, every seeded column/row and existing schema
    objects; new engine metadata insertion also leaves them unchanged.
    Fresh route/ranking/metadata tests verify engine filtering before ranking,
    category separation and read-only retention. All12 migrations also applied
    in the isolated compiled Worker runtime. This closes migration-code
    compatibility, not full production export/restore76–78 or live historical
    comparisons101–102. Reopen if the migration/schema changes.
89. [x] FAQ version/compatibility accuracy. (Original gate 46)
    Current local FAQ distinguishes unreleased MS1991 from unchanged public
    default; recorded engine/rate retention,20Hz public/10Hz private rules,
    conflict-safe embedded-track import, versioned downloads and backup scope
    match implementation and passing compatibility-label/notice, upload,
    download, track-import and backup tests. Both translated languages pass
    the528-message inventory. Edition/build dates rechecked against the version
    table and existing original-archive evidence. This is source/documentation
    acceptance, not publication; recheck release-status wording when gate81
    changes the default. Live acceptance remains gates97–103.
90. [x] README usage and engine selection. (Original gate 46)
    2026-10-14 packaging review follow-up: clean compatibility checkouts must
    generate seven ignored MS1991 modules from13 own-original checksum-verified
    files before base preparation/build. README now documents the generator,
    directory/ZIP inputs, absent-or-identical installation, source/publication
    guard and private checkpoint boundary. Actual original ZIP regenerated all
    seven exact current module values, existing modules retained without writes;
    malformed/duplicate/symlink/conflict tests and isolated force-staged Git
    boundary test pass. No original data is newly added to tracked source.
    Local source README now documents explicit launch/preview precedence,
    recorded identity retention, approved20Hz public/10Hz private policy,
    private import and duplicate handling, versioned downloads, and unreleased
    status. Checked against routing/import source and passing future settings,
    cadence guards, upload and rollback tests. GitHub push remains gate93;
    release-default/status changes require a final documentation refresh.
91. [x] Release differences and rollback documentation. (Original gate 46)
    2026-10-14 source review: difference audit now has a current, explicit release
    contract for fresh-vs-recorded engine identity,24/26-byte headers,20Hz public
    and private10Hz, conflict-safe tracks, presentation, independent sound-driver
    routing, unchanged MS1990 Roland/no applied fallback, unapproved Suno trials,
    touch scope and additive database preservation. Earlier investigation entries
    are explicitly historical, not contradictory current acceptance statements.
    Checked against current selectors, codec/cadence/download/track-import,
    timed-Roland routing and unchanged hosting identity. Fresh rollback, private
    backup/import/export, migration-preservation and offline restore comparison
    suites pass. Rollback text retains both engines/schema, changes only the
    fresh default, forbids data downgrade and separates four backup scopes.
    This closes documentation only, not live rollback80, complete export76–78,
    default81, final regressions/build or publication94–103. Update these notes
    if the eventual released behavior changes; no source/default/data deployed.
92. [x] Review intended repository change set. (Original gate 47)
    Candidate publication-content/risk review accepted2026-10-14 for inventory05:
    2457 named files,5695 literal local dependency edges, zero findings; complete
    source-only build proves source/runtime dependency closure with declared
    original-resource preparation and asset inputs. Prior grouped reviews below
    cover versioned simulation/contact/cache/init, rendering, input/touch,
    native menus/resources, clock/audio ownership and persistence/ranking/
    transactions. Reconciled latest deltas: copy-only Suno distribution,
    no-Git local-build guard, result/preserved-stat regressions, no-overwrite
    QA export, conflict-dialog-only presentation and retired-route redirect.
    Runtime/data behavior changes have their bounded original/regression/user
    evidence separately recorded; this is not a new all-feature test claim.
    Inclusion review retains implementation, optional research/test tools,
    documentation and vendored redistributable sources/music; excludes seven
    generated original modules, original installations/ROMs, private captures,
    production data and external public-tree symlink. README distinguishes
    optional private-reference research suites from ordinary build/use.
    All2442 non-doc candidate files match inventory05 hashes now;275 Python
    tools parse without execution, TypeScript passes, source-only build passes,
    direct indexed original-resource publication guard passes. Latest bounded
    scan2435 text files has zero high-confidence credential-pattern matches;
    no universal secret/licensing/security certification is inferred.
    1432 runtime/vendor/migration/package/binding inventory entries fingerprint:
    05488bd5ee2a099e4725d6ecb16c884e41f22356fcf1fa854c10116d62440f6c.
    The exact release/default/docs changes still require a delta revalidation
    before push/packaging; a new behavioral edit reopens affected reviews.
    This acceptance neither stages/pushes files nor satisfies production backup,
    final deployment archive or data-preservation checks.87/103,84.5%,16 open.
    Latest source-review delta2026-10-14: new local timed-workbench pages
    correctly refuse audio startup away from loopback and clean up owned audio
    on unmount. Their backlinks and an existing game-check backlink still
    referenced the deliberately removed native-mt32-check interface. Retained
    that URL as a minimal server redirect to/#play, without restoring its
    temporary controls/telemetry. HTTP307/location verified; fresh typecheck
    and diff check pass. Inventory05 names2457 candidate source files and5695
    literal local edges, zero unresolved findings, no generated original modules
    or source symlinks. This adds path/dependency/delta review, not blanket
    approval of every research file or a production backup waiver.
    Publication content follow-up: candidate inventory contains none of the
    seven generated original-resource modules. Its only app/lib JSON is the
    previously tracked showroom-material-patterns.json; no newly added runtime
    JSON payload is hidden behind a different resource name. High-confidence
    credential-pattern scan of2434 candidate text files found no private-key,
    GitHub-token, OpenAI-project-key or AWS-access-key matches. Filename review
    found no environment/credential/database archives; two tarballs are the
    existing OPL/Munt corresponding-source distributions. Pattern checks alone
    are not a complete confidentiality/licensing audit. README now distinguishes
    ordinary asset/build checks from private-reference development suites.
    2026-10-14 brief independent Astra reconciliation: historical "remaining"
    intro/projection/Tandy/PC15 paragraphs below are superseded by their later
    follow-ups, not instructions to repeat those reviews. Actual remaining
    work is publication-set/dependency and residual behavioral coverage
    reconciliation. Candidate inventory recorded at
    ../verification-artifacts/ms91-source-inventory-20261014-01.json:
    2450 paths with hashes,5694 literal module edges; package script targets
    and migration journal resolve in the candidate source set. Seven generated
    game modules, prepared public assets and framework route types have explicit
    external/generated-input recipes. No unresolved literal dependency found.
    tools/release_source_inventory.mjs reproduces this read-only inventory;
    it stages/publishes nothing. This is not approval of every included research
    tool, secret/licensing audit, computed fixture closure or complete behavior
    review. Current README removes bug-fix/test-log prose as requested.
    This checklist annotation postdates the inventory; refresh changed hashes
    before the final source package instead of treating it as immutable proof.
    2026-10-14 projection/raster review: inspected model bounds/primitive/
    polygon projection, owned-cache vertex projection, projection preparation,
    circle/display raster/queue adapters, circle register side effects and EGA
    scaled sprites. Engine identity reaches arithmetic and circle-height
    policies; pure callers retain copied caches and only the owning renderer
    opts into mutation. EGA software-plane sprite path preserves clipped mask,
    transparency and dither rather than sending hardware-aperture operations.
    No new defect identified in this subset; accepted renderer tests reused.
    Specific unresolved source finding: createOriginalIntroDriving forwards
    data.physicsEngine to route lookup but constructs TrackGeometry without
    it, so opponent movement defaults to legacy. Browser alternate-display
    introduction passes selected-engine data. Determine intended original
    intro behavior and add a focused integration check before deciding a fix;
    do not mistake prior route-point propagation evidence for full intro
    simulation routing. No runtime change made for this finding yet.
    2026-10-14 PC15/dialog review: completed PC Speaker music-runtime/native
    streaming, initialization, dialog audio and race-audio-timer diffs, plus
    full speaker-output and audio-memory sources omitted by earlier truncated
    output. Driver slots/lengths/gains follow boot generation; cadence reaches
    the race timer; legacy four-tone selection remains its own branch. No
    further defect found beyond the recorded sample-vector correction.
    Also inspected dialog content/display/input/layout/raster/session, end-menu
    input and native MCGA/alternate dialog interaction/runtime diffs. Modern
    font-height spacing/compact separators and wrap/disabled-choice behavior
    are explicit; legacy fixed spacing/clamping remains. Settings marks clone
    source bytes and reject non-MS91/non-graphics use. Existing accepted
    dialog/device tests reused without reruns; this is source review, not new
    hardware/browser acceptance. Remaining review batches include scene
    primitive projection/raster helpers and menu/resource bridge diffs.
    2026-10-14 PC15 cleanup follow-up: reset also discarded the sample vector.
    New reset case fails before correction. Reset now retains restoreVector;
    the allocated adapter applies it after the common canonical commit, covering
    direct effect stop, reset/producer dispatch and deferred car cleanup.
    Six seeded allocated-runtime cases (three routes, two editions), repeated
    stops and next ordinary IRQ pass, as do related sample-host/voice-release
    regressions and TypeScript. No game physics, stored recording or Updated
    music changed. Remaining PC15 source review includes the broader music
    sequencer; do not infer all sample paths or live listening from these tests.
    2026-10-14 PC15 review found an explicit sampled-effect stop discarded
    stopOriginalPcSpeakerTrack.restoreVector. Driver state stopped but live
    IRQ0 still addressed the sample handler. New allocated-runtime regression
    reproduces this with nonzero saved vector in both driver generations.
    Preserve the result through pc-speaker-effect-stop and notify the allocated
    sample host only after canonical commit. Both editions now restore the
    live vector, retire the voice, retain restoration on a repeated stop and
    resume the ordinary interrupt callback. Registered under
    test:pc15-allocated-sample-optin; it and effect-sample-host/versioned sample
    release tests pass. Supported build passes with251 compiled files guard
    clean (/tmp/ms91-pc15-sample-stop-build.log). No tone or Suno changes.
    This is a deliberately seeded active-sample fixture, not new live listening
    or original-executable sample-stop evidence. Remaining PC15 source diffs
    still require their own complete review.
    2026-10-14 crash/effect/Roland review: inspected crash state/memory/runtime/
    fireballs, driving-step, cross-car contact, effect start/stop/finished,
    engine-start generator, MT32 driver control/effect runtime/stop/engine
    start/note start/race memory/skid/SysEx/voice timer. Crash delays follow
    recorded cadence; particles follow engine; default20Hz constants remain
    equivalent. Modern effect validation and far-offset wrap are explicitly
    engine-gated, and76-byte timer tails reset without expanding legacy banks.
    MT32 sound-driver generation controls MIDI/SysEx while effectEngine controls
    common game durations. Legacy controller output/delay loops remain; modern
    patch setup uses its checksum packet and PIT delays. No new defect found;
    existing relevant differential/lifecycle evidence remains accepted, no
    unchanged tests rerun. File-name search alone cannot establish review
    coverage because evidence uses grouped/wrapped names; do not treat the
    resulting261 unmatched names as261 genuinely unreviewed files.
    2026-10-14 browser race-boundary review: inspected advance-allocated-race,
    browser-allocated-race-loop, allocated-mouse-selection, complete manual
    race/demo orchestration and activeRaceData/futureRaceSettings/sound-port
    rebinding helpers. A WeakSet serializes suspended audio ticks; cancellation
    closes generators and restores IRQ guards. Replay results/retries retain
    session engine/rate, while fresh retries use explicitly selected future
    settings. Resource drains precede Tandy replacement, timed Roland is
    suspended/closed across loads/results, and input is disabled in nested
    finalizers even if another cleanup throws. Existing manual Tandy/Roland
    lifecycle assertions cover load-cancel/success, abort and retry with their
    stated mocked browser/input scope; reuse accepted evidence, no rerun or
    new live listening claim. No new defect found in this reviewed subset.
    2026-10-14 deeper Tandy review: read full lifecycle, note-start, sample,
    control, music-runtime, engine-start, track-control, voice-timer/update,
    driver-layout, effect-runtime, car-audio-runtime, DAC clock/transfer,
    browser race-audio and sample-continuation sources. Legacy BIOS sample
    calls retain saved playback registers across explicit interrupt delivery;
    modern paths use their own layout and reject missing sample-host delivery.
    Port61 changes are carried through ordered writes; yielded work is copied
    before awaiting its owner. Abort checks precede continuation and all exits
    close the generator; browser audio closes/disconnects pending sources on
    failure. No new defect found in these inspected paths. Previously accepted
    physical-timing/continuation/device evidence reused without rerunning it.
    This is source review, not a new hardware accuracy or audible acceptance
    claim, and does not close the full repository-review gate.
    2026-10-14 allocated-audio review: inspected regular AdLib, PC Speaker,
    MT32 and Tandy race adapters; native sound-device routing; dialog AdLib
    control; voice duration/tick/timer; effect-runtime; register-cache filter;
    timer-extension bridge; and shared synchronous/asynchronous timer removal.
    Driver generation stays separate from game effect-engine identity. Each
    allocated race owns its96-byte timer extension; canonical72-byte records
    are committed before extra fields, avoiding adjacent-memory expansion.
    Existing extension tests explicitly cover failed commit and new-owner
    isolation. Modern OPL deduplication uses retained driver cache only when
    generation is MS91. Async timer removal awaits stop before clearing an
    active record; failure retains the callback/record for recovery. Tandy
    continuations reject memory replacement while suspended and release guard
    state on exit. Source review found no new defect in this subset; accepted
    device/cleanup regressions reused, not rerun or broadened into new audible
    acceptance. Deeper Tandy note/driver diffs still need complete review.
    2026-10-14 recorded-state review: inspected recorded single/two-car callers,
    reset-race-session, restore-replay-checkpoint, both seek wrappers,
    write-player-race-state, reset-adlib-memory, snapshot/body-cache helpers,
    and native-race-session seek/reset call sites. Session engine/rate reaches
    every production checkpoint restoration. Legacy restoration retains its
    sequential1072-byte copy; modern1120-byte snapshots unpack both24-byte
    body caches into the explicitly allocated tail. Modern10Hz initialization
    clears all40 allocated slots;20Hz clears20. Two-car cadence mismatches
    reject before simulation. Existing snapshot/body-restore tests cover first,
    intermediate and final slots, both rates, sign markers and source
    immutability; accepted results reused without unchanged-suite reruns.
    No runtime defect found in this subset. This does not close all replay,
    audio or repository checks, nor prove every experimental BB91 path.
    2026-10-14 world-rendering review: inspected render-model-memory,
    render-original-world, render-scene-background, scene-background-display,
    submit-primitive-memory, transform-model-vertex, world-display-layout,
    world-display, world-status-overlay and their region/policy helpers.
    Native renderer entry points reject MS91 region flags for other engines;
    loaded-session identity drives vertex halving, primitive sort and time
    formatting. Descriptor08 gates modern region writes; default legacy
    tracking remains unconditional. Slow-video toggles reset retained regions
    and require a seeded full redraw before selective copying. World raster
    addresses include the retained window offset. Reviewed existing descriptor
    tracking and full-replay renderer test assertions against these branches;
    reuse previously accepted renderer corpus/identity evidence because runtime
    inputs have not changed. No new runtime defect or rerun claimed. Full
    repository review remains open; this is not a new DOS visual comparison.
    2026-10-14 shared-import follow-up found bundledTrackReplays includes
    VANCOUVR but both shared import collision catalogues contained starters
    only. Added a failing regression, then included the exact copied demo
    track in both catalogues before retained overlays. Identical track imports
    now reuse it; modified community tracks receive a free DOS alias; a shared
    replay requesting conflicting VANCOUVR bytes rejects without replacing it.
    No retained files, original demo bytes or replay controls are rewritten.
    Eighteen shared track/replay/caller tests, TypeScript, diff check and the
    supported build pass (/tmp/ms91-vancouvr-import-build.log);251 compiled
    JavaScript files pass the diagnostic guard. Previously accepted audio
    listening is unaffected. Full source review and browser regression remain.
    2026-10-14 opponent/contact propagation review: inspected opponent decision,
    target angle, route advance, steering, engine command, powertrain, grip,
    driving-step, both opponent race wrappers, level-step, race-car-contact,
    suspension, twisted-pipe selection, track contact and route-point adapters.
    The driving wrapper takes engine/cadence from retained TrackGeometry;
    modern extra route advancement is bounded to one recomputation and disabled
    for introduction mode or velocity-heading offset. Legacy defaults remain
    8/1 steering/coasting steps. Added previously missing still-lateral-target,
    previous-frame immutability and introduction suppression assertions to
    test_ms91_opponent_rate.ts; targeted test, TypeScript and diff checks pass.
    No runtime modification required. This extends branch/source review only;
    it does not replace full opponent executable references or finish coverage.
    2026-10-14 completed-score identity review: browser-native-menus owns
    captureGlobalRace histories in a WeakMap keyed by the exact runtime session;
    results retrieve that session's history, not the future-engine selector.
    No production mismatch found, so no speculative runtime guard added.
    Extended test_completed_score_offer.ts exercises ms-1990/ms-1991/bb-1991
    proof identity, retained track header, rewritten input count, naming, and
    control snapshot before delayed saveReplay delivery. Both tests pass;
    TypeScript and diff checks pass. This is isolated proof-construction
    coverage, not a new natural browser finish or server acceptance claim.
    Time/input subset: versioned time formatter and high-score row diff
    inspected; MS91 replay/results cadence remains separate from the original
    forced20Hz high-score-row convention. Fresh ms91-input/ms91-time suites
    pass, including genuine>10-minute finishes in both physics editions,
    original rollover preservation,32768 positive20Hz text values, counter
    wrapping and replay presentation at60/120/240Hz. No trace-to-time inference
    or source replay conversion is introduced by presentation changes.
    Menu-resource subset: versioned opponent adapter, car-model/display
    propagation and title selection tests reviewed. Fresh original-distribution
    title/opponent checks pass exact packed resource hashes/copy-only speed
    adaptation with legacy profiles unchanged. Allocated CGA/Tandy/EGA title
    rendering and ms91-options lifecycle/layout/cancellation tests pass. Source
    resource coverage is distinct from new visual listening/device acceptance.
    Edition-detection/catalogue subset: detectReplayVersions and effective
    download overlay source inspected. Detection validates fields/layout but
    keeps MS91/BB91 publisher ambiguity; the UI choice remains explicit.
    Catalogue clones output and rejects ambiguous DOS aliases instead of
    choosing arbitrary saved metadata. Current version-selection, download-
    safety and native-download-catalog suites pass, including corrupt metadata/
    bytes/track-hash rejection and public20Hz/private10Hz import separation.
    Replay-format/snapshot subset: private upload validation, copy-only file
    download, cadence-aware checkpoint allocation and1072/1120-byte snapshot
    adapter inspected. Canonical storage remains separate from external replay
    headers; modern snapshots explicitly retain both24-byte body caches.
    Fresh ms91-import-lifecycle and ms91-slow suites pass after fresh-race
    settings hardening, preserving private10Hz bytes/rate and legacy files.
    Generic unsupported/uninitialized10Hz entry remains rejected; ordinary
    cadence-aware private imports remain supported. No public-rate waiver.
    Database source subset: schema.ts, migration0011 and journal diff reviewed.
    The only new SQL creates race_engines(id,physics_engine); it performs no
    historical-table rebuild, UPDATE, DELETE, ID replacement or backfill.
    Fresh populated-nine-table migration preservation and engine metadata
    tests pass. Existing gate88 remains accepted; this source review does not
    verify production backup completeness or apply any live migration.
    Initialization/navigation subset: initialize-car/player/opponent/player-race/
    race-cars, player-navigation/guidance/progress/stage and route-point pipeline
    diffs inspected. Added wheel-history and previous-route initialization are
    MS91-only; legacy untouched-byte behavior remains gated. Cadence flows to
    route confirmation penalties/display durations and is retained across
    navigation advancement. Route midpoint121-case, penalty/opponent-rate and
    restart-input-release suites pass. No new original-init oracle is claimed
    from these propagation/regression checks.
    Further physics subset: grip/suspension signed smoothing, chassis wheel
    and pose rounding, two-car response and track-step modern body/sign
    branches inspected. Modern collision/body behavior stays explicitly
    engine-gated; missing retained body cache rejects rather than guessing.
    Fresh versioned-car-contact and676-case body-plane-guard tests pass;
    these do not replace the separate full-selection/original differential
    gates. Remaining physics propagation files still require their own review.
    Resource-exit review subset: complete-race-exit, complete resource cleanup
    and shared synchronous/asynchronous release program inspected. Awaited
    audio removal retains original release ordering before later window/bank
    cleanup. Fresh async-race-audio-boundaries and ms91-resource-lifecycle
    suites pass, including failed shutdown, replay replacement, buffer-limit
    recovery, all four display layouts and1024 input combinations.
    Menu/car resource review completed for native-car-runtime,
    native-display-car-presentation/resources and car-menu-model diffs;
    browser-native-menus replay/options/results/graphics handoff changes also
    inspected without truncated output for those sections. Car model creation
    captures the menu engine; replay/dialog/save/result paths use session
    engine/cadence instead of the future selector. Shared resources remain
    copied and prior model pages are released before replacement. Existing
    non-race model tests cover all cars/eight angles, unchanged inputs and
    legacy default pixels; they were inspected, not rerun or newly accepted.
    No new defect found in this subset; this does not close the full gate92.
    Latest private runtime recovery checkpoint68 includes intro routing:
    SHA256 2a3076e3933646c35710c3c2047e4da52340a9799815dcd91a9c8d01da8a73ed;
    all2457 entries restored and individually verified in a new temporary
    directory. No production data or followed external assets are included.
    Intro movement routing follow-up: intro-driving now retains the selected
    engine for both route lookup and movement, rather than implicitly falling
    back to legacy movement. test_intro_engine_routing.ts checks both editions
    against explicitly tagged opponent ticks for1999 frames and verifies the
    input segment stays unchanged. Runtime regression, TypeScript and diff
    checks pass; the supported build passes its compiled instrumentation guard.
    This is native routing evidence, not a full DOS intro differential or a
    reproduced visible intro defect. Full source-review gate remains open.
    Resource/publication review subset: prepare_ms91_resources.py, recipe
    manifest, ignore rules and publication-boundary check inspected. Generator
    performs no network download, validates exact original sizes/SHA256, rejects
    duplicate DOS names/symlinks/output escapes and changed inputs, and retains
    existing matching modules without overwrites. Seven preparation tests and
    forced-stage boundary regression pass. This verifies the preparation and
    source-publication boundary, not ownership/licensing of game materials or
    complete source review.
    Display/input review subset: native display renderer diff, session-owned
    renderer policy, touch component and shared touch state inspected. Fresh
    renderer-identity/runtime, touch-driving/setup and chase-shortcut suites
    pass. Loaded legacy replay retains pixels/state/enhanced geometry despite
    future-MS91 video settings. Multi-pointer throttle/steer and release/blur
    remain independent of original masks; plain V remains unconsumed while
    Ctrl+V selects chase distance. This is source/automated regression evidence,
    not new mobile hardware acceptance or the full renderer corpus review.
    Physics review subset: engine force signed scaling, wall-impact thresholds,
    wheel-plane fall cadence/contact constants and versioned route-table
    adapter inspected. Legacy defaults remain explicit; modern route changes
    copy outer/changed records instead of rewriting shared legacy assets.
    Fresh ms91-rate, versioned-route-tables, versioned-wall-threshold,
    versioned-suspension and physics-engine-version tests pass. These include
    all1024 folded wall directions and idempotent eight-tile route changes.
    This is branch/data-ownership review with targeted regressions, not a new
    full original-executable differential or approval of all physics files.
    Startup/release-switch follow-up: OpeningSequence run-owned AudioContext,
    awaited prior release, MS91-only actual-Suno profile and timed Roland
    adapter reviewed. Current default selector remains LEGACY_PHYSICS;
    loopback preview and explicit player selection remain separate from
    recorded identity. Rollback and timed-session routing tests pass. Focused
    credential-pattern scan of app/lib/tools/docs/.openai/README/package found
    no private-key headers, OpenAI project keys or GitHub token patterns. This
    limited pattern scan is not a general secret/security certification.
    2026-10-14 partial current-source review: score acceptance/verifier, replay
    download/reassessment, leaderboard directory/mapping, recent races,
    engine metadata, scoped ranking/retention and future-engine selectors
    inspected. Legacy IDs retain their old hash input; modern IDs append an
    explicit engine domain. Retained tags are read before writes and never
    updated; missing retained modern identity rejects rather than repairs.
    Ranking filters precede windows; retention filters both candidates and
    deletion targets. Download exports are copies; launch query selection
    cannot change retained engine identity. Source default remains legacy;
    public preview overrides are ignored. Full compatibility/rankings suites
    pass with the retained QALAP91 result fixture, including new capacity and
    eight-stage transaction-failure preservation tests. This is a reviewed
    high-risk subset, not approval of the entire349-modified/1000+-new-file
    source/research change set; gate remains open.
    Reassessment transaction follow-up: all eight batch positions now have
    injected-failure coverage. SQLite transaction fixtures preserve score,
    receipt, history, replay bytes and engine identity at each failure; only
    the owning worker's explicit retry timestamp changes. Each case then
    succeeds on retry. Token takeover before the batch or during failed
    verification cannot mutate retained data or release the newer lease.
    Nine assessment tests and TypeScript pass; this does not test a live D1
    outage or close the full source-review gate.
93. [ ] Push and verify source/docs on GitHub. (Original gate 47)
94. [ ] Package verified source/assets. (Original gate 48)
    2026-10-14 actual source-only/no-Git reconstruction now tested, not merely
    its guard unit case. Copied every inventory05 file with SHA256 verification
    into new playstunts-public-source-kUQNiM (2457files); asserted all seven
    generated original modules absent and no Git repository/index. Used README
    generator against13 checksum-verified own-original files: seven modules
    installed, originals unchanged. Reused previously verified fresh611-file
    public preparation and exact locked local node_modules via temporary links;
    did not claim a fresh npm install, hosted optional artwork/ROM completeness
    or a distributable original-game archive. Supported build succeeds through
    all phases and254-file compiled diagnostic guard. Expected local-build
    message explicitly states the no-index publication boundary is unverified.
    This proves preparation/build of that source set, not Git push, deployment
    archive readiness or production-data safety. Separate private checkpoint70
    includes current runtime/dialog/redirect source: SHA256
    771f26a75c266c574955913d7d68c252fc43b48c0103794518d00602b689f6e0,
    all2465 manifest entries restored/verified in new source-restore-TmiGTY.
    Private checkpoint includes seven generated originals and public symlink;
    it must NOT be published as a Git source archive. No production database
    included; external asset links were not followed. New verification notes
    postdate this checkpoint; no later runtime edit is implied.
    Recovered-source build against the newly prepared611-file public tree
    succeeds through the supported build helper and251-file compiled guard.
    Temporary restore OGpF1x used existing locked dependencies and a temporary
    index populated only from inventory02; working repository index untouched.
    An earlier no-index attempt exposed that source ZIP builds stopped at the
    publication guard. Build now explicitly requests --local-build: absence of
    Git permits local compilation with an explicit unverified-publication
    message, while direct publication audit still fails without an index.
    Boundary regression verifies no-index rejection, explicit local allowance
    and force-staged-original rejection in BOTH modes. No generated game
    modules were added to the intended Git source set. This does not approve
    publishing a ZIP or waive source/deployment checks.
    Fresh asset preparation after the Suno distribution change succeeded with
    the documented Pillow12.3.0 dependency in an isolated temporary venv:
    /tmp/playstunts-ms91-source-preparation.HIZTd3/public.611 files generated;
    check_assets.py --public-dir reports zero asset problems. All four final
    MS1991 tracks match provenance hashes and the new generated inventory.
    This used the retained complete MS1990 installation as the required base;
    no existing public link/assets/saves were replaced. Optional Roland ROMs
    and site artwork were not supplied, so this is not full hosted-asset or
    audible verification. The initial system-Python attempt failed only because
    Pillow was absent; its temporary staging was automatically cleaned.
    Literal source-import closure does not cover private test data: several
    development suites use CTKFIN.RPL, absent from an ordinary installation.
    Do not describe those suites as universally runnable from base assets.
    2026-10-14 source-distribution gap found and corrected: final MS1991
    Suno assets existed only in external public/, but prepare_assets.py copies
    vendor/runtime into a new checkout's prepared output. Added the exact four
    final encoded tracks plus provenance under vendor/runtime/audio/remixed/
    ms91-v2; no audio transformed. New distribution regression failed ENOENT
    before copying and now verifies all four hashes/bytes and exact provenance.
    All four legacy vendor MP3 hashes match candidate inventory01 unchanged.
    Test registered first in test:ms91-suno-package. Inventory02 now contains
    2456 paths and5694 literal module edges with no unresolved source/script/
    migration dependency. This is source-asset inclusion evidence, not complete
    fresh-install, audible acceptance, publication-package or deployment proof.
95. [ ] Deploy through supported route preserving bindings. (Original gate 48)
96. [ ] Confirm deployment/domain/audience. (Original gate 48)
97. [ ] Live fresh-race/menu smoke. (Original gate 49)
98. [ ] Live enhanced graphics/audio smoke. (Original gate 49)
99. [ ] Live replay download smoke. (Original gate 49)
100. [ ] Live historical leaderboard/read smoke. (Original gate 49)
101. [ ] Compare historical replay bytes. (Original gate 50)
102. [ ] Compare historical scores/metadata. (Original gate 50)
103. [ ] Final requirement-by-requirement completion audit. (Original gate 50)

Recent evidence: registered startup, bundled music (20000 ticks), Roland race/dialog,
all-car PC resource (4400 callbacks), and cadence guards finished successfully.
Component music/cache tests do not prove browser output or real Roland timing.

Item43 partial evidence: OpeningSequence now passes selectBrowserFutureRaceEngine
to the AdLib music controller. Public queries still cannot override the legacy
default. test_native_music_versioned_lifecycle.ts exercises the actual controller
with a silent fake OPL chip/Web Audio context: both generations, five score
switches, pause/resume, retained modern cache, source disposal and idempotent close
pass. The test compares complete register traces against legacy writes filtered
through the initialized modern cache. It does not prove actual chip PCM, physical
output, or real-browser lifecycle. Item43 remains open.

Browser follow-up: retained preview tab7 exposes the six original sound choices;
Escape cancels and visible status confirms saved settings unchanged. AdLib was
not started because its current startup enables audio; a silent-output browser
test path is needed before running it under the user's mute requirement.
OpeningSequence now sets an explicit AdLib boot driver generation for both
demo and drive/replay entry, independently of the loaded replay's physics.
This closes the omitted browser connection, not actual browser sound verification.

Silent browser testing: preview-audio=muted is accepted only on exact localhost
hosts. A bound AudioContext facade redirects all destination connections through
a zero-gain sink while keeping the actual audio clock and pipeline running.
It changes no saved sound options and ignores the flag on public hosts. Local
selection, binding, sink gain and cleanup tests pass; typecheck passes. Retained
preview tab7 has loaded this QA URL. Full AdLib browser test is still pending.

Real browser partial evidence: tab7 saved AdLib through original Setup (local
origin only), launched the actual game on the muted-output URL, switched from
remixed to original music, and reached the enhanced main menu without captured
warning/error logs. Canvas testAudioOutput is muted. Screenshot:
/private/tmp/ms91-muted-adlib-preview.png. This establishes startup/menu/music
switch interaction; it does not yet measure actual PCM or complete outcome-score
transitions. Item43 remains open. Test selection changes local SETUP only;
stored races/scores are untouched. Restore prior MT32 selection after audio QA.
 
Correction after user reported audible output: the muted dataset only reflected
the query flag, not the actual retained context. startGame pre-created an ordinary
AudioContext and the effect reused it, bypassing the sink. Restart stopped the
game and returned PLAY STUNTS/Ready. Fixed the gesture-owned context creation to
use the same local-only zero-gain sink; regression test checks this previously
untested launch path. Earlier browser silence claims are withdrawn. Real-silence
verification remains outstanding; item43 is not complete. No playback restarted
after the report. Actual generated nonzero samples are not proof of muting.

Release cleanup requirement: the normal npm build now runs
check_release_test_instrumentation.mjs before compilation. It scans application
and library source for the temporary audio query/sink/diagnostic markers. Guard
tests reject every marker and accept clean source. Running it against current
source correctly fails and lists the temporary code. Item87 cannot pass until
that code is removed and the production build succeeds. Total remains103:
this is part of the existing production-build acceptance item, not a new feature.

Audible-output browser evidence (user allowed audio during tests): new tab9 on
preview-engine=ms-1991&preview-audio=observe exercised real AdLib/WASM/Web Audio.
Title:473600 frames,946254 nonzero stereo samples, peak7158, clock11.0759s.
Main-menu selection:1249792 frames,2498536 nonzero samples,peak10191,
clock28.6244s. After original→remixed→original switching:2617344 frames,
5233476 nonzero samples,peak11806,clock59.6288s,score slct retained.
No captured warning/error logs. Restart returned Ready to play Stunts/PLAY
STUNTS, then test tab9 was explicitly closed. Evidence screenshot:
/private/tmp/ms91-adlib-audio-test-stopped.png. This is real sample generation
and browser switching evidence, not original-executable PCM parity or listening
proof. Result-score transitions and full audio regression still outstanding;
item43 remains open. No recorded replay or score was changed/submitted.

Real OPL comparison: test_adlib_real_opl_parity.ts loads the exact bundled
opl.js/opl.wasm (no hardware playback) and runs both music driver generations
through actual sample-aligned streams. Four score switches,600 blocks per score,
512 frames/block,48000Hz:2457600 stereo samples compare exactly;2456406 are
nonzero. Modern retained cache crosses all transitions. Coverage is6.4 seconds
of each score, not every loop or a native executable audio recording. The existing
20000-tick sequencer corpus covers longer bounded sequencing independently.
Registered under test:ad15-bundled-music. Browser result-screen transitions remain
required for item43. No browser/DOS sound session left running by this test.

