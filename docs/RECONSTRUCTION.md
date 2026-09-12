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

## September 2026 lighting and shadow update

The optional upgraded renderer now applies restrained three-step directional lighting while preserving the original palette and source geometry. A world-fixed Sun drives one physical car shadow and a shared scenery-shadow system for raised roads, bridges, ramps, loops, tunnels, buildings, barriers, signs, fences, windmills and the starting truck. Shadows use the nearest visible receiving surface, remain available throughout the camera-visible world, preserve patterned openings and resolve to a slightly softened almost-black. The windmill rotor therefore casts its actual animated blade shapes rather than a filled circle.

Racing cars receive a presentation-only, model-specific grounding offset derived from their supplied tire geometry. It follows banking, slopes, elevated roads and jumps without changing simulation state, collision or replay data. Start and finish gantries and other edge-on vertical panels receive a minimum compatibility outline so geometry visible in the original rasterizer does not disappear in the GPU renderer.

Roads, cars and scenery gain restrained atmospheric distance colouring beyond five track tiles. Grass is explicitly excluded from that hue shift: it keeps its original green and receives only broad, world-fixed brightness variation from 94 to 105 percent. The private original-data regression suite passed all 1,543 tests, followed by TypeScript checking, focused linting and a production build. A local live check measured 118–120 displayed frames per second on the development machine; this is not a cross-device guarantee.

## September 2026 upgraded-renderer refinement

The upgraded renderer now uses the shared 3D car-study lighting and material response in races, the car-selection display and the opening animation. Authored paint hue and saturation, lamp colours, geometry, wheel placement, model topology and original-material patterns are retained. Attached Ferrari GTO lamps receive presentation-only host-panel depth so the complete source lens remains visible, while source line primitives use the scaled width of one original display pixel. Reused shader programs and temporary retention of the outgoing menu model avoid recompiling the same car materials during ordinary car changes.

Road centre markings keep their authored footprint and are projected onto the actual source road triangles, including banked and sloped pieces, rather than being widened according to the camera angle. Presentation-only seam trimming removes raster-era road overhangs at tile joins without changing collision geometry. The original 2D renderer remains unchanged.

The scenery-shadow pipeline now filters solid silhouettes while retaining exact coverage for perforated bridge decks and windmill blades. It blends overlapping near and distant cascades, keeps ambient surface colour in shadow, excludes presentation helper triangles, and separates mixed road models so flat asphalt, median surfaces and ground-contact approach aprons receive shadows without casting large false slabs. Raised structures, bridges, trees, buildings, signs and markers continue to cast. Devices without half-float render-target support use the bilinear depth-comparison fallback.

The private original-data tests, TypeScript check, focused lint checks and production build passed for the published revision. Those fixtures and generated original-game assets remain outside this public source package.
