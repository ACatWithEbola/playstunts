import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {engineScopedRanking} from '../lib/server/engine-scoped-ranking.ts';
import {rankedScoresSQL,bestCarScoresSQL,categoryScoresSQL,categoryCarScoresSQL,combinedCarScoresSQL,currentCarScoresSQL} from '../lib/server/leaderboard-ranking.ts';
test('engine filtering precedes name ranking and leaves stored scores unchanged',()=>{
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const insert=db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)');
 for(const [id,ticks] of [['legacy',100],['mindscape',90],['broderbund',80]] as const)insert.run(id,'rules','track','PMIN',ticks,'[77,0]',1,'name:marco','full_route');
 db.prepare('INSERT INTO race_engines VALUES (?,?)').run('mindscape','ms-1991');
 db.prepare('INSERT INTO race_engines VALUES (?,?)').run('broderbund','bb-1991');
 const snapshot=db.prepare('SELECT * FROM global_scores ORDER BY id').all();
 for(const sql of [rankedScoresSQL,bestCarScoresSQL,categoryScoresSQL,categoryCarScoresSQL,combinedCarScoresSQL,currentCarScoresSQL]){
  for(const [engine,id] of [['ms-1990','legacy'],['ms-1991','mindscape'],['bb-1991','broderbund']] as const){
   const rows=db.prepare(engineScopedRanking(sql,engine)).all();
   assert.equal(rows.length,1);assert.equal(rows[0].id,id);assert.equal(rows[0].driver_rank,1);
  }
 }
 assert.deepEqual(db.prepare('SELECT * FROM global_scores ORDER BY id').all(),snapshot);
 assert.throws(()=>engineScopedRanking(rankedScoresSQL,'latest' as never));
 db.close();
});
test('valid, exploit and unassessed category bests remain independent inside each engine',()=>{
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const categories=['full_route','shortcuts_detected','not_assessed'];
 const engines=['ms-1990','ms-1991','bb-1991'] as const;
 const insert=db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)');
 for(const [engineIndex,engine] of engines.entries())for(const [categoryIndex,category] of categories.entries())for(const [suffix,extra] of [['best',0],['slower',20]] as const){
  const id=engine+'-'+category+'-'+suffix;
  insert.run(id,'rules','track','PMIN',100+extra-categoryIndex*10-engineIndex*30,'[77,0]',1,'name:marco',category);
  if(engine!=='ms-1990')db.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,engine);
 }
 const before=db.prepare('SELECT * FROM global_scores ORDER BY id').all();
 const metadata=db.prepare('SELECT * FROM race_engines ORDER BY id').all();
 for(const engine of engines)for(const sql of [categoryScoresSQL,categoryCarScoresSQL,currentCarScoresSQL]){
  const rows=db.prepare('SELECT id,route_assessment FROM ('+engineScopedRanking(sql,engine)+') WHERE driver_rank=1 ORDER BY route_assessment').all();
  assert.deepEqual(rows.map(row=>row.id),categories.map(category=>engine+'-'+category+'-best').sort());
  assert.deepEqual(rows.map(row=>row.route_assessment),categories.slice().sort());
 }
 assert.deepEqual(db.prepare('SELECT * FROM global_scores ORDER BY id').all(),before);
 assert.deepEqual(db.prepare('SELECT * FROM race_engines ORDER BY id').all(),metadata);
 db.close();
});
