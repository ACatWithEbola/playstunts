import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {originalTrackOverviewSubmissions} from '../lib/game/track-overview-submissions.ts';
const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
const result=spawnSync('python3',['tools/check_original_overview_records.py',legacy,modern,'--libraries',libraries,'--multi-tile'],{encoding:'utf8'});
assert.equal(result.status,0,result.stderr);const oracle=JSON.parse(result.stdout);
const memory=new Uint8Array(0x100000),d=0x70000,v=new DataView(memory.buffer),word=(offset:number,value:number)=>v.setUint16(d+offset,value&65535,true);
for(const [field,segment]of [[0x9356,0x5000],[0x9ad0,0x5100]]){word(field,0);word(field+2,segment);}
memory[0x50000]=105;for(const offset of [0,1,30,31])memory[0x51000+offset]=1;
for(let i=0;i<30;i++){word(0xa350+i*2,i*30);word(0x89d4+i*2,i*30);word(0xa3e2+i*2,512+i*1024);word(0xa796+i*2,512+i*1024);}
[1,3,5].forEach((value,i)=>word(0x8f6+i*2,value));
word(0x2018+105*14+2,64);word(0x2018+105*14+6,0x1234);word(0x2bda+14+2,32);word(0x2bda+14+4,0x1111);word(0x2bda+14+6,0x2222);
const before=memory.slice();
for(const row of oracle.rows){
 const records:unknown[]=[];let drains=0;
 originalTrackOverviewSubmissions(memory,d,record=>{
  if(!record){drains++;return;}
  const view=new DataView(Uint8Array.from(record).buffer);
  records.push({position:[0,2,4].map(o=>view.getInt16(o,true)),descriptor:view.getUint16(6,true),angles:[10,12,14].map(o=>view.getInt16(o,true)),flags:record[18],paint:record[19]});
 },undefined,undefined,row.engine);
 assert.deepEqual(records,row.records);assert.equal(drains,row.drains);assert.deepEqual(memory,before);
}
console.log(JSON.stringify({engines:2,recordsPerEngine:8,drainsPerEngine:900,originalRecordParity:true,sourceUnchanged:true,pixelParityClaimed:false}));
