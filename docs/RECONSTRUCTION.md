# How this reconstruction was developed

Play Stunts reconstructs the behaviour of the supplied December 1990 Stunts game for a browser. Sven directed the project and tested it, with Codex assisting with implementation and investigation. It is a work in progress, not a claim of perfect equivalence.

## 1. Identify and decode the resources

The game installation contains compressed resource containers, images, shapes, car parameters, tracks, opponents and sound data. Importers unpack these formats, validate their structure and extract the data needed by the browser. The resource importer was checked against the public 4d-stunts/restunts format work; that contribution must be credited rather than implying all format knowledge was independently discovered.

## 2. Study executable behaviour

Investigation used the original executable and captured original execution state to understand routines, data layouts, integer arithmetic and transitions between menus, racing, crashes and replays. Executable unpacking and analysis were development steps. The main reconstructed game runs native TypeScript; a separate DOS reference was used for comparisons.

## 3. Reimplement connected game systems

The implementation includes resource handling, menus, setup, input, track editing, car and collision behaviour, replay controls, rendering and sound-device paths. Preserving integer units and original state transitions matters because changing them can change driving behaviour and saved replay outcomes.

## 4. Compare with the original

Tests compare reconstructed calculations and state against original-executable captures, including registers, memory and framebuffers. Connected game sessions and visual comparisons check behaviour that isolated helper tests cannot establish. Some comparison fixtures contain original data and therefore are excluded from the public source package.

## 5. Add browser integration and optional rendering

Browser input, browser-local saves, track import and the surrounding website make the game usable without installing a DOS environment. Optional upgraded rendering is a separate presentation path. It must preserve track and car geometry while improving presentation; original graphics modes remain selectable.

## Sound attribution

Reconstructing the game’s sound-driver commands is distinct from recreating a synthesizer or sound chip. Third-party sound components and their licenses must be credited individually. Original Roland ROMs remain separate user-supplied files. No claim is made that the MT-32 hardware was independently reverse engineered for this project.

## Limits and reproducibility

Visual and behavioural discrepancies are possible. Historical development captures are not a substitute for a repeatable public asset preparation pipeline. The source release must document both what has been verified and which parts still need supplied data or further work.

The public preparation pipeline now derives the required runtime data from user-supplied original files and generates fresh startup memory through the native initialization routines. Historical original-execution captures are not an installation dependency. See the README for the complete commands and the distinction between optional website scans and in-game assets.

## September 2026 renderer-parity update

The optional upgraded renderer now retains native track signs and destruction state, camera-relative cloud altitude, all six transporter wheels, stable coplanar car details and flush wheel hubs. The Acura NSX window-to-body seam is closed in presentation only. Racing wheels use post-render vertices from the original renderer, preserving its signed steering transform and per-wheel suspension displacement without writing back to simulation state. Original graphics, physics, replay data and file formats are unchanged.

The same update corrects the public shortcut list and two saved-file TypeScript types. The private original-data regression suite passed all 1,518 tests, followed by a clean TypeScript check and production build. Those original-data fixtures are intentionally excluded from this public source package.

## September 2026 public source link

The main site navigation now includes a GITHUB ↗ item linking directly to the public ACatWithEbola/playstunts repository in a separate tab. It uses the existing navigation styling and does not change the game, original assets or renderer.
