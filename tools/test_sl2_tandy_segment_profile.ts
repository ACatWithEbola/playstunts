import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalTandyDacTransfer,type TandySegmentCountProfile} from '../lib/game/tandy-dac-transfer.ts';
import {createLegacyTandyChipDevice} from '../lib/game/legacy-tandy-chip-device.ts';
function run(segment:number,offset:number,length:number,profile:TandySegmentCountProfile='exact-length'){
 const reads:number[]=[],transfer=createOriginalTandyDacTransfer(address=>{reads.push(address);return address&255;},{pauseAt64KiB:true,segmentCountProfile:profile});let completions=0,boundaries=0;
 transfer.play({ax:0x8307,es:segment,bx:offset,cx:length,dx:123});
 while(transfer.status().carry){const byte=transfer.transferByte();assert.ok(byte);if(byte.completion!==null)completions++;if(transfer.segmentPaused){boundaries++;assert.equal(transfer.transferByte(),null);transfer.resumeSegment();}}
 assert.equal(completions,1);return {reads,boundaries};
}
for(const [segment,offset,length] of [[0x3000,0x100,1],[0x3000,0x100,4],[0x3fff,15,2],[0x3fff,15,18],[0x3fff,14,4],[0x3fff,14,2],[0x3fff,15,65535]]){
 const start=(segment<<4)+offset,cross=(start&65535)+length>65536,exact=run(segment,offset,length),sl2=run(segment,offset,length,'sl2-a3a79791');
 assert.equal(exact.reads.length,length);assert.equal(sl2.reads.length,length+Number(cross));assert.equal(sl2.boundaries,Number(cross));
 assert.deepEqual(sl2.reads,Array.from({length:length+Number(cross)},(_,index)=>(start+index)&0xfffff));
}
assert.throws(()=>createOriginalTandyDacTransfer(()=>0,{segmentCountProfile:'sl2-a3a79791'}),/Unsupported/);
const physical:number[]=[];let notified=0;
const device=createLegacyTandyChipDevice(address=>{physical.push(address);return 128;},{divisor:1,volume:7,segmentCountProfile:'sl2-a3a79791',grant:()=>true,completion(){notified++;}});
device.play({ax:0x8307,es:0x3fff,bx:15,cx:2,dx:1});device.advance(2);assert.deepEqual(device.snapshot().pending,['segment']);device.serviceInterrupt(true);device.advance(2);assert.deepEqual(physical,[0x3ffff,0x40000,0x40001]);assert.equal(notified,0);device.serviceInterrupt(true);assert.equal(notified,1);device.close();
if(process.argv[2]){const evidence=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(evidence.biosSha256,'a3a79791ed4ca85c4206412a2138ca8587e616dad2282a22812ccd6eac6c3c71');assert.equal(evidence.rows.length,5);for(const row of evidence.rows){const request=row.request,actual=run(request.segment,request.offset,request.length,'sl2-a3a79791');assert.deepEqual(actual.reads,row.addresses);assert.equal(actual.reads.length,row.transferred);assert.equal(actual.boundaries+1,row.terminals.length);}}
console.log('Opt-in hashed SL/2 segment profile reproduces firmware count quirk/address sequence; exact-length default preserved, boundary-ending/max-length cases and one completion verified');
