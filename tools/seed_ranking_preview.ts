/** Illustrative design fixture in isolated local D1 only, never real scores. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {driverKey} from '../lib/server/leaderboard-ranking.ts';
const hash=createHash('sha256').update('playstunts-local-ranking-design-preview-v1').digest('hex');
const cars=[['PMIN','Porsche/March INDY',1310],['COUN','Lamborghini Countach',1795],['AUDI','Audi Quattro Sport',1905]] as const;
const drivers=['Marco','Sven','Cas','Duplode','Alan','Krys','Zapper'];
const statements=[`INSERT OR REPLACE INTO score_tracks(hash,name) VALUES ('${hash}','DESIGN DEMO');`];
for(const [car,name,start] of cars)for(const [i,driver] of drivers.entries()){
 const ticks=start+i*47,record=Array(52).fill(0);for(const [offset,value] of [[0,driver],[17,name]] as const)Array.from(value,c=>c.charCodeAt(0)).forEach((n,i)=>record[offset+i]=n);record[50]=ticks&255;record[51]=ticks>>>8;
 const id=createHash('sha256').update('preview:'+car+':'+driver).digest('hex');
 statements.push(`INSERT OR REPLACE INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at,driver_key) VALUES ('${id}','${GLOBAL_SCORE_RULES}','${hash}','${car}',${ticks},'${JSON.stringify(record)}',${Math.floor(Date.now()/1000)},'${driverKey(record,id)}');`);
}
execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',statements.join('\n')],{stdio:'pipe'});
console.log('Seeded DESIGN DEMO: illustrative local-only rankings, three cars, seven drivers.');
