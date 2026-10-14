# Tandy physical timing acceptance

## Functional Tandy gate45 completion audit, 2026-10-13

The release requirement is version-correct browser sound integration,
including legacy generic race samples, not a claim of vintageCPU/bus cycle
accuracy. Both drivers use documented virtual-device contracts; physical
timing observations constrain ordering, not fabricated elapsed-time constants.

| Requirement | Current evidence | Result |
| --- | --- | --- |
| Distinct legacy/modern driver layouts and helper semantics | `test:tandy-versioned-control`, `test:ms91-tandy-differential`; original driver hashes and explicit legacy defaults | Passed |
| Shipped car banks, scores, startup/dialogs and pause/resume | `test:tandy-all-car-resources`, `test:tandy-versioned-music`;396 car instruments,92 patches,8800 allocated callbacks,80 pause/resume cycles | Passed |
| Modern raw/differential sample delivery, repeat/stop and ownership | `test:tandy-sample-audio`, `test:tandy-race-binding`, automatic modern backend/raw-differential browser manual parity | Passed |
| Generic legacy sample clock, live reads, segment/completion/repeat ordering | Chip/virtual suites; firmware-constrained pre-return ordering,64KiB and callback restart tests | Passed under named virtual profile |
| Legacy allocated samples and mixed output, both physics/rates | `test:tandy-virtual-bound-demo`; exact whole/split memory/events/PCM, cancellation/read faults | Passed |
| Automatic browser wiring independent of replay physics | Automatic/explicit legacy manualPCM/full-memory parity; factory identity tests; modern automatic parity | Passed |
| Resource release, replay replacement/cancellation, errors and pending waits | Virtual lifecycle/backend tests and modern race binding suite; nestedclock drain fix, resume fix, unresolved-wait cancellation | Passed |
| Natural demo return in both driver/physics combinations | Latest `test:tandy-natural-demo`:2357 legacyphysics/959 modernphysics frames, noforcedfinish | Passed |
| Audible shipped sound transitions/settings | Userboth-edition Tandy tests and1991 clean live demo; user1990 newvirtual Original transitions; correctedUpdated title userpass; query-free live1990 progression screenshot | Passed for reported listening scope |
| No source replay mutation/defaultphysics relabel | Registered compatibility/source-byte assertions and separate driver selection | Passed in covered regressions |

All listed suites rerun against current changes, with TypeScript/diff checks
also passing. Gate45 can close for functional integration. No physicalCPU or
analog equivalence claim is made. Whole-site end-to-end audio gate47, final
regressions/build cleanup, production data backup/restore and livepostrelease
checks remain separate mandatory release gates; this is not release approval.

## Resource drain cancellation settles independently, 2026-10-13

Final integration review found resource-stop awaited the external browserframe
without racing cancellation. A hidden/background frame could remain pending.
Backend now races each wait against caller/lifetimeabort and removes its
listener afterward; closure aborts lifetime. Tests prove callerabort andclose
settlefalse with a never-resolved frame, lateframe rejection is handled, and
playback does not resume. Backend/browser lifecycle suite, TypeScript and diff
checks passed. This matches the existing modern owner's cancellation guarantee;
gate45 audit continues without assuming the browser always delivers a frame.

## Temporary legacy selector removed, 2026-10-13

Removed our temporary `preview-tandy=legacy-virtual` selector and its opening
wrapper imports after automatic-factory verification. Replaced selector tests
with registered driver-identity selection tests. Existingexplicit test hooks
remain for parity; neither public nor local runtime now requires the selector.
Virtual allocated/browser lifecycle suites, TypeScript and diff check passed.
Other pre-existing audio diagnostics remain governed by final release gate87.
No unrelated source or user files removed; deleted only our temporary selector
module/test, whose behavior is superseded by retained factory selection tests.

## Default local legacy factory selected, 2026-10-13

Browser race entrypoints now select the defined virtual backend when the
sounddevice isTandy and retained drivergeneration islegacy/untagged. Modern
factory remains separate; replayphysics is not consulted. Explicit bindings
still take precedence. Factory guard tests, automatic both-generation demo
return/abort tests, explicit legacy demo/manual lifecycle suite, TypeScript
and diff check pass. Changing-frequency tone-only fixture matches oldstream
PCM and PITdispatch counts exactly at44100/48000. No publication occurred.
Automatic legacy manual PCM/memory parity and query-free live verification
still required before gate45 closure. Localhost preview selector retained
temporarily for comparison and must be removed before final releasebuild.

## Replay cancellation resumes virtual race, 2026-10-13

