# Play Stunts

A native browser reconstruction of **Stunts / 4D Sports Driving**, developed by Sven with assistance from OpenAI Codex.

Play the hosted version at **https://playstunts.com**.

## Status: source snapshot, not a standalone game download

This repository shares the reconstructed application source. **The original game files, Roland ROMs, extracted artwork and original execution captures are deliberately excluded.**

**A fresh checkout cannot currently run the complete game from an original DOS installation alone.** Some runtime catalogs and startup data still require the development extraction/capture pipeline. The basic extractor below does not generate all required runtime files. Making that pipeline self-contained is outstanding work. Please do not interpret a successful dependency installation as a playable installation.

## What is implemented

- Native menus, driving, track editing, opponents and replay controls.
- Original MCGA, EGA, CGA, Tandy and Hercules display options.
- Optional full-colour upgraded rendering.
- Original sound-device command paths, including Roland MT-32 integration.
- Browser-local saves, backups and original `.TRK` track imports.

The main reconstructed game runs TypeScript rather than executing the DOS game. Original execution was used during development for behavioural comparisons. Accuracy is a continuing effort; not every situation is verified.

## What you need to provide

1. Your own complete, compatible original Stunts installation. The implementation targets the supplied December 1990 revision; other releases are not automatically compatible.
2. Locally generated runtime data. See the outstanding preparation limitation above and [setup guide](docs/SETUP.md).
3. For MT-32 sound only: compatible control and PCM ROMs. These are separate from Stunts and are not included. Other sound choices do not need Roland ROMs.
4. Node.js and npm matching `package.json`; Python 3 for the included resource tools.

[Original resource checksums](docs/original-file-checksums.json) identify the reference resources. [Runtime checksums](docs/runtime-file-checksums.json) list the reference site's local asset set. Neither manifest contains the assets, nor grants permission to redistribute them.

## Available tools

```sh
npm ci
npm test
python3 tools/extract.py /path/to/your/stunts local-assets/extracted
npm run assets:check
```

The extractor decodes resource containers, shapes, car data and tracks into `local-assets/extracted`. It is a development tool, **not a complete game installer**. The checker reports missing/different files without downloading anything. Missing assets are expected in a clean clone.

After supplying the complete prepared runtime assets in `public/`, the application commands are:

```sh
npm run typecheck
npm run dev -- --host 127.0.0.1 --port 3000
```

Open http://localhost:3000. These commands do not obtain or generate the omitted assets.

## How it was made

See [the reconstruction process](docs/RECONSTRUCTION.md) for resource decoding, executable investigation, native implementation and comparisons with original execution. See [third-party acknowledgements](THIRD_PARTY_NOTICES.md) for the distinction between game-driver reconstruction and sound synthesis libraries.

## Source map

- `app/`: browser interface and game orchestration, including development screens.
- `lib/game/`: native game state, resource decoding, rendering, input, replay and audio.
- `lib/physics/`: driving and collision calculations.
- `tools/`: basic resource extraction and local asset verification.
- `docs/`: setup requirements, process and asset inventories.

Original-data regression fixtures and private development history are not included. The small public test suite verifies the included asset checker, not whole-game equivalence.

## Reporting issues

Include the display mode, graphics-upgrade setting, sound device, browser, car, track/replay and steps to reproduce. Screenshots and replay timestamps help. Do not attach ROMs, original game archives or credentials.

## Rights

Stunts and its original artwork/data belong to their respective rights holders. This is an unofficial reconstruction. Third-party packages retain their own licenses. No blanket open-source license is assigned to this source snapshot; public availability alone is not a license grant. A licensing review is still needed before describing the entire project as open source.
