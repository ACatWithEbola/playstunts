import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {driverKey,rankedScoresSQL,pruneCarScoresSQL} from '../lib/server/leaderboard-ranking.ts';
import {publicLeaderboards,type PublicScoreRow} from '../lib/server/public-leaderboards.ts';
const record=(name:string)=>{const bytes=Array(52).fill(0);Array.from(name,c=>c.charCodeAt(0)).forEach((n,i)=>bytes[i]=n);return bytes;};
const row=(id:string,name:string,car:string,ticks:number):PublicScoreRow=>({id,track_hash:'track',car_code:car,ticks,record:JSON.stringify(record(name)),created_at:10,track_name:'DEFAULT',has_replay:0});
test('overall shows one place per name; car boards retain each car best independently',()=>{
 const board=publicLeaderboards([row('a','Marco','PMIN',100),row('b',' MARCO ','PMIN',110),row('c','marco','COUN',120),row('d','Sven','PMIN',130)],new Map())[0];
 assert.deepEqual(board.scores.map(s=>s.id),['a','d']);
 assert.deepEqual(board.cars.find(c=>c.code==='COUN')!.scores.map(s=>s.id),['c']);
 assert.deepEqual(board.cars.find(c=>c.code==='PMIN')!.scores.map(s=>s.id),['a','d']);
});
test('anonymous racers and separately censored names do not collapse into one player',()=>{
 const board=publicLeaderboards([row('a','','PMIN',100),row('b','','PMIN',110),row('c','FUCK','PMIN',120),row('d','SHIT','PMIN',130)],new Map())[0];
 assert.equal(board.scores.length,4);assert.equal(board.scores[0].driver,'Anonymous');assert.equal(board.scores[2].driver,'••••');assert.notEqual(driverKey(record('FUCK'),'c'),driverKey(record('SHIT'),'d'));
});
test('schema-only migration preserves old scores while ranking legacy names correctly',()=>{
 const db=new DatabaseSync(':memory:');
 for(const name of ['0000_same_the_executioner','0001_friendly_wolfsbane','0002_bitter_joshua_kane','0003_cooing_blue_blade'])db.exec(readFileSync(new URL('../drizzle/'+name+'.sql',import.meta.url),'utf8'));
 const insert=db.prepare('INSERT INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at) VALUES (?,?,?,?,?,?,?)');
 for(const r of [row('a','Marco','PMIN',100),row('b',' MARCO ','PMIN',110),row('c','marco','COUN',120),row('d','','PMIN',130),row('e','','PMIN',140)])insert.run(r.id,'rules',r.track_hash,r.car_code,r.ticks,r.record,r.created_at);
 db.exec("INSERT INTO shared_replays VALUES ('a','[]','DEFAULT',10),('b','[]','DEFAULT',10)");
 db.exec(readFileSync(new URL('../drizzle/0004_tricky_aaron_stack.sql',import.meta.url),'utf8'));
 assert.deepEqual(db.prepare('SELECT id FROM global_scores ORDER BY id').all().map(r=>r.id),['a','b','c','d','e']);
 assert.equal(db.prepare("SELECT driver_key FROM global_scores WHERE id='c'").get()!.driver_key,'');
 db.exec(readFileSync(new URL('../drizzle/0005_dark_silhouette.sql',import.meta.url),'utf8'));
 assert.ok(db.prepare('SELECT route_assessment FROM global_scores').all().every(row=>row.route_assessment==='not_assessed'),'Older scores must not be presumed full-route');
 assert.deepEqual(db.prepare('SELECT id FROM shared_replays').all().map(r=>r.id),['a','b']);
 assert.deepEqual(db.prepare('SELECT id FROM ('+rankedScoresSQL+') WHERE driver_rank=1 ORDER BY ticks').all().map(r=>r.id),['a','d','e']);db.close();
});
test('retention keeps seven drivers per car, not seven runs across every car; faster improvements replace older runs',()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE global_scores(id TEXT PRIMARY KEY,rules TEXT,track_hash TEXT,car_code TEXT,ticks INTEGER,record TEXT,created_at INTEGER,driver_key TEXT,route_assessment TEXT DEFAULT 'not_assessed')");
 const insert=db.prepare('INSERT INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at,driver_key) VALUES (?,?,?,?,?,?,?,?)');
 for(let i=0;i<9;i++)for(const car of ['PMIN','COUN'])insert.run(car+i,'rules','track',car,100+i+(car==='COUN'?100:0),'[]',i,'name:driver'+i);
 insert.run('better','rules','track','PMIN',99,'[]',20,'name:driver0');
 db.prepare(pruneCarScoresSQL).run('rules','track','rules','track');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,14);
 assert.ok(db.prepare("SELECT id FROM global_scores WHERE id='better'").get());assert.equal(db.prepare("SELECT id FROM global_scores WHERE id='PMIN0'").get(),undefined);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ('+rankedScoresSQL+') WHERE driver_rank=1').get()!.n,7);db.close();
});