Review found successful resource drain left `quiescing` set until reattachment.
Replay-load cancellation resumes the existing owner instead, so that could
leave gameplay dispatch paused. Successful drain now clears quiescence, as in
the existing modern binding. A direct both-rate regression resumes rendering
after drain, proves game dispatch resumes, then drains the newly started sample
before replacement. Wait failures close the backend; close drops retained
memory getter. Virtual browser lifecycle suite, TypeScript and diff checks
passed. Existing short load-cancel test alone had not proven continued dispatch;
this is why its earlier pass was insufficient for this edge case. Gate45 open.

## Opt-in browser entry lifecycle and natural completion, 2026-10-13

Demo/manual entrypoints now accept explicit `legacyTandyBinding`, requiring
exclusivelegacy driver identity and matching output rate. They attach live
memory plus deferred legacyBIOS tick programs, route mixedaudio to the backend,
drain active samples before release/replay replacement and close on abort.
No automatic factory/default change yet.

Manual opt-in test passed both physics editions, legacy replay startup,
sampledabort/finish and replayload-cancel/load-success. It exposed missing
nested hardware-clock progression during quiescent drain; backend now
advances the original nestedclock without dispatching another race program.
Devicebusy status, not driveractive flag, is used for drain assertions.
Demo return/abort test passed both physics editions and released queued Web
Audio sources/backend. Natural opt-in demos completed2357/959 presentedframes
without forcedfinish. Existing modern manual suite and virtual component/
allocated suites passed unchanged; tests use mocked browseraudio/input, not
live listening. Lifecycle command registered. Gate45 still open pending live
verification and remaining full-scope acceptance;71/103 (68.9%),32 remaining.

## Browser virtual backend timer/ownership tests, 2026-10-13

Implemented unselected `browser-legacy-tandy-virtual-backend.ts`: original PIT
audio offsets dispatch deferred legacy programs, with one game timer and live
memory getters. `test_browser_legacy_tandy_virtual_backend.ts` passed at both
rates: whole/splitPCM and exact PIT dispatch counts; active transfer rejects
reattachment without destroying current owner; program faults close backend
and prevent further dispatch; invalid spans preserve tick count, liveport61
and closed guards verified. TypeScript passed. AudioContext/source lifetime
and allocated browser-entry integration remain unverified; resource-stop
integration is not yet implemented, so this backend is not selected. Tests
registered in `test:tandy-virtual-bound-demo`; gate45 remains open.

## Opt-in virtual adapter implemented, 2026-10-13

`legacy-tandy-virtual-race-binding.ts` wraps the fine binding with an explicit
virtual contract: accepted mutedAH8300/CX1/DX1 advances to the next actual
device request and services its completion before return; other BIOS calls
return atomically. Render coverage uses absolute chip deadlines, not an added
duration, so callback-advanced time is not double-counted. Enabled delivery
services pending IRQs at render entry and after each edge; idle advancement
skips unobserved requests without memory reads. Clock profile values are
snapshotted against caller mutation. It is not an SL/2 cycle model and is not
selected by browser defaults.

`test_legacy_tandy_virtual_race_binding.ts` passed44100/48000 whole/splitPCM,
muted/full playback, pending64KiB segment, callback restart, no duplicate
completion, long idle span and invalid-input state preservation. TypeScript
and diff checks passed. Actual allocated-race/browser adapter acceptance is
next; gate45 remains open,71/103 (68.9%),32 remaining.

## Integration boundary review, 2026-10-13

Short read-only Astra review recommends an opt-in named virtual-device adapter,
not a fabricated historicalCPU delay. For the observed mutedAH8300/CX1/DX1
reset sequence, advance to the device's next actual DMA event and service its
completion inside the owning BIOS callback; resume the continuation afterward.
Other requests retain explicitly documented virtual return semantics rather
than synchronously completing whole buffers. Service segment/repeat/finalIRQ
events independently and include callback-advanced clocks in render deadlines
to prevent double-counting. Browser race attachment must request deferred
legacy tick continuations. Acceptance must test the adapter itself across both
physics editions/rates/splits and teardown, plus sample-start and repeat cases.

This is the next implementation direction. No adapter is selected yet, and
physicalCPU timing accuracy remains a separate unproven claim. A complete8086
cycle emulator is not a prerequisite for the named virtual-device compatibility
contract, but observational ordering alone is not proof of matching PCM phase.
Gate45 remains open until functional integration is implemented and verified.

## Pre-return completion teardown, 2026-10-13

Added cancellation and throwing-completion cases inside the owning BIOS call
to `test_legacy_tandy_fine_race_binding.ts`. Both release the generator's
finally, leave no pending BIOS return, prevent the second playback/CPU resume,
revoke retained bus access and issue no subsequent live-memory reads. Full
fine-binding suite and TypeScript passed. This closes the tested lifecycle
edge case only, not automatic scheduling/browser integration; gate45 open.

