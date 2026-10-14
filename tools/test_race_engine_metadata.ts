import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {assertRaceEngineIdentity,raceEngineStatements,readRaceEngine} from '../lib/server/race-engine-metadata.ts';
test('additive engine sidecar leaves every pre-existing score and replay row unchanged',async()=>{
 const db=new DatabaseSync(':memory:');
 const migrations=readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort();
 for(const file of migrations.filter(f=>!f.startsWith('0011_')))db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 db.exec("INSERT INTO global_scores VALUES ('old','rules','track','PMIN',100,'[1,2]',1,'name:old','full_route'); INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES ('old','[3,4]','DEFAULT',1); INSERT INTO accepted_scores VALUES ('old','rules',1)");
 const tables=['global_scores','shared_replays','accepted_scores'];
 const snapshot=()=>tables.map(table=>db.prepare('SELECT * FROM '+table).all());
 const before=snapshot();
 db.exec(readFileSync(new URL('../drizzle/0011_overconfident_cassandra_nova.sql',import.meta.url),'utf8'));
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return db.prepare(sql).get(...args as never[])??null;},run(){return db.prepare(sql).run(...args as never[]);}};}} as unknown as D1Database;
 assert.equal(await readRaceEngine(binding,'old'),'ms-1990');
 assert.equal(raceEngineStatements(binding,'old','ms-1990').length,0);
 for(const statement of raceEngineStatements(binding,'new','bb-1991'))await statement.run();
 assert.equal(await readRaceEngine(binding,'new'),'bb-1991');
 for(const statement of raceEngineStatements(binding,'future-ms91','ms-1991'))await statement.run();
 assert.equal(await readRaceEngine(binding,'future-ms91'),'ms-1991');
 // Repeated acceptance cannot rewrite a recorded sidecar, even if a caller
 // supplies a different edition for that ID. Hash separation is tested apart.
 for(const statement of raceEngineStatements(binding,'future-ms91','bb-1991'))await statement.run();
 assert.equal(await readRaceEngine(binding,'future-ms91'),'ms-1991');
 assert.equal(raceEngineStatements(binding,'future-ms91','ms-1990').length,0);
 assert.equal(await readRaceEngine(binding,'future-ms91'),'ms-1991');
 assert.equal(await readRaceEngine(binding,'missing'),'ms-1990');
 assert.throws(()=>raceEngineStatements(binding,'invalid','unknown' as never),/Unsupported physics/);
 db.prepare('INSERT INTO race_engines VALUES (?,?)').run('invalid-retained','unknown');
 await assert.rejects(()=>readRaceEngine(binding,'invalid-retained'),/Unsupported physics/);
 assert.equal(db.prepare('SELECT physics_engine FROM race_engines WHERE id=?').get('invalid-retained')!.physics_engine,'unknown','Invalid retained metadata fails without repairing or relabeling');
 assert.deepEqual(snapshot(),before);
 db.close();
});

test('acceptance preflight preserves retained identity and never infers missing modern tags',async()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE race_engines(id TEXT PRIMARY KEY,physics_engine TEXT);');
 const retainedTables=['global_scores','accepted_scores','run_history','shared_replays'];
 for(const table of retainedTables)db.exec('CREATE TABLE '+table+'(id TEXT PRIMARY KEY)');
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return db.prepare(sql).get(...args as never[])??null;}};}} as unknown as D1Database;
 const changes=()=>db.prepare('SELECT total_changes() AS n').get()!.n;
 await assertRaceEngineIdentity(binding,'new-legacy','ms-1990');
 await assertRaceEngineIdentity(binding,'new-modern','ms-1991');
 for(const table of retainedTables){
  db.prepare('INSERT INTO '+table+' VALUES (?)').run(table);
  const before=changes();
  await assertRaceEngineIdentity(binding,table,'ms-1990');
  for(const engine of ['ms-1991','bb-1991'] as const)await assert.rejects(()=>assertRaceEngineIdentity(binding,table,engine),/missing/);
  assert.equal(changes(),before,'All retained-table checks must be read-only');
 }
 for(const expected of ['ms-1990','bb-1991','ms-1991'] as const){
  db.prepare('INSERT INTO race_engines VALUES (?,?)').run(expected,expected);
  const before=changes();
  for(const actual of ['ms-1990','bb-1991','ms-1991'] as const){
   if(expected===actual)await assertRaceEngineIdentity(binding,expected,actual);
   else await assert.rejects(()=>assertRaceEngineIdentity(binding,expected,actual),/conflicts/);
  }
  assert.equal(changes(),before);
 }
 db.prepare('INSERT INTO race_engines VALUES (?,?)').run('unknown','unsupported');
 await assert.rejects(()=>assertRaceEngineIdentity(binding,'unknown','ms-1990'),/Unsupported physics/);
 const failure=new Error('Read unavailable');
 await assert.rejects(()=>assertRaceEngineIdentity({prepare(){throw failure;}} as never,'new','ms-1991'),error=>error===failure);
 db.close();
});
