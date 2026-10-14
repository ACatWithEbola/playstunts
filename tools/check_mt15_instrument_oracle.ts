import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyOriginalMt32DriverControl} from '../lib/game/mt32-driver-control.ts';
import {sendOriginalMt32SystemExclusive} from '../lib/game/mt32-system-exclusive.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,32);
for(const row of rows){
 const result=applyOriginalMt32DriverControl('instrument',row.channel,new Uint8Array(46),Uint8Array.from(row.patch),0,0,row.engine);
 assert.deepEqual(result.writes,row.writes.filter(([port]:number[])=>port===0x330),`${row.engine}/${row.channel}`);
 if(row.engine==='ms-1990')assert.deepEqual(applyOriginalMt32DriverControl('instrument',row.channel,new Uint8Array(46),Uint8Array.from(row.patch)).writes,result.writes);
 if(row.engine==='ms-1991'){
  const part=row.channel&15,payload=[3,0,(((part===10?part:part-1)<<4)&255)|4,row.patch[18]];
  const program=sendOriginalMt32SystemExclusive(new Uint8Array(1750),(_segment,at)=>payload[at],0,0,4,'ms-1991'),writes:number[][]=[];let op=program.next();
  while(!op.done){if(op.value.kind==='write')writes.push([op.value.port,op.value.value]);op=program.next(0);}
  assert.deepEqual(writes,row.writes.slice(2,-6),'Complete SysEx/PIT virtual output '+row.channel);
 }
}
console.log('32 original MT15 instrument MIDI sequences and16 modern SysEx/PIT port traces match; default remains legacy; elapsed-time host not covered');