## Allocated race pre-return ordering regression, 2026-10-13

Extended `test_legacy_tandy_fine_bound_demo.ts` to complete and deliver the
initial muted request inside the owning BIOS callback, before returning true
and resuming the original race continuation. Both physics editions,44100/48000,
sample-only/mixed tones and whole/split audio blocks match the existing
explicit-return fixture exactly: full memory, port/BIOS/byte/completion events,
PCM and frame. Original CTKFIN.RPL bytes unchanged. Full fine-binding suite,
TypeScript and diff check passed.

This verifies integration tolerates the firmware-observed pre-return ordering.
The fixture still supplies one chip of elapsed time; it does not convert the
emulator's aggregate PIT measurement to a BIOS duration or automatically
schedule browser CPU work. Gate45 remains open, profile unselected.

## Original voice-update restore interval in emulator, 2026-10-13

Own `--back-to-back --restore-gap` probe uses the exact intervening bytes
`5a595b58079db483cd1a` (POP DX/CX/BX/AX/ES, POPF, MOV AH83, INT1A).
Upcoming full-request registers/flags are saved before the muted call.
No timestamp, screen output or first-call flag capture is inserted into the
restore interval. Displayed flags therefore describe the second call.
Synthetic execution verifies requestedCX4/DX4095/AX8307 and balanced stack.
Installed emulator screen `04CC F202 0001 0002 F246 F000 A5E5 F202` confirms
accepted full playback, two completions, idle finalstatus and firstcompletion
insideBIOSsetup. Aggregate1228 PIT ticks includes saves/restore/instrumentation,
not an isolated CPU gap measurement. This supplies hardware-backed ordering
for the voice-update interval, not the distinct26-instruction sample-start
path or arbitrary rates/repeats. Artifacts `restore.img`, `restore.log` and
screenshot retained; disposableVM terminated, gate45 remains open.

## Immediate silent/full sequence accepted, 2026-10-13

Own boot probe `--back-to-back` issues AH8300/CX1/DX1 then AH8307/CX4/DX4095
before timestamping or printing. Original installed-emulator SL/2 screen:
`04AC F202 0001 0002 F246 F000 A5E5 F202`. Both playback calls returned
carry clear/IF1; early count1, finalcount2, finalstatus idle. First IRQ still
interrupted BIOS setup atF000:A5E5. This independently confirms the silent
request does not leave this profile busy and block the following playback.
Instrumented aggregate1196 PIT ticks is not a general BIOS timing constant.
The first interrupted frame is retained despite the second completion.
Generated code and synthetic stack/control-flow tests passed, artifacts
`back.img`, `back.log` and screenshot in `playstunts-sl2-vm-xcJR8V`.
Disposable VM shut down. Gate45 remains open; broader CPU scheduling and
actual driver instruction-gap verification still required before selection.

## Completion interrupts BIOS before return, 2026-10-13

ROM-specific nested IRQ frame probe screen:
`02AC F202 0001 0001 F246 F000 A5E5`. The final fields identify the hardware
IRQ's interruptedCS/IP, extracted beneath INT15's frame and the six saved
words in the hashed SL/2 ISR. Independent synthetic stack test preservesAX/BP
and stack balance. OriginalROM disassembly places F000:A5E5 at the finalRET
of DMA setup, immediately after DMA channel1 unmask OUT atA5E2. Thus this
installed emulator/8086/8MHz profile delivered mutedCX1,DX1 completion while
still inside BIOS setup, before AH83 returns to the diagnostic. This rules
out an always-post-return completion policy for this reference case.

The instrumented delta684 ticks includes our longer callback instrumentation;
it must not replace the previous650–652 result as uninstrumented BIOS latency.
No generalized elapsed-time constant, other rates/buffers, CPU configurations
or browser scheduling proof follows. Next integration acceptance must include
this pre-return completion ordering and preserve version/profile distinctions.
`stack.img`, `stack.log` and screenshot retained in isolated scratch
`playstunts-sl2-vm-xcJR8V`; gate45 still open, application defaults unchanged.

## Matching BIOS run and reset repeat, 2026-10-13

Five-word measured image produced `028C F202 0001 0001 F246`; a hard-reset
repeat produced `028A F202 0001 0001 F246`. Instrumented intervals652/650
PIT ticks versus baseline48. The callback was already delivered by the early
snapshot after the post-call timestamp routine, and did not repeat afterward.
Both returnedIF1/carry0, finalAH81 idle. Difference602–604 ticks is a paired
aggregate observation, not pure BIOS latency: instruction prefetch, timestamp
alignment and interrupt service differ from the no-INT baseline. Two-tick
variation also rules out treating the first observed interval as an exact
fixed duration. Need IRQ timestamp/return-boundary evidence before scheduling
the application from this profile. Source timing path remains unselected.
Captures and measured.log retained in isolated `playstunts-sl2-vm-xcJR8V`;
no stored game data changed. Gate45 remains open.

