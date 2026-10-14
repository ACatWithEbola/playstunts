/** Restore the actual application schema with synthetic rows, never live data. */
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {compareSnapshots} from './compare_database_restore.mjs';
const directory=mkdtempSync(join(tmpdir(),'stunts-schema-restore-'));
const source=join(directory,'source.sqlite'),restored=join(directory,'restored.sqlite');
const journal=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries;
const db=new DatabaseSync(source);
const quote=name=>'"'+name.replaceAll('"','""')+'"';
for(const migration of journal)db.exec(readFileSync('drizzle/'+migration.tag+'.sql','utf8'));
const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row=>row.name);
assert.equal(tables.length,10,'Review schema changes before updating restore coverage');
assert.ok(tables.includes('race_engines')&&tables.includes('shared_replays'));
for(const table of tables){
 const columns=db.prepare('PRAGMA table_info('+quote(table)+')').all();
 const values=columns.map(column=>/INT|REAL|NUM/i.test(column.type)?7:/BLOB/i.test(column.type)?new Uint8Array([0,255,31]):'synthetic-'+table+'-'+column.name);
 db.prepare('INSERT INTO '+quote(table)+' ('+columns.map(column=>quote(column.name)).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')').run(...values);
}
db.close();
// SQLite produces a new compact snapshot; byte-level file identity is not
// required, but every schema object, column and logical stored value is.
const reader=new DatabaseSync(source,{readOnly:true});
reader.exec("VACUUM INTO '"+restored.replaceAll("'","''")+"'");reader.close();
const result=compareSnapshots(source,restored);
assert.equal(result.allStoredValuesMatch,true);
for(const table of tables)assert.equal(result.restored.tables[table].rowCount,1);
assert.equal(result.sourceCompletenessVerified,false);
const changed=new DatabaseSync(restored);
changed.exec("UPDATE shared_replays SET replay='changed synthetic raw recording'");changed.close();
assert.throws(()=>compareSnapshots(source,restored),/differ/);
console.log(JSON.stringify({historicalTables:9,engineSidecar:true,actualSchemaRestored:true,syntheticRowsOnly:true,changedReplayRejected:true,liveDatabaseAccessed:false,productionBackupVerified:false}));
