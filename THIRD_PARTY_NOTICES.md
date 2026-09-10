# Third-party acknowledgements

- **Distinctive Software / original Stunts publishers and contributors:** original game, artwork, resources and design. Those files are not included here.
- **4d-stunts/restunts:** public resource-format and reverse-engineering reference used to check the importer. This export does not include that repository or its original data. https://github.com/4d-stunts/restunts
- **Munt:** MT-32 synthesis integration is separate from the reconstructed game driver. Munt is not an independently recreated MT-32 implementation by this project. Its runtime, corresponding source archive and GPL/LGPL notices are included under `vendor/runtime/game/mt32-local`. Roland ROMs are not included. https://github.com/munt/munt
- **@malvineous/opl / DOSBox contributors:** OPL sound synthesis, identified by the existing project notice as GPL-3.0. Obtain through the locked dependency; comply with its license when distributing a build. https://github.com/Malvineous/opljs
- **React, Three.js, Vinext, Cloudflare tooling and other npm dependencies:** versions are recorded in package-lock.json; each retains its upstream license.

This acknowledgement is not a replacement for the licenses and source obligations of components included in a future binary distribution. Bundled runtime binaries are accompanied by their corresponding source archives and notices under `vendor`; npm dependencies retain their own upstream source and licenses.

- **Archivo / Archivo Narrow:** bundled website fonts, with their SIL Open Font License in `vendor/runtime/site/fonts`.
- **DOSBox / js-dos emulators:** the Setup hardware text font carries the adjacent provenance and GPL notice. The optional DOS reference runtime is installed from the locked `emulators` npm dependency.
