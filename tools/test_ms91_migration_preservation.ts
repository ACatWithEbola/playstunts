/** Apply the real pending sidecar migration to an isolated historical schema. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const journal=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8')).entries;
assert.equal(journal.at(-1).tag,'0011_overconfident_cassandra_nova','Review newly added migrations before updating this gate');
const db=new DatabaseSync(':memory:');
for(const entry of journal.slice(0,-1))db.exec(readFileSync('drizzle/'+entry.tag+'.sql','utf8'));
const tables=(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name:string}[]).map(r=>r.name);
const quote=(name:string)=>'"'+name.replaceAll('"','""')+'"';
for(const table of tables){
 const columns=db.prepare('PRAGMA table_info('+quote(table)+')').all() as {name:string;type:string;notnull:number;dflt_value:unknown;pk:number}[];
 // Populate nullable/defaulted historical fields too: otherwise a migration
 // could damage replay payloads or assessment metadata without this detecting it.
 const values=columns.map(c=>/INT|REAL|NUM/i.test(c.type)?7:/BLOB/i.test(c.type)?Uint8Array.from([0,255,31]):'preserved-'+table+'-'+c.name);
 db.prepare('INSERT INTO '+quote(table)+' ('+columns.map(c=>quote(c.name)).join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')').run(...values);
}
const snapshot=()=>Object.fromEntries(tables.map(table=>[table,db.prepare('SELECT * FROM '+quote(table)).all()]));
const before=snapshot();
const schemaSnapshot=()=>db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND tbl_name != 'race_engines' ORDER BY type,name").all();
const schemaBefore=schemaSnapshot();
const migration=readFileSync('drizzle/'+journal.at(-1).tag+'.sql','utf8');
assert.ok(!/\b(?:DELETE|UPDATE|DROP|ALTER|REPLACE)\b/i.test(migration),'Engine sidecar migration must not rewrite historical tables');
db.exec(migration);assert.deepEqual(snapshot(),before);
assert.deepEqual(schemaSnapshot(),schemaBefore,'Sidecar migration must preserve historical tables, indexes, triggers and views');
assert.deepEqual(db.prepare('SELECT * FROM race_engines').all(),[]);
db.prepare('INSERT INTO race_engines(id,physics_engine) VALUES (?,?)').run('future-ms91','ms-1991');
assert.deepEqual(snapshot(),before,'New engine metadata must not change historical rows');
assert.deepEqual(schemaSnapshot(),schemaBefore);
db.close();
console.log(JSON.stringify({historicalTables:tables.length,pendingMigration:journal.at(-1).tag,historicalRowsUnchanged:true,historicalSchemaObjectsUnchanged:true,liveDatabaseAccessed:false,pass:true}));
