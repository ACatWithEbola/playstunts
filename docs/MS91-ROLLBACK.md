# Safe MS1991 rollback

Status: procedure documented; production backup/restore and live rollback verification remain release gates. No rollback or deployment has been performed.

The project export/restore gates are a project-level preservation precaution,
not a documented OpenAI publishing requirement or evidence that OpenAI has no
internal backups. Available Sites tools and the user-visible database panel
have not exposed a full export/recovery operation. A provider-confirmed
database recovery procedure may be assessed as an alternative, but retention,
coverage, restore access and preservation of newer records must first be
established. No such alternative is currently verified or accepted, and the
existing export/checksum/isolated-restore gates remain open, not waived.

Public replay downloads are not a lossless production database backup. The
GET route substitutes a hash-derived track filename in bytes13–21, including
with `format=canonical`, and only exposes recordings eligible under its score
query. Versioned exports additionally encode recording identity/cadence.
`tools/test_versioned_replay_download.ts` verifies this substitution without
changing stored bytes, while preserving the remaining canonical bytes. A full
backup must separately preserve every historical table, raw replay value and
metadata; downloading public recordings cannot close checks76–78.

For independently obtained offline SQLite snapshots, run
`node tools/compare_database_restore.mjs SOURCE.sqlite RESTORED.sqlite`.
The read-only comparator checks integrity, all schema objects, column metadata,
duplicate rows, exact blobs, 64-bit integer values, floating-point bit patterns
and internal sequence tables. It rejects snapshots with WAL/SHM sidecars and
comparing a file against itself. Reports contain hashes/counts, not row contents.
Equality of two supplied files does not prove that the source export contains
every production record; that completeness inventory remains a separate gate.

## Principle

After any MS1991 recordings have been created, retain the compatibility build containing both engines. Roll back **future races**, not historical data: select `LEGACY_PHYSICS` in `lib/game/future-race-engine.ts`. Existing recordings must continue to resolve their own engine metadata; missing historical metadata retains the legacy fallback. Never rewrite replay bytes, times, engine labels or scores to fit the selected default.

The current default is already legacy. Do not change it merely to rehearse this procedure. Loopback `preview-engine` overrides are local tests, not a production rollback switch.

Verify the release default using a fresh launch URL with neither `play-engine`
nor `preview-engine`. An explicit `play-engine` choice takes precedence over
the default and the loopback preview; a retained MS1991 choice is therefore not
evidence that rollback failed. Remove only these launch query parameters for
the check, not browser-local saves or recorded engine metadata. Both editions
must remain available for existing recordings after a default rollback.

Public high scores/shared races retain the approved20Hz policy. MS1991 slow10Hz
recordings remain private and must still import, play and download with their
original cadence. Never reinterpret them as20Hz, merge their private score
tables into20Hz tables, or submit them publicly to make a rollback test pass.

## Before release

1. Create a source checkpoint with `tools/backup_compatibility_source.mjs` in a new absolute directory outside the checkout. Verify it with `tools/verify_compatibility_backup.mjs`, which restores into a fresh temporary directory and checks every manifest entry. Keep the archive, manifest, checksum and verification result together.
2. Preserve and verify the external asset backup separately. Source snapshots retain the `public` symlink, not the assets it points to.
3. Complete the production replay/score export, inventory/checksums and isolated restore tests before publication. The source-backup scripts explicitly do **not** include the production database or browser-local saves.
4. Export browser-local saves separately before clearing a browser, changing its address, or replacing its saved state.
5. Retain the verified release source and deployment/version identity. Preserve the existing `.openai/hosting.json` project and `DB` binding, audience, domain and storage configuration.

## If the new future-race engine needs rollback

1. Identify the failing release and capture read-only evidence. Do not delete the site, database, deployments, recordings or leaderboards.
2. Start from the latest compatibility source that retains both engines and all intervening fixes. Change only the future-race default to `LEGACY_PHYSICS`; keep modern playback, import/export and verification available.
3. Run future-race rollback/routing tests, both-engine replay and score regressions, final type/build checks and the release instrumentation guard. Confirm newly started races use legacy, while historical legacy and modern recordings retain their bytes, engine, cadence and results.
4. Publish through the supported Sites workflow while preserving existing identity and storage bindings. Do not use an older source-only archive as a drop-in deployed release if it lacks modern replay support or newer schema compatibility.
5. Verify the deployed version, fresh race, representative legacy and modern replay playback/downloads, and historical leaderboard reads. Compare replay bytes and score metadata against the pre-change inventory. Continue to retain the previous compatible deployment for recovery.

## Data recovery is a separate operation

Never downgrade or replace the production database as part of a future-engine rollback. If data recovery is actually required, stop and establish the exact affected records, a verified backup, and how newer records will be preserved before requesting authorization. A blanket restore may discard races submitted since the backup.

Acceptance and manual reassessment now reject a conflict between a verified
recording and its retained engine tag. They also reject a claimed modern proof
whose already retained record has lost its tag; they do not repair that tag from
caller input. Untagged historical legacy records remain legacy. If these checks
report unavailable storage, investigate the authoritative backup/metadata rather
than changing replay headers or forcing the record into another engine.

## Evidence and limitations

Recent intermediate source checkpoints are documented in
`MS91-CURRENT-RELEASE-STATUS.md`. These are intermediate checkpoints, and later
code or documentation may be newer than the latest listed archive; verify the
exact release source rather than treating an earlier archive as final.
They are not the final prepublication checkpoint and do not include live data.
Successful isolated source restoration must not close the production export or
historical-data rollback checks. Refresh the checkpoint after final source and
documentation changes rather than relying on an earlier passing archive.

`tools/test_future_race_rollback.ts` verifies the default-selector and recording-identity contract with isolated fixtures. Its private-store regression repeatedly reopens legacy, modern20Hz, private10Hz and score files under alternating future-engine choices; it checks bytes, recorded engine/cadence and absence of persistence writes. It does not prove a live deployment, production backup completeness, historical database preservation or full end-to-end rollback. Those are separate detailed checks 76–80 and 94–103. Documentation and a green unit test do not authorize bypassing them.
