# Setup details and troubleshooting

Follow the [README installation commands](../README.md) in order. The complete preparation command generates the main game's dependencies from a compatible original installation; it does not need private captures.

## Inputs and generated output

Keep the full extracted DOS installation together, including graphics resource containers, CAR resources, tracks, opponents, music/voice banks, `EGA.CMN`, all MCGA/EGA/CGA/TDY `.COD`/`.HDR`/`.DIF` files that exist for those modes, sound drivers and `SETUP.EXE`. Use the supported December 1990 revision. Filename matching is case-insensitive; duplicate case-insensitive filenames are rejected. Reference-only custom high scores may be absent; `missingOptionalReferenceInputs` records those omissions.

Preparation verifies direct-copy checksums, decodes original resources, reconstructs the display executables, extracts initialized tables and music state, and constructs fresh native startup memory. It copies the redistributable runtime dependencies from `vendor`, creates the Setup media catalog and a DOS reference bundle from supplied files, then checks the required output inventory. Only after all stages succeed does it install the output directory.

`public/`, `local-assets/`, `.venv/` and ROMs are ignored by Git. Never force-add them. Generated output contains original-derived data and is not a source-only package. `docs/runtime-file-checksums.json` is a historical reference inventory, not a list of extra files you must find.

## Common problems

- **Output already exists:** choose a new directory, or move the old one aside. The generator intentionally preserves existing output.
- **Unsupported checksum:** the file differs from the supported original revision. Restore the correct file; do not disable validation.
- **Missing module/Pillow/Unicorn:** activate `.venv` and install `tools/requirements.txt`. If your operating system has no compatible Unicorn wheel, use a supported Python version or WSL/Linux environment.
- **Unsupported TypeScript execution:** use Node 24 or newer. Startup generation and the smoke check use Node's native TypeScript support.
- **Missing `/game/` file:** run preparation to completion and `python tools/check_assets.py`; serve the resulting directory as `public`.
- **Roland fails to start:** supply the exact ROM pair in the README, or choose another sound option in Setup before Play. ROMs are not part of the original Stunts installation.
- **No audio:** click Play, check browser audio permission and selected sound device. Browsers block autoplay audio.
- **Different website masthead/manual artwork:** optional scans are intentionally omitted. The game uses locally decoded artwork; see `--site-art` in the README for optional website images.
- **Saves missing after changing address:** browser saves belong to their origin. Export/import the backup; changing a port creates a different origin.

The three regenerated startup binaries are fresh initialized resources, not byte copies of historical execution captures. Uninitialized old memory is not reproduced. In particular, the old MT-32 title seed included a null-instrument read into captured low memory; the generator uses zero-initialized low memory instead. This changes a small number of setup/control writes, not the supplied score data. Perfect equivalence to undefined captured memory is not claimed.

## Validation scope

The installation check requires runtime files and verifies their generated hashes. The native smoke check initializes and renders a short race. Browser checks verify the connected startup, Setup and race path. Original-data development fixtures remain excluded, so the public test suite does not reproduce every historical reverse-engineering comparison.
