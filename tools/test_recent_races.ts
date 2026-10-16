import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {recentRacesSQL,recentRace,type RecentRaceRow} from '../lib/server/recent-races.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
const record=(name:string)=>{const r=Array(52).fill(0);[...name].forEach((c,i)=>r[i]=c.charCodeAt(0));[...'Porsche/March INDY'].forEach((c,i)=>r[17+i]=c.charCodeAt(0));return JSON.stringify(r);};
test('track records compare both editions while personal bests remain edition-specific',()=>{
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>/^\d+.*\.sql$/.test(f)).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const add=(id:string,ticks:number,stamp:number,modern:boolean)=>{
  db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,'track','PMIN',ticks,record('Marco'),stamp,'marco','full_route');
  if(modern)db.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,'ms-1991');
 };
 add('legacy',1000,1,false);add('modern-first',900,2,true);add('modern-next',850,3,true);
 const before=db.prepare('SELECT * FROM global_scores ORDER BY id').all();
 const rows=db.prepare(recentRacesSQL).all(GLOBAL_SCORE_RULES,'[]') as RecentRaceRow[];
 const first=rows.find(r=>r.id==='modern-first')!,next=rows.find(r=>r.id==='modern-next')!;
 assert.equal(first.previous_best,null);assert.equal(first.previous_record,1000);assert.equal(recentRace(first).event,'valid');
 assert.equal(next.previous_best,900);assert.equal(next.previous_record,900);assert.equal(next.current_record,850);assert.equal(recentRace(next).event,'record');
 assert.equal(rows.find(r=>r.id==='legacy')!.current_record,850);
 assert.deepEqual(db.prepare('SELECT * FROM global_scores ORDER BY id').all(),before);db.close();
});
test('existing activity is retroactively classified against the combined record without rewriting stored runs',()=>{
 const db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>/^\d+.*\.sql$/.test(f)).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const add=(id:string,ticks:number,stamp:number,driver:string,car:string,engine:string,assessment='full_route')=>{
  db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,'track',car,ticks,record(driver),stamp,driver,assessment);
  db.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,engine);
 };
 add('overall',800,1,'other','P962','ms-1990');add('personal-old',1200,2,'marco','PMIN','ms-1991');
 add('personal-new',1000,3,'marco','PMIN','ms-1991');add('tie',800,4,'alain','PMIN','ms-1991');
 add('actual-record',750,5,'newdriver','PMIN','ms-1991');add('exploit',100,6,'shortcut','PMIN','ms-1991','shortcuts_detected');
 const before=db.prepare('SELECT * FROM global_scores ORDER BY id').all();
 const result=db.prepare(recentRacesSQL).all(GLOBAL_SCORE_RULES,'[]') as RecentRaceRow[];
 const get=(id:string)=>recentRace(result.find(row=>row.id===id)!);
 assert.equal(get('personal-new').event,'improved','Beating an edition-specific time is not an overall record');
 assert.equal(get('personal-new').improvement,200);assert.equal(get('tie').event,'valid','Tying a record is not beating it');
 assert.equal(get('actual-record').event,'record','Only beating the combined record earns the record message');
 assert.equal(get('exploit').event,'submitted');assert.equal(get('personal-old').event,'valid','No invented personal improvement without prior evidence');
 assert.deepEqual(db.prepare('SELECT * FROM global_scores ORDER BY id').all(),before);db.close();
});
test('Recent races deduplicate, limit to seven, exclude withdrawals and classify only evidenced achievements',()=>{
 const db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>/^\d+.*\.sql$/.test(f)).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const add=(id:string,ticks:number,stamp:number,driver='marco',assessment='full_route',track='default')=>{db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,track,'PMIN',ticks,record(driver),stamp,driver,assessment);};
 add('old',1500,1);add('record',1300,2);add('slow',1800,3);add('exploit',500,4,'other','shortcuts_detected');add('uncertain',600,5,'unknown','not_assessed');add('valid',1600,6,'alain');add('withdrawn',100,7,'marco','full_route','test');
 db.prepare('INSERT INTO run_history SELECT * FROM global_scores WHERE id=?').run('record');
 add('older1',1900,-1);add('older2',2000,-2);add('older3',2100,-3);
 const rows=db.prepare(recentRacesSQL).all(GLOBAL_SCORE_RULES,JSON.stringify(['test'])) as RecentRaceRow[];
 assert.equal(rows.length,7);
 assert.deepEqual(rows.slice(0,5).map(r=>r.id),['valid','uncertain','exploit','slow','record']);
 assert.deepEqual(rows.slice(0,5).map(r=>recentRace(r).event),['valid','submitted','submitted','valid','record']);
 assert.equal(recentRace(rows[4]).driver,'marco');
 const base=rows[0];assert.equal(recentRace({...base,driver_key:'alain',previous_best:1700,current_record:1300,previous_record:1300}).event,'improved');
 assert.equal(recentRace({...base,driver_key:'anonymous:x',previous_best:1700}).event,'valid');
 assert.equal(recentRace({...base,driver_key:'',previous_best:1700}).event,'valid');
 db.close();
});
