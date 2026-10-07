# Website languages

Public website copy is English, Spanish and Italian. English is the default.
For every new or changed website label, explanation, status, error or accessibility
label, update both Spanish and Italian translations in `lib/website-*-translations.ts`
or `lib/website-languages.ts`. Use `WebsiteText` for visible copy and `WebsiteElement`
for translated presentation attributes. Run `node tools/test_website_languages.ts`
and `npm run typecheck` before publishing. Do not silently fall back to English
for known website copy.

Never translate or modify original in-game menus, game assets, native input,
track names, car names, driver names, filenames, score values or replay data.
The website language setting must not restart an active game or mutate saves.
Developer work routes and original manuals are not localized website pages.