## Baseline boot measurement, 2026-10-13

The updated boot diagnostic records completion count before screen output;
baseline mode omits only the first INT1A. Both generated paths pass the
stubbed control-flow checker. Isolated installed86Box baseline screen shows
`0030 F046 0000 0000 F246`:48 PIT ticks of instrumented overhead, no callback,
IF clear before the final AH81 enables it. This is a baseline observation,
not an exact correction for an IRQ-interrupted BIOS path. A new matching BIOS
run is required; do not subtract this from the old differently instrumented
four-word probe and call the result authoritative. Saved baseline screenshot
and baseline.log in `playstunts-sl2-vm-xcJR8V`; VM powered off afterward.
Gate45 remains open;71/103 verified (68.9%),32 remaining.

## First isolated boot measurement, 2026-10-13

Installed86Box7.0 build10394 booted our own164-byte8086 diagnostic from a
360KiB image with the pinned SL/2 ROM copies. Startup log and rewritten scratch
configuration confirm tandy1000sl2,8086/8000000Hz,640KiB, software renderer,
isolated global/VM paths and diagnostic floppy. Screen: `028E F202 0001 F246`.
Thus the AH8300,CX1,DX1 call returned carry clear with IF enabled; one final
callback occurred during the subsequent wait, and AH81 returned idle. PIT
delta028E is654 ticks for the entire instrumented interval, including the
second timestamp routine and register setup; not pure BIOS latency or a
production scheduling constant. No proof yet of the precise terminal/IRQ
timestamp relative to BIOS return. Calibrate overhead and add event timestamps
before selecting a timing policy. This is independent emulator evidence, not
physical-machine measurement or proof of equivalence to the earlier pinned
source commit.

Artifacts: scratch `playstunts-sl2-vm-xcJR8V` (manifest, reference.log, config,
probe.img), screenshot `vm/screenshots/Monitor_1_20261013-180008-451.png`.
The disposable VM was powered off after capture. Existing user machines,
game records and live deployment unchanged. Gate45 remains open.

## Diagnostic8086 instruction compatibility fix, 2026-10-13

The repeat branch in our own COM generator used PUSHA/POPA, which are not
8086 instructions. Replaced them with balanced individual register saves
and restores before using this probe on the selected SL/2 reference machine.
`tools/check_tandy_probe_registers.py` executes the generated interrupt
handler, deliberately clobbers BIOS-call registers, and verifies restoration,
balanced stack and return target. Both flat and cross-boundary repeat probes
passed; explicit8086 save/restore sequences independently checked because
Unicorn16-bit mode does not enforce an8086-only instruction set.
Scratch `/private/tmp/playstunts-8086-probe.HB7cXe`. This fixes our diagnostic,
not application playback, and supplies no elapsed-time proof. Earlier DOSBox
results remain emulator observations, not8086 execution acceptance. Gate45
remains open;71/103 verified (68.9%),32 remaining.

## Installed emulator measurement route, 2026-10-13

Read-only preflight found `/Applications/86Box.app/Contents/MacOS/86Box`,
bundle version7.0 build10394, executable SHA256
`310d4e6454313b8d2168ed8287bfa615c7e5c34eb77df6721815c5aade1ed885`.
Its `--help` exited0 and explicitly supports separate VM path (`-P`), global
configuration (`-O`), ROM path (`-R`), floppy image (`-I`) and logfile (`-L`).
An isolated reference run must supply all applicable paths in a fresh scratch
directory, not use Sven's existing machines/global settings. No VM was booted,
no firmware or guest image attached, and no existing configuration edited.

This installed build is not the pinned source commit used by the callback
oracle. Before accepting timestamps, identify its build source/CPU settings
and capture the actual machine/firmware identity. It can provide an independent
measurement route; its mere presence is not timing verification. The older
documented `-Y` do-nothing option was not advertised by this executable, so do
not rely on it for safe startup. Gate45 remains open.

## Pinned SL/2 CPU configuration, 2026-10-13

`node tools/check_sl2_cpu_reference.mjs` passed against 86Box commit
`2cbc44b2a59a9e871e4bc5aaff1c4eb492576dda`, checking source SHA256s.
The matching SL/2 machine explicitly uses the8086 CPU package, not the
TL80286 profile. Pinned CPU code distinguishes aligned word accesses,
prefetch/bus work and timer deadlines. Its I/O rule uses four cycles for
this path (five for Mazovia), unlike the newer mutable source's configurable
I/O rule. Consequently do not combine modern source timing with the pinned
DAC reference as if they were one measured machine. This establishes the
reference configuration only, not elapsed BIOS time or CPU execution proof.
No application timing/default change; gate45 remains open.

