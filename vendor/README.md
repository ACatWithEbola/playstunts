# Third-party runtime dependencies

These are synthesizer libraries and a hardware text font, not original Stunts data or Roland ROMs.

- `runtime/game/mt32-local`: Munt synthesizer, browser bridge, complete corresponding source archive and GPL/LGPL notices. `synth-source.tar.gz` contains `mt32-browser/build.sh` for rebuilding the JavaScript/WebAssembly pair with Emscripten.
- `runtime/audio`: OPL synthesizer, corresponding source archive and notice.
- `runtime/game/reference-text-font.bin`: the DOSBox VGA 8×16 hardware text font used by Setup. Its extraction provenance and checksum are in the adjacent JSON; GPL terms are in `runtime/emulator/COPYING`.
- `runtime/licenses`: notices for adapted display code.

The asset preparation command installs these files locally. No proprietary ROM is included.

- `runtime/site/fonts`: Archivo website fonts and their SIL Open Font License.
