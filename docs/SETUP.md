# Local setup and externally supplied files

This is a public source snapshot. Asset preparation is not yet self-contained; do not describe this checkout as ready to run.

## What you supply

- Your own complete Stunts game installation matching the supported December 1990 executable/resource revision. A track file alone is not sufficient. Alternate releases need compatibility verification.
- The original graphics, car, track, opponent and sound resources. `original-file-checksums.json` lists the original resource filenames and SHA-256 checksums used by this implementation. It is an identification manifest, not a download of those files, and is not yet the complete executable/input manifest.
- For Roland MT-32 sound: a compatible control ROM and PCM ROM obtained separately. The current implementation expects `public/game/mt32-local/ctrl_mt32_1_07.rom` and `public/game/mt32-local/pcm_mt32.rom`. Renaming an incompatible ROM does not make it compatible. Other sound options do not require these Roland ROMs.
- Node.js satisfying the version in package.json and npm. Extraction tools may additionally require Python and their documented dependencies.

Original game files, ROMs, extracted artwork and captured memory are not distributed in this repository. Keep locally prepared data out of commits.

## Intended preparation sequence

1. Obtain the source and install the locked dependencies with `npm ci`.
2. Validate the supplied game files against the supported revision.
3. Decode compressed resource containers and generate the runtime resource catalogs, images, car data and track data locally.
4. Generate initialized display data and the runtime startup data locally. This step currently depends on development captures and is a release blocker; copying the DOS directory is not sufficient.
5. Optionally install your compatible MT-32 ROM pair, or select another sound device.
6. Once the preparation pipeline is complete, run `npm run dev -- --host 127.0.0.1 --port 3000` and open http://localhost:3000.

The exported configuration no longer imports private hosting settings. Step 6 still requires the full prepared runtime data. These instructions intentionally distinguish the intended workflow from completed functionality.

## Saves and controls

Tracks and replays are stored in the browser for the current origin. Changing the hostname, port or browser does not transfer saves. Export a backup before changing origin. Original track imports use `.TRK` files; a supported track is 1,802 bytes.

Choose the original display and sound device in Setup. Optional upgraded graphics uses full colour; switching back restores the selected display mode. For a source installation without Roland ROMs, choose another sound option.

## Troubleshooting

Missing `/game/` files indicate incomplete asset preparation. Wrong resource checksums may indicate a different release; do not ignore them. A missing Roland ROM affects that sound option, and should not be solved by committing ROMs to GitHub. A successful TypeScript build alone does not prove the game assets or audio are usable.
