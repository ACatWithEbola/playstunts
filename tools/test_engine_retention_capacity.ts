/** Capacity-pressure preservation audit. Uses only an isolated SQLite database. */
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {engineScopedRetention} from '../lib/server/engine-scoped-retention.ts';

for(const selected of ['ms-1990','ms-1991','bb-1991'] as const){
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const score=db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)');
 const history=db.prepare('INSERT INTO run_history VALUES (?,?,?,?,?,?,?,?,?)');
 const replay=db.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)');
 const metadata=db.prepare('INSERT INTO race_engines VALUES (?,?)');
 for(const engine of ['ms-1990','ms-1991','bb-1991','unknown-retained']){
  for(const category of ['full_route','shortcuts_detected','not_assessed']){
   for(let i=0;i<110;i++){
    const id=`${engine}-${category}-${i}`;
    score.run(id,'rules','track','COUN',100+i,'[17,23,0]',i,'name:driver'+i,category);
    replay.run(id,JSON.stringify([i,0,255,19]),'QA_TRACK',i);
    if(engine!=='ms-1990')metadata.run(id,engine);
   }
  }
  for(let i=0;i<7;i++){
   const id=`${engine}-history-${i}`;
   history.run(id,'rules','track','COUN',100+i,'[31,0,7]',i,'name:shared','full_route');
   replay.run(id,JSON.stringify([i,255,0,17]),'QA_TRACK',i);
   if(engine!=='ms-1990')metadata.run(id,engine);
  }
 }
 const engineOf=(table:string)=>`COALESCE((SELECT physics_engine FROM race_engines e WHERE e.id=${table}.id),'ms-1990')`;
 const tables=['global_scores','run_history','shared_replays'];
 const protectedRows=()=>tables.map(table=>db.prepare(`SELECT * FROM ${table} WHERE ${engineOf(table)}<>? ORDER BY id`).all(selected));
 const before=protectedRows(),identities=db.prepare('SELECT * FROM race_engines ORDER BY id').all();
 const retention=engineScopedRetention(selected);
 db.prepare(retention.car).run('rules','track','rules','track');
 db.prepare(retention.history).run('rules','track','rules','track');
 db.exec(retention.shared);
 assert.deepEqual(protectedRows(),before,'Capacity cleanup must preserve every other-engine and unknown-identity field/byte');
 assert.deepEqual(db.prepare('SELECT * FROM race_engines ORDER BY id').all(),identities);
 const categories=db.prepare(`SELECT route_assessment,COUNT(*) AS n FROM global_scores WHERE ${engineOf('global_scores')}=? GROUP BY route_assessment`).all(selected);
 assert.equal(categories.length,3);assert.ok(categories.every(row=>row.n===100),'All three selected-engine categories retain their independent cap');
 assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM run_history WHERE ${engineOf('run_history')}=?`).get(selected)!.n,5);
 assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM shared_replays WHERE ${engineOf('shared_replays')}=?`).get(selected)!.n,305);
 db.close();
 console.log(`${selected}: three category caps, history cap and replay cleanup preserve all other/unknown engines byte-for-byte`);
}
