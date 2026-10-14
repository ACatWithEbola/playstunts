import assert from 'node:assert/strict';
import {DatabaseSync,backup} from 'node:sqlite';
import {readFileSync,readdirSync,mkdtempSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';

// One-time repair of the observed local preview schema, never a remote migration.
const root=realpathSync(new URL('..',import.meta.url));
const target=realpathSync(resolve(root,process.argv[2]??''));
assert.ok(target.startsWith(root+'/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'));
assert.match(target,/\/[a-f0-9]{64}\.sqlite$/);
const files=readdirSync(join(root,'drizzle')).filter(f=>/^\d+.*\.sql$/.test(f)).sort();
assert.equal(files.length,12,'review this repair before adding further migrations');
const expected=new DatabaseSync(':memory:');
for(const file of files.slice(0,7))expected.exec(readFileSync(join(root,'drizzle',file),'utf8'));
const db=new DatabaseSync(target);
const schema=(database:DatabaseSync)=>database.prepare("SELECT name,type,sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_cf_METADATA','d1_migrations') ORDER BY name").all();
assert.deepEqual(schema(db),schema(expected),'local schema must exactly match migrations 0000–0006');
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM d1_migrations').get()!.n,0);
const tables=expected.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>String(row.name));
const snapshots=tables.map(table=>({table,columns:db.prepare(`PRAGMA table_info(${table})`).all().map(row=>String(row.name)),rows:db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()}));
const backupPath=join(mkdtempSync(join(tmpdir(),'playstunts-local-db-backup-')),'before.sqlite');
await backup(db,backupPath);
db.exec('BEGIN IMMEDIATE');
try{
 for(const file of files.slice(7))db.exec(readFileSync(join(root,'drizzle',file),'utf8'));
 for(const snapshot of snapshots)assert.deepEqual(db.prepare(`SELECT ${snapshot.columns.join(',')} FROM ${snapshot.table} ORDER BY rowid`).all(),snapshot.rows,'existing local records must remain byte-identical');
 for(const file of files)db.prepare('INSERT INTO d1_migrations(name) VALUES (?)').run(file);
 db.exec('COMMIT');
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();expected.close();}
console.log(JSON.stringify({localOnly:true,backupPath,migrationsApplied:files.slice(7),existingRowsPreserved:snapshots.map(({table,rows})=>({table,count:rows.length}))},null,2));