## CPU timing reference boundary, 2026-10-13

Read-only inspection of official 86Box `src/cpu/808x.c` shows that elapsed
time is not a fixed instruction-count multiplier: `readmemw` distinguishes
aligned 8086 accesses from two byte accesses, `cpu_io` uses machine-specific
I/O cycles, and `fetch_and_bus` includes prefetch and refresh work before
`clock_end` processes timer deadlines. Therefore the 8/26-instruction TD15
gaps and 152/153-instruction firmware calls cannot establish an authentic
BIOS-return delay by themselves. Do not convert those counts to a single
constant delay or select the one-chip test fixture for browser playback.

Source inspected: https://github.com/86Box/86Box/blob/master/src/cpu/808x.c
(mutable reference, not a pinned executable timing oracle). Next required
evidence is a named machine/CPU configuration with event timestamps for BIOS
entry, DMA programming, terminal count, IRQ service and BIOS return. Pin the
reference before using its timing as an acceptance oracle. No CPU source was
copied into application assets and no production timing profile was selected.

Current-worktree rerun of `test:tandy-chip-timeline` and
`test:tandy-fine-bound-demo` passed, including both engines, both output rates,
sample-only/mixed rendering, split-block equivalence and cancellation/fault
teardown. Those tests still supply BIOS windows explicitly; gate45 remains
open and release progress remains71/103 (68.9%),32 remaining.

## Composed firmware/DMA boundary count, 2026-10-13

`tools/trace_sl2_bios_dma.py` executes original AH83 and each original IRQ,
using explicit8237 byte-count/address/flip-flop/mask behavior. Count0 consumes
one byte then reaches terminal; address wraps within DMA page until BIOS
reprograms the next page. Five cases: requested1/4 transfer1/4 without crossing;
requested2/18 at3FFFF transfer3/19, requested4 at3FFFE transfers5. All have one
final AX91FB, with two terminal segments in crossing cases. Firmware counts
therefore produce one extra byte at the tested boundary under this controller
contract, unlike exact-length helper/DOSBox behavior. This is specific to the
hashed SL/2 bank, not a reason to change all existing playback.
Evidence `playstunts-sl2-firmware-XMBDDh/sound-dma.json`. Grants and IRQ windows
are explicit; no cycle/physical timing claim. The count-minus-one contract is
also visible in official86Box DMA controller source (terminal after decrement
below zero). Further profile selection must retain this distinction.

## Authentic SL/2 DMA IRQ executed, 2026-10-13

`tools/trace_sl2_bios_irq.py` executes F000:A5E6 against terminal states0/1/17.
Final IRQ restores the previous IRQ7 vector before INT15 AX91FB, then sends
PIC EOI and IRETs. Intermediate IRQ increments DMA page, programs/unmasks the
next segment and emits no final callback; same final EOI.36/103/103 executed
instructions, with IF trace preserved. Terminal state and hardware ports are
explicit inputs, not autonomous DMA/CPU timing evidence.

Important boundary detail: remaining1/17 programs DMA count bytes[1,0]/[17,0].
Do not silently equate that BIOS residual count with the generic helper's
remaining-byte quantity or the earlier DOSBox segmentation profile. Its
physical total-byte behavior needs a composed DMA-controller comparison before
choosing the SL/2 production profile. Existing normative helper was not changed.
Evidence `playstunts-sl2-firmware-XMBDDh/sound-irq.json`; original ROM unchanged.

## Authentic SL/2 BIOS calls executed, 2026-10-13

Verified sound entry F000:A43C, not the similar video-bank AH80 dispatcher.
`tools/trace_sl2_bios_calls.py` executes original verified ROM through its
RETF2 return with explicit DMA-count/PIC/DAC port inputs. Six cases pass:
idle/busy-length/busy-DMA/terminal-count AH81, silent CX1/DX1 AH83 and a two-byte
64KiB-crossing AH83. Status AX00C4/carry follows remaining length then DMA count;
crossing playback retains the next segment. Silent playback emits divisor1,
volume0 and DMA unmask without the DOSBox rate cap.

Important profile difference: caller starts IF0, firmware executes STI at
entry, and all tested returns have IF1 (RETF2 discards saved flags). It does
not restore caller IF like the earlier emulator callback. Accepted playback
returns AX1 here; the abstract transfer helper's AX convention is not claimed
to match this undocumented register result. Driver saves/restores registers
across its silent-call wrapper. Executed instruction counts39/37/53/53/152/153
are not cycle durations; DMA/IRQ progress is still explicitly stubbed.
Scratch `playstunts-sl2-firmware-XMBDDh/sound-calls.json` preserves ordered
instructions/IF/ports/results and original ROM hash. Next: actual IRQ handler
trace and fine CPU progress profile, keeping SL/2 separate from TL.

