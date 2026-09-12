# Play Stunts

A native browser reconstruction of **Stunts / 4D Sports Driving**, developed by Sven with assistance from OpenAI Codex. [Play the hosted version](https://playstunts.com).

You can build and run the game from this checkout using your own compatible DOS game files. The preparation tool generates the required images, catalogs, sound states and fresh native startup resources locally. **No original game files, Roland ROMs or captured original sessions are distributed here.**

## What you need

- **Node.js 24 or newer**, with npm.
- **Python 3.11 or newer** and the packages in `tools/requirements.txt` (Pillow and Unicorn).
- Your own **complete extracted Stunts installation matching the December 1990 revision** used by this project. A ZIP, a single executable or a `.TRK` file is insufficient. Keep all installation files together. [Resource checksums](docs/original-file-checksums.json) and [direct-input checksums](docs/direct-asset-recipes.json) identify the supported files; other revisions are not automatically compatible.
- For **Roland MT-32 sound**, your own compatible control and PCM ROMs, described below. Without them, select another sound device in Setup before starting the game.
- A desktop browser with WebAssembly, Web Audio and WebGL support, and a keyboard. The preparation procedure was verified on macOS; Windows users can use WSL with the same shell commands.

## Install and run

```sh
git clone https://github.com/ACatWithEbola/playstunts.git
cd playstunts
npm ci
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r tools/requirements.txt
python tools/prepare_assets.py --original "/path/to/your/Stunts" --output public
python tools/check_assets.py
node tools/smoke_runtime.ts
npm run dev -- --host 127.0.0.1 --port 3000
```

Replace the quoted path with the directory containing your DOS files. Open **http://localhost:3000**. Click **Open Setup**, choose a sound device you have installed, and select **Exit** to save. Then click **PLAY STUNTS**. Saving changed settings restarts the main game automatically. Audio starts after a user click, as required by browsers.

The tool reads your originals without modifying them. It refuses to overwrite an existing output directory. To regenerate, move your existing `public` directory aside first, or choose a new output directory, check it, and then move it to `public`. Do not merge partial outputs into a working installation. `preparation-report.json` records completion and installed options; `asset-inventory.json` records the generated file hashes.

No game files or ROMs are downloaded by preparation. `npm ci` and pip download software dependencies. You do **not** need private development captures, an asset download from playstunts.com, a ChatGPT account, or a Sites account to run locally.

### Roland MT-32

The default sound choice is MT-32. For that option, put these two files in a separate directory and include `--roms` when preparing:

```sh
python tools/prepare_assets.py --original "/path/to/your/Stunts" --roms "/path/to/your/MT32-ROMs" --output public
```

| Filename | SHA-256 |
| --- | --- |
| `ctrl_mt32_1_07.rom` | `a73a06c23ed38370e58a11fb1b86f7ea4c547061a60d7aa62bae446235fd2dff` |
| `pcm_mt32.rom` | `d9164063f293410cf33f2f64cdcea6893b44723fe41938e07ec9aef58b406238` |

Supply these legally yourself. Renaming a different ROM does not make it compatible. The Munt synthesizer and its corresponding source are included; the ROMs are not. PC speaker, AdLib/Sound Blaster and Tandy sound do not require Roland ROMs.

The controls below the MT-32 provide power, reverb on/off, reverb amount, left/right channel swap, and master tuning. Reverb amount adjusts the synthesizer’s reverb output level. Tuning is shown in Hz. The controls scale together on smaller screens and remain on one row. Power cycling restores the device defaults; these adjustments are not saved across reloads.

### Optional website artwork

The game works without the hosted site's manual scans and cropped red-car artwork. The checkout uses a text wordmark and the original game's decoded title screen as fallbacks; the decorative car and idle Setup preview are omitted. These are website presentation differences, not missing game assets.

To reproduce the additional manual artwork, supply your own permitted images in a directory with these names and add `--site-art "/path/to/art"` to preparation:

- `manual-cover-spread.png`: image used by the masthead wordmark.
- `manual-red-car.png`: decorative red-car crop.
- `manual-front-cover.jpg`: manual cover beside the game.
- `setup-menu.png`: idle Setup preview.

See `app/StuntsBrand.tsx` and the `.stunts-` rules in `app/globals.css` for the crop/layout. The generated favicon is a simple S fallback. Optional scans and ROMs remain local and ignored by Git.

## Checks and production build

```sh
python -m unittest discover -s tools -p "test_*.py"
python tools/check_assets.py
node tools/smoke_runtime.ts
npm run typecheck
npm run build
npm run start
```

`npm run start` serves the production build through Wrangler; use the address it prints. Build output is in `dist/`. A hosted installation needs the generated assets as well as the compiled application. The repository's build configuration targets Cloudflare Workers through Vinext; no private hosting credentials are included. Deploying original assets publicly is a separate distribution decision—this repository does not grant rights to them.

The file checker verifies the required runtime files and your installation's hashes. The smoke check initializes a fresh Countach race and renders 30 frames. Browser checks covered Setup, the opening/menu and a normal race using generated assets. These checks establish an installable game, not perfect equivalence in every race. `--reference` on the file checker optionally compares the older full reference inventory, which includes unused research fixtures and will report expected differences.

## Playing and saves

- Arrow keys: accelerate/brake and steer.
- **A / Z**: shift up/down with manual gears; Space / Enter also work.
- Escape: game menu. C or F1–F4: camera views. T: view the opponent’s car. D: show or hide the dashboard.
- In replays, Ctrl + arrow keys adjusts the camera, + / − zooms, arrow keys select a replay control, and Enter or Space activates it. Shift + F1 opens the terrain editor.
- Setup selects MCGA, EGA, CGA, Tandy or Hercules. Optional upgraded graphics uses full colour and now retains source signs, clouds, vehicle details and live steering/suspension wheel movement; switching back restores the selected original mode.
- Import original **`.TRK`** files using **Tracks, replays and save backups**. Supported track files are 1,802 bytes.
- Import original **`.RPL`** recordings with **Upload replay (.RPL)** beside the track upload. Upload before starting the game, then load the file from the in-game replay menu. Names must use 1–8 letters, numbers, underscores or hyphens. Existing files are kept. Recordings must use the supported original format and contain 1–12,000 frames.
- Saves are browser-local and tied to the hostname/port. Export a backup before changing browser or address. A Git checkout does not contain your hosted-game saves.

## How it works

The main game runs reconstructed TypeScript, not the DOS executable. Preparation decodes the original resources, unpacks the original display binaries to recover initialized tables, and runs bounded sound-initialization routines locally. Startup memory is built by the native initialization code, without importing a captured game session.

[Reconstruction process](docs/RECONSTRUCTION.md) · [Setup and troubleshooting](docs/SETUP.md) · [Third-party notices](THIRD_PARTY_NOTICES.md)

- `app/`: website and browser orchestration.
- `lib/game/`, `lib/physics/`: reconstructed systems and rendering.
- `tools/`: complete local preparation and installation checks.
- `vendor/`: redistributable synthesizer runtimes, corresponding source and font licenses.
- `docs/`: input identification, setup and process documentation.

The older `NativeDrive` prototype and private original-data regression fixtures are not required by the current game. Historical source remains for reference; its captured prototype seeds are deliberately not distributed. `/work/reference` provides the original DOS comparison using a bundle generated from your own installation.

## Issues and rights

This is an unofficial reconstruction and may contain visual, audio or simulation discrepancies. Report the browser, car, track/replay, sound/display settings and reproduction steps. Do not attach ROMs, game archives or credentials.

## License

Unless a file carries a separate third-party notice, the original source code contributed to this project is licensed under the **GNU General Public License, version 3 only (GPL-3.0-only)**. See [LICENSE](LICENSE).

Third-party code, synthesizers and fonts retain their existing licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the notices in `vendor/`. This license grant does **not** cover the original Stunts executables, artwork, game data, Roland ROMs, or data extracted from those files. Those materials remain subject to their respective rights holders’ terms and are not included in this repository.

### Social sharing image

The live site uses a branded 1731 × 909 PNG sharing card (approximately 1.91:1). Original-art-derived promotional imagery is not redistributed in this source repository. To supply your own card, place it at `public/og.png` before building and update its dimensions, image URL and site URL in `app/layout.tsx` for your deployment. By default the metadata references the publicly hosted playstunts.com card; remove the image metadata if your deployment will not use a sharing image. The live card was generated using the original cover as a reference, with the yellow Stunts wordmark, red car, “PLAY IN YOUR BROWSER” and “playstunts.com” on black.

Saved tracks and replays can also be exported individually: open **Tracks, replays and save backups → Download tracks & replays**, then choose a file. Downloads preserve the saved binary bytes and DOS filename (.TRK or .RPL); copy them to your original game directory. The list includes the bundled tracks and replays as well as files saved or imported in this browser. Saved files override bundled files with the same DOS path and name. Save an unsaved track or run in the game first.
