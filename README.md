# Play Stunts

A native browser reconstruction of **Stunts / 4D Sports Driving**, developed by Sven with assistance from OpenAI Codex. [Play the hosted version](https://playstunts.com).

## Live high scores and community tracks

### Website languages

The language selector after GitHub offers English (default), Spanish and Italian.
The choice is remembered in the browser and does not restart the game. Website
copy, controls and messages are translated; original in-game text, track/car/driver
names, filenames and recorded data are unchanged. The original linked manual and
developer workbench routes remain in their source language.

Every website-copy change must include both translations. Maintain the catalogues
in `lib/website-languages.ts` and `lib/website-*-translations.ts`; run
`npm run test:languages`. The production build also checks translation coverage.

The hosted game at **playstunts.com** has shared online high scores and a community track library. The features below describe the hosted online edition, not a local checkout of `main`.

- **Private game scores:** the original in-game seven-slot table is saved independently in the browser. Website rankings never replace it.
- **Submit any eligible completed race:** fresh completed races outside the local top seven offer a submission dialog over the game, including in fullscreen. Enter a name and explicitly consent to publishing the score and replay, or choose **Not now** to keep it private. Qualifying local times retain the original name-entry flow.
- **Top-ten leaderboards:** each track has separate **Valid** and **Exploit detected** views, with **Overall** and **By car** rankings. Overall keeps one place per named driver across cars. The header always shows the fastest **valid** track record, its driver and car, regardless of the selected category. Leaders have a subtle trophy glow and occasional time shimmer; reduced-motion preferences disable the animations.
- **Replay verification:** submitted runs are checked on the server by replaying recorded inputs with the original simulation. Valid means an accepted finish without an agreed section-transfer, branch-switching or confirmed grass-speed exploit. Ordinary grass duration and passing beside a tunnel do not impose extra racing rules. **Continue driving** from a replay makes a run ineligible; restarting begins a fresh attempt.
- **Assessment details:** short badge explanations describe detected evidence. Inconclusive runs remain **Unverified**, not proof of exploitation; they can appear in recent driver history without a separate Unverified leaderboard tab. Existing public recordings are reassessed once per verifier version. Private recordings are not automatically published or reassessed globally.
- **Recent races:** the homepage shows the latest **eight public submissions**, with driver, track, car, time and activity description. This feed is separate from each driver's **five most recent retained verified submissions per track**, available by hovering, focusing or tapping a driver name. Improvement and record claims require retained evidence.
- **Public replays:** explicit consent is required. Verification, score insertion and replay storage use one atomic batch. Replays remain public while ranked or among the driver's five most recent verified runs per track. Skipping submission uploads no recording; ordinary game saves remain private. Importing an arbitrary replay does not create a score.
- **Replay library:** filter by track and car, sort by fastest or newest, and load more beyond the first 50 results. Download the original `.RPL` or add it to the game before starting, then use **Options → Load Replay**.
- **Community tracks:** **Community tracks → Share track (.TRK)** publishes a validated track for everyone. Others can download it or add it to their game and select it through the original track menu. Personal imports do **not** publish a track.
- **Browser-local saves:** tracks, ordinary replays, settings and backups belong to the current browser and website address. Export a backup before clearing browser data or changing browser/address. Consented offline submissions retry when connectivity returns; existing local score files are not automatically uploaded.
- **Finding scores:** the High Scores directory supports search, sorting, twelve-track pages and refreshes hourly while visible, on return or on demand. Identical track contents share a board even when filenames differ. Driver names are not verified accounts; case and surrounding spaces are normalized, and common profanity is masked without changing verification data.
- **Display options:** English, Spanish and Italian website languages are remembered without restarting the game or translating original game data. Optional CRT display defaults off; the enhanced FPS display also defaults off and can be toggled with **Ctrl+F**. If enhanced graphics are unavailable, the game can fall back to original graphics without weakening browser security settings.
- **Supported uploads:** personal imports accept validated tracks, replays and supported backups. Community sharing accepts original validated `.TRK` tracks; malformed or unrelated files are rejected.

GitHub **`main` remains the stable local-score edition**. The deployed online edition is developed on [`feature/global-highscores`](https://github.com/ACatWithEbola/playstunts/tree/feature/global-highscores). Cloning the default branch does not connect your local game to the public leaderboard. The online branch uses a separate database for local testing; see its [online-edition documentation](https://github.com/ACatWithEbola/playstunts/blob/feature/global-highscores/docs/GLOBAL-HIGHSCORES.md) for storage, validation, and deployment details.

You can build and run the game from this checkout using your own compatible DOS game files. The preparation tool generates the required images, catalogs, sound states and fresh native startup resources locally. **No original game files, Roland ROMs or captured original sessions are distributed here.**

## What you need

The website’s optional **CRT display** adds static scanlines and a soft vignette to either graphics mode, with no additional 3D pass. It defaults off and remembers the browser preference.

- **Node.js 24 or newer**, with npm.
- **Python 3.11 or newer** and Pillow from `tools/requirements.txt`.
- Your own **complete extracted PC installation of Mindscape's 4D Sports Driving 1.1, finalized 13 December 1990** (identified as **MS 1990** in the [Stunts community version table](https://wiki.stunts.hu/wiki/Game_versions)). The `4D Sports Driving 1.1, Dec 13` archive linked by the community [download page](https://wiki.stunts.hu/wiki/Download) is a tested input. This is not Brøderbund Stunts 1.0, Brøderbund Stunts 1.1, or the February 1991 Mindscape release. A single executable or `.TRK` file is insufficient: extract the complete archive and keep its files together. [Direct-input checksums](docs/direct-asset-recipes.json) identify the accepted source files; the older [research inventory](docs/original-file-checksums.json) also lists private development fixtures and is not an extra download list.
- For **Roland MT-32 sound**, your own compatible control and PCM ROMs, described below. Without them, select another sound device in Setup before starting the game.
- A desktop browser with WebAssembly, Web Audio and WebGL support, and a keyboard. The preparation procedure has been verified on macOS.

## Install and run

Run these commands from a terminal on macOS or Linux:

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

On Windows PowerShell, use the same commands except for virtual-environment activation:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r tools/requirements.txt
python tools/prepare_assets.py --original "C:\path\to\your\Stunts" --output public
python tools/check_assets.py
node tools/smoke_runtime.ts
npm run dev -- --host 127.0.0.1 --port 3000
```

Replace the quoted path with the extracted directory that directly contains files such as `STUNTS.COM`, `GAME.PRE` and the `*.RES` resources—not the archive itself or a parent directory. Open **http://localhost:3000**. Click **Open Setup**, choose a sound device you have installed, and select **Exit** to save. Then click **PLAY STUNTS**. Saving changed settings restarts the main game automatically. Audio starts after a user click, as required by browsers.

The tool reads your originals without modifying them. It refuses to overwrite an existing output directory. To regenerate, move your existing `public` directory aside first, or choose a new output directory, check it, and then move it to `public`. Do not merge partial outputs into a working installation. `preparation-report.json` records completion and installed options; `asset-inventory.json` records the generated file hashes.

No game files or ROMs are downloaded by preparation. `npm ci` and pip download software dependencies. You do **not** need private development captures, an asset download from playstunts.com, a ChatGPT account, or a Sites account to run locally.

The recognized `DEFAULT.TRK`, `LOAD.EXE`, `ST.COM` and `STUNTS.COM` variants in the tested community distribution are accepted. `DEFAULT.TRK` differs only in mutable track metadata. The web reconstruction does not execute `LOAD.EXE`, `ST.COM` or `STUNTS.COM`, so it bypasses the original copy-protection path and works with the supported original files. `ST.COM` is optional: preparation and reconstructed gameplay were also tested with it completely absent. The optional `/work/reference` DOS comparison uses `ST.COM` when it was supplied; without it, the DOS comparison starts `STUNTS.COM` and retains the original manual check.

### Roland MT-32

MT-32 is the default original sound only when both supported ROMs are installed and validated. Otherwise the browser explains what is missing and uses Sound Blaster, while every other Setup sound choice remains unchanged. To enable MT-32, put these two files in a separate directory and include `--roms` when preparing:

```sh
python tools/prepare_assets.py --original "/path/to/your/Stunts" --roms "/path/to/your/MT32-ROMs" --output public
```

| Filename | SHA-256 |
| --- | --- |
| `ctrl_mt32_1_07.rom` | `a73a06c23ed38370e58a11fb1b86f7ea4c547061a60d7aa62bae446235fd2dff` |
| `pcm_mt32.rom` | `d9164063f293410cf33f2f64cdcea6893b44723fe41938e07ec9aef58b406238` |

Supply these legally yourself. Renaming a different ROM does not make it compatible. The Munt synthesizer and its corresponding source are included; the ROMs are not. PC speaker, AdLib/Sound Blaster and Tandy sound do not require Roland ROMs.

The controls below the MT-32 provide power, reverb on/off, reverb amount, left/right channel swap, and master tuning. Reverb amount adjusts the synthesizer’s reverb output level. Tuning is shown in Hz. Power cycling restores the device defaults; these adjustments are not saved across reloads.

### Optional website artwork

The game works without the hosted site's decorative artwork. The checkout uses a text wordmark and the original game's decoded title screen as fallbacks; the decorative red car, interactive box scans and idle Setup preview are omitted when their optional files are unavailable. These are website presentation differences, not missing game assets.

To reproduce the additional website artwork, supply your own permitted images in a directory with these names and add `--site-art "/path/to/art"` to preparation:

- `manual-cover-spread.png`: image used by the masthead wordmark.
- `manual-red-car.png`: decorative red-car crop.
- `setup-menu.png`: idle Setup preview.

The front-page 3D box can additionally use six permitted scans in a `stunts-box` subdirectory named `Stunts-front.jpg`, `Stunts-back.jpg`, `Stunts-left.jpg`, `Stunts-right.jpg`, `Stunts-top.jpg` and `Stunts-bottom.jpg`. Optional enhanced scenery belongs in an `enhanced-backgrounds` subdirectory. Optional reconstructed title and menu artwork belongs in an `enhanced-artwork` subdirectory with these names:

- `SDTITL-prod-mindscape-v1.png`: Mindscape intro card.
- `SDTITL-titl-title-v2.png`: 4-D Sports Driving title card.
- `SDMSEL-scrn-menu-v1.png`: main menu background.

These artwork subdirectories are copied by `--site-art` when present but remain excluded from Git because they contain artwork rather than reconstruction source. If the enhanced title or menu images are absent, the game uses its decoded original artwork.

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

The file checker verifies the required runtime files and your installation's hashes. The smoke check initializes a fresh Countach race, completes the starting-truck sequence and drives beyond the original protection interval. Browser checks cover Setup, the opening/menu and a normal race using generated assets. These checks establish an installable game, not perfect equivalence in every race. `--reference` on the file checker optionally compares the extended reference inventory, which includes unused research fixtures and therefore reports expected differences.

## Playing and saves

- Arrow keys: accelerate/brake and steer.
- **A / Z**: shift up/down with manual gears; Space / Enter also work.
- Escape: game menu. C or F1–F4: camera views. T: view the opponent’s car. D: show or hide the dashboard.
- In replays, Ctrl + arrow keys adjusts the camera, + / − zooms, arrow keys select a replay control, and Enter or Space activates it. Shift + F1 opens the terrain editor.
- Import original **`.TRK`** files using **Tracks, replays and save backups**. Supported track files are 1,802 bytes.
- Import original **`.RPL`** recordings with **Upload replay (.RPL)** beside the track upload. Upload before starting the game, then load the file from the in-game replay menu. Names must use 1–8 letters, numbers, underscores or hyphens. Existing files are kept. Recordings must use the supported original format and contain 1–12,000 frames.
- Export individual files through **Tracks, replays and save backups → Download tracks & replays**. Downloads preserve the binary bytes and DOS filename (`.TRK` or `.RPL`) for use with the original game. The list includes bundled files and files saved or imported in the browser; a browser-local file with the same DOS path and name takes precedence over its bundled counterpart.
- Personal tracks, replays, settings, and save backups are browser-local and tied to the hostname/port. Export a backup before changing browser or address. High scores on the hosted online edition are shared, and explicitly published community tracks are available to everyone. A Git checkout does not contain your hosted-game personal saves.

## Updated graphics and audio

The starter track collection is the original six: DEFAULT, BERNIES, CHERRIS, HELENS, JOES and SKIDS. The files were verified against a preserved 1990 disk. Custom bundled tracks/replays are no longer mounted; source archives and personal saved files are preserved. Community track sharing and the editor remain available. Completed-run submission verifies and shares the replay automatically. The replay library lists public recordings; previously retained private recordings remain stored locally, without a manual sharing/recheck section.

Route assessment follows original-game driving options: both divided-road lanes and inside passage through loops and left/right corkscrews can count as Valid. It does not impose extra competition-only stunt-rotation rules. Substantial road-to-road cuts and confirmed grass-speed exploits remain separately detected.

- Enhanced graphics is the launch default and uses a separate website renderer with full colour, source signs and clouds, detailed vehicles, and live steering and suspension movement. Setup still selects MCGA, EGA, CGA, Tandy or Hercules for original graphics. Only the website graphics control switches between enhanced graphics and the selected original display mode; in-game menus preserve that selection.
- With enhanced graphics enabled, **Ctrl+F** shows or hides the driving/replay performance display: current FPS, session average and 1% low. **V** cycles the current Stunts camera → close → standard → far → the current Stunts camera; C, F1–F4 or a replay camera-button selection returns immediately to the selected original camera. Both enhanced overlays are inactive outside driving and replay playback.
- Remixed opening/title, menu, victory and game-over music is enabled by default while the original engine and sound effects remain unchanged. The website control switches between remixed and original music, while the in-game Options menu turns music on or off.
- Alpine, Tropical, Desert, City and Country panoramas are presentation-only replacements selected from the same terrain metadata as the original backgrounds. Enhanced track previews use the same panoramas.
- Enhanced cars preserve their five source colours and original geometry while adding clear-coat lighting, palette-matched materials, inset lamp details and filtered grounding shadows.
- **3D CARS** opens the interactive showroom in the front page’s game area. It uses the same decoded models and enhanced materials as the game for all eleven cars; drag to rotate, scroll to zoom and select each car’s available colours.

## How it works

The main game runs reconstructed TypeScript, not the DOS executable. Preparation decodes the original resources, deterministically unpacks the EXEPACK display binaries, and builds the sound states through the reconstructed resource loader. Startup memory is built by the native initialization code, without importing a captured game session or executing 16-bit setup code.

[Reconstruction process](docs/RECONSTRUCTION.md) · [Setup and troubleshooting](docs/SETUP.md) · [Third-party notices](THIRD_PARTY_NOTICES.md)

- `app/`: website and browser orchestration.
- `lib/game/`, `lib/physics/`: reconstructed systems and rendering.
- `tools/`: complete local preparation and installation checks.
- `vendor/`: redistributable synthesizer runtimes, corresponding source and font licenses.
- `docs/`: input identification, setup and process documentation.

The `NativeDrive` prototype and private original-data regression fixtures are reference material, not runtime requirements. Captured prototype seeds are deliberately not distributed. `/work/reference` provides the original DOS comparison using a bundle generated from your own installation; it is separate from the reconstructed game.

## Issues and rights

This is an unofficial reconstruction and may contain visual, audio or simulation discrepancies. Report the browser, car, track/replay, sound/display settings and reproduction steps. Do not attach ROMs, game archives or credentials.

## License

Unless a file carries a separate third-party notice, the original source code contributed to this project is licensed under the **GNU General Public License, version 3 only (GPL-3.0-only)**. See [LICENSE](LICENSE).

Third-party code, synthesizers and fonts retain their existing licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the notices in `vendor/`. This license grant does **not** cover the original Stunts executables, artwork, game data, Roland ROMs, or data extracted from those files. Those materials remain subject to their respective rights holders’ terms and are not included in this repository.

### Social sharing image

The live site uses a branded 1731 × 909 PNG sharing card (approximately 1.91:1). Original-art-derived promotional imagery is not redistributed in this source repository. To supply your own card, place it at `public/og.png` before building and update its dimensions, image URL and site URL in `app/layout.tsx` for your deployment. By default the metadata references the publicly hosted playstunts.com card; remove the image metadata if your deployment will not use a sharing image. The live card was generated using the original cover as a reference, with the yellow Stunts wordmark, red car, “PLAY IN YOUR BROWSER” and “playstunts.com” on black.