## Isolated SL/2 firmware bank prepared, 2026-10-13

`tools/prepare_tandy_sl2_reference.mjs` fetches pinned paired images, verifies
their Git blob SHA1 and262144-byte length, and writes exclusive scratch files.
Official loader's per-file offset18000 selects full-interleaved30000 bank for
F0000..FFFFF. Selected64KiB SHA256
`a3a79791ed4ca85c4206412a2138ca8587e616dad2282a22812ccd6eac6c3c71`;
far reset jump verified. Metadata scans locate potential AH81..85 dispatches,
not verified entrypoints. Scratch directory
`/var/folders/1f/7shykqsd14z52x5wzspmw9k00000gn/T/playstunts-sl2-firmware-XMBDDh`.
Raw ROMs are reference-only outside app/public and have not been executed.
No BIOS duration/IRQ-window claim follows from this preparation. Next step is
identify service entry/state dependencies and execute bounded firmware calls.

## Firmware reference availability, 2026-10-13

Official86Box ROM inventory has no named1000TL entry, but includes the SL/2
PSSJ machine's paired256KiB images. Pinned ROM repository commit
`be34bde82fae674aefdd80cad196a9a2fa3b5211`:
`machines/tandy1000sl2/8079047.hu1` blobSHA1
`9c653567779899cec58a423db83bf5157278d7bf`, and
`8079048.hu2` blobSHA1 `4e526ae52245f49c0e69e69f6ec2ed380fe0085b`.
Official `src/machine/m_tandy.c` loads them interleaved into512KiB and maps
the banked ROM window. Metadata/machine-loader inspection only: firmware has
not yet been executed or bundled/downloaded into the application. This gives
a named alternative for authentic BIOS service investigation rather than
pretending DOSBox's high-rate guard establishes a physical handoff duration.
SL/2 is a separate machine profile, not automatically a TL cycle reference.

## Original driver inter-call sequence and register fix, 2026-10-13

Unicorn executes original hashed legacy TD15 from preserved ms90.zip.
`tools/trace_original_td15_bios_gap.py` records26 instructions through the
second INT1A for sample-start,8 for voice-update. BIOS calls are stubs, so these
are instruction sequences, not CPU-cycle or firmware-time measurements.
Artifacts `/private/tmp/playstunts-td15-bios-gap-20261013-a.json` and `-b.json`
include unmodified and deliberately perturbed descriptor runs. Both voice
traces emit the same second BIOS request despite retained descriptor changes:
DX/CX/BX/AX/ES/flags are restored from pre-call stack values, not reread memory.

The port previously rebuilt that request after yielding the silent call.
It now snapshots playback registers before yielding, while preserving resumed
driver-memory mutations. Adversarial saved-register regression and actual
allocated fine-chip tests pass. Sample-start's longer sequence remains distinct;
its parameter/descriptor reconstruction after the call was not changed.

## Executed pinned PSSJ component oracle, 2026-10-13

`tools/check_pssj_high_rate_reference.mjs` fetches the pinned86Box file,
requires its exact SHA256, extracts unmodified update/IRQ/DAC callback bodies,
and compiles a scratch-only C harness with explicit DMA/PIC/timer stubs.
Eight divisor1/4095 × amplitude0/15 × IRQ gate off/on cases pass. Every callback
reads the one byte and raises terminal state regardless of amplitude/rate;
PIC delivery follows its enable gate. Native chip/transfer comparison reads
once at the corresponding divider edge, returns192, completesAX91FB and clears
busy. No BIOS/CPU/analog equivalence inferred, no next-timer rewrite modeled.
Evidence directory:
`/var/folders/1f/7shykqsd14z52x5wzspmw9k00000gn/T/playstunts-pssj-high-rate-C6FflQ`.
This executes the high-rate component alternative missing from DOSBox's guard,
not a full Tandy BIOS handoff. Third-party bodies remain scratch-only, not in
the application bundle. Explicit reference test requires network and clang.

## Alternative high-rate reference located, 2026-10-13

Pinned [86Box PSSJ source](https://github.com/86Box/86Box/blob/2cbc44b2a59a9e871e4bc5aaff1c4eb492576dda/src/sound/snd_pssj.c),
SHA256 `fe3c5dab27cfeed398cb81fd50274630f9611ac2da0d184354fb665bb9fb7820`,
uses divider/3579545-second timer periods without DOSBox's49kHz rejection.
Its DAC callback reads DMA channel1 regardless of amplitude; terminal count
sets IRQ and applies control-register gates. This independently supports
keeping chip requests active while muted, including divisor1, but source
inspection is not an executed BIOS/CPU handoff trace. It also leaves an active
timer's next deadline intact on frequency writes, whereas the manufacturer's
divider-reload specification is used by our chip clock; do not silently mix
these two phase profiles. Next: execute bounded high-rate DMA component oracle
and then establish BIOS/CPU progression before browser-owner selection.

## Short-transfer emulator limitation isolated, 2026-10-13

Two fresh same-profile probes separate volume from frequency:
`/private/tmp/playstunts-tandy-bios-volume.9LvXJs/TRACE.BIN`, first AL7/DX1,
is `[0,0,1,0,0]`; `/private/tmp/playstunts-tandy-bios-divisor.A4xi4O/TRACE.BIN`,
first AL0/DX4095, is `[0,0,1,0,1]`. Muting does not explain absent completion:
the slow muted one-byte transfer completes; fast audible one does not.

Pinned [Tandy DAC source](https://github.com/dosbox-staging/dosbox-staging/blob/v0.83.0/src/hardware/audio/tandy_sound.cpp)
ChangeMode deliberately discards sample rates >=49000Hz before registering DMA
callback/waking the channel. DX1 requests3579545Hz, so this reference profile
cannot establish actual hardware's silent DX1 handoff timing. The tests reveal
an emulator fidelity limit, not evidence that physical Tandy DMA should hang.
Do not copy that guard into the documented physical chip-clock implementation.
Earlier flat/cross low-rate IRQ-order evidence remains bounded to that profile;
a valid high-rate reference or supported physical timing evidence is needed
for the automatic short-transfer owner. No release-gate closure inferred.

## Back-to-back silent/full probe, 2026-10-13

Own209-byte `--back-to-back` flat/nonrepeat probe starts AX8300/CX1/DX1,
records carry/count, then restores the buffer and requests AX8307/CX4/DX4095
without the earlier masked-poll delay. Same identified DOSBox0.83.0 profile,
cpu_cycles5000, headless dummy SDL. Trace
`/private/tmp/playstunts-tandy-bios-back-to-back.bHmHTG/TRACE.BIN` is
`[0,0,1,0,0]`: first accepted, no notification before second call, second
rejected busy, no notification immediately after it or after enabled polling.
This own probe includes diagnostic instructions, not the original driver's
exact intervening sequence. It contradicts assuming one-byte playback already
completed at the next BIOS call. No automatic service delay is justified by it.
Next evidence must resolve short/muted DMA progress and BIOS entry/return
scheduler positions before selecting an emulator-event owner. The strict
verifier retains this observed negative result, not a successful handoff claim.

## Executed repeat-playback probes, 2026-10-13

The same pinned executable/profile runs the generator with `--repeat`,
restarting the four-byte sample exactly once from the INT15 AX91FB hook.
Flat trace `/private/tmp/playstunts-tandy-bios-repeat.vZI4po/TRACE.BIN` is
`[0,0,1,1,2]`: the status window delivers completion, starts another playback
and returns busy. Cross-boundary trace
`/private/tmp/playstunts-tandy-bios-repeat-cross.4MJdu4/TRACE.BIN` is
`[0,0,1,0,2]`: intermediate service remains busy without final notification;
enabled polling eventually receives exactly two final notifications.

The strict verifier accepts all four modes. The registered regression
`tools/test_legacy_tandy_probe_order.ts` reproduces all four observed word
arrays through explicit legacy mixer DMA and BIOS-service windows. Fixture
frame positions are not measured emulator timings. Generic automatic owner
integration and broader CPU profiles remain open; this is not a vintage
hardware latency claim. User separately confirms the live 1991 Tandy/Original
menu → automatic demo → menu transition sounds clean.

## Executed64KiB boundary probe, 2026-10-13

The same identified executable/profile runs own242-byte diagnostic with
`--cross-boundary`: DOS-reserved128KiB, four sample bytes at physical boundary
minus2. Trace /private/tmp/playstunts-tandy-bios-cross.Ec952z/TRACE.BIN is
`[0,0,1,0,1]`: accepted; no masked final callback; first status call reports
busy and still no final callback; enabled polling yields exactly one completion.
This confirms intermediate IRQ/reprogramming is distinct from final AX91FB,
and BIOS stays busy until the second segment finishes. Verifier
tools/check_tandy_bios_probe.mjs checks both recorded flat/cross traces.
It establishes ordering for the chosen emulator, not a measured vintage gap.

## Executed emulator ordering probe, 2026-10-13

Identified installed DOSBox Staging0.83.0 (7b400), executable SHA256
`8cd288afbe7deb5e058112e29dfbd38d87d1f08bdc30db50d8980e02a66418f5`.
Pinned reference [v0.83.0 BIOS source](https://github.com/dosbox-staging/dosbox-staging/blob/v0.83.0/src/ints/bios.cpp)
installs INT1A with CB_IRET_STI; its [callback implementation](https://github.com/dosbox-staging/dosbox-staging/blob/v0.83.0/src/cpu/callback.cpp)
executes STI before the native BIOS handler.

Own185-byte diagnostic generated by tools/generate_tandy_bios_probe.mjs and
executed headlessly, machine=tandy, sbtype=none, tandy=on, mididevice=none,
cpu_cycles=5000, no primary/local configuration or autoexec. Four-byte playback
DX4095 starts with caller interrupts disabled, then polling allows DMA time
without BIOS calls. Probe counts intercepted INT15 AX91FB before/after AH81.
Trace /private/tmp/playstunts-tandy-bios-probe.tf9M2U/TRACE.BIN contains five
little-endian words `[0,0,0,1,1]`: playback accepted; no completion before status;
status idle; completion delivered inside status call; still one after STI.

This is executable emulator evidence, not vintage TL ROM timing. It resolves
one ordering requirement: a pending notification can execute within a BIOS
call's enabled-interrupt window, before returning to the calling program.
Next owner work must allow that explicit owning-boundary delivery, not always
defer it until the next game IRQ. No exact firmware duration inferred.64KiB
intermediate reprogramming, repeated playback and broader CPU profiles remain
to be traced. No original game/replay files were executed or altered.

## Manufacturer evidence rechecked 2026-10-13

Primary source: Tandy 1000 TL Technical Reference Manual, printed BIOS
services pages 43–46. Preserved OCR and original PDF are in the external
`Reconstruction/work/tandy-hardware` assets, not modified by this audit.

- AH81 status returns AX00C4 with carry indicating busy.
- AH83 playback accepts ES:BX, CX length, DX1–4095 and AL0–7 volume.
- AH83 starts DMA and returns without waiting for the entire transfer.
- DMA completion causes a hardware interrupt; BIOS then calls INT15 AX91FB.
- BIOS hides the DMA64KiB boundary from the application.
- Input and output DX rates differ, including between SL and TL machines.

These document interface/order, not CPU instruction duration or simultaneous
event priority. "Immediately" is not evidence for zero execution time.

## Current implementation evidence

The opt-in legacy mixer now separates DMA terminal count, queued completion
notification, owning-bus completion delivery, game IRQ and BIOS return.
Both-physics allocated replay whole/split memory/PCM regressions pass with
explicit fixture positions. Modern direct-DAC/PIT and continuation tests pass.
These are component/ownership proofs, not a physical machine trace.

## Required next evidence for gate45

1. Select and identify a concrete supported machine/firmware timing reference.
   Do not silently combine TL firmware with SL rates or another CPU model.
2. Trace AH83 start/return, DMA register/byte events, hardware IRQ entry and
   INT15 AX91FB delivery in that reference, including busy requests, completion
   while interrupts are masked, repeat playback and64KiB boundary crossing.
3. Establish when BIOS busy state clears. The present transfer helper clears
   active transfer at terminal count; this does not by itself prove when real
   firmware makes AH81/AH83 observe an idle device.
4. Replay those traces through the explicit binding and compare PCM, bus
   ordering, driver memory and frame advancement under whole/split buffers.
5. Integrate the verified owner into browser race/menu resource transitions,
   then perform live playback/listening and persistence acceptance.

No ROM/firmware trace was established by this audit. Do not close gate45 or
enable a production hardware profile based on the manual alone.

## Independent emulator source audit, 2026-10-13

[DOSBox Staging BIOS implementation](https://github.com/dosbox-staging/dosbox-staging/blob/main/src/ints/bios.cpp)
was inspected directly (moving main branch; not a pinned execution trace).
`Tandy_TransferInProgress` first checks remaining BIOS buffer length, then the
DMA count. With no remaining segment and countFFFF it reports idle independently
of completion callout delivery. This supports separating final DMA idle status
from AX91FB notification for that emulator reference; it does not prove vintage
TL ROM instruction timing.

`Tandy_SetupTransfer` splits at physical64KiB boundaries. The hardware IRQ
handler starts the next segment if BIOS length remains, and invokes the final
completion callout only when no segment remains. Consequently the byte-edge
owner must represent the intermediate IRQ/reprogramming pause, not assume all
physical bytes stream continuously over a boundary. Current live-memory helper
can receive externally supplied gaps, but does not generate this firmware work.

Next trace should include physicalFFFE with four bytes: two bytes before the
boundary, intermediate IRQ/reprogramming, then two bytes and final callout.
Busy must remain asserted through the intermediate segment even after its DMA
count reaches terminal count. No helper/default changed from source audit alone.
