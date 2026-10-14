/** Schedule evidence only; never infers audible pitch/timbre from metadata. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
export function auditSchedules(trace,manifests,score='slct'){
 const channelsByScore={slct:[2,5,8,9],titl:[2,3,5,9],vict:[2,3,4,5,9],over:[2,5,6,9]};
 const keysByScore={slct:[36,38,42,44,49,51],titl:[36,38,41,42,44,45,48,49],vict:[36,38,41,42,43,44,45,48,49],over:[7,36,38,42,44,49]};
 assert.ok(Object.hasOwn(channelsByScore,score),'Unsupported score audit');
 assert.equal(trace.generation,'ms-1991');assert.equal(trace.sampleRate,32000);
 assert.ok(Number.isSafeInteger(trace.frames)&&trace.frames>0,'Invalid capture duration');
 const decoded=decodeDeliveredMidi(trace.events);assert.equal(decoded.partial,null);
 assert.ok(decoded.interruptions.every(e=>e.kind==='unterminated-sysex'));
 const messages=decoded.messages.filter(e=>e.frame>=0),seen=new Set();let total=0;
 assert.ok(messages.every(e=>e.frame<trace.frames),'MIDI event outside captured audio');
 for(const m of manifests){
  assert.equal(m.rate,48000);assert.equal(m.frames,trace.frames*1.5);
  const channel=m.key===undefined?({bass:2,lead:5,harmony:8,accompaniment:score==='over'?6:3,accompaniment3:3,accompaniment4:4}[m.layer]):9;
  assert.ok(channelsByScore[score].includes(channel));
  if(m.key===undefined&&m.channel!==undefined)assert.equal(m.channel,channel);
  const identity=channel===9?'key:'+m.key:'channel:'+channel;
  assert.ok(!seen.has(identity),'Duplicate arrangement layer');seen.add(identity);
  const selected=messages.filter(e=>(e.status&15)===channel);
  if(channel===9){
   const expected=selected.filter(e=>e.status===0x99&&e.data[0]===m.key&&e.data[1]>0).map(e=>({sourceFrame:e.frame,outputFrame:Math.round(e.frame*1.5),key:m.key,velocity:e.data[1]}));
   assert.deepEqual(m.events,expected);total+=expected.length;
  }else{
   const notes=[],active=new Map();
   for(const e of selected){
    const kind=e.status&240,pitch=e.data[0];
    if(kind===144&&e.data[1]>0){
     if(active.has(pitch))active.get(pitch).releaseFrame=e.frame;
     const n={pitch,velocity:e.data[1],startFrame:e.frame,releaseFrame:trace.frames};notes.push(n);active.set(pitch,n);
    }else if(kind===128||kind===144){if(active.has(pitch)){active.get(pitch).releaseFrame=e.frame;active.delete(pitch);}}
    else if(kind===176&&[120,123].includes(pitch)){for(const n of active.values())n.releaseFrame=e.frame;active.clear();}
   }
   assert.deepEqual(m.events.map(({pitch,velocity,startFrame,releaseFrame})=>({pitch,velocity,startFrame,releaseFrame})),notes);total+=notes.length;
  }
 }
 const required=[...channelsByScore[score].filter(ch=>ch!==9).map(ch=>'channel:'+ch),...keysByScore[score].map(key=>'key:'+key)];
 assert.deepEqual([...seen].sort(),required.sort());
 const originalAttacks=messages.filter(e=>(e.status&240)===144&&e.data[1]>0).length;
 assert.equal(total,originalAttacks,'Unrepresented original note attacks');
 return {layers:seen.size,scheduledAttacks:total,allOriginalAttacksRepresented:true,melodicReleaseFramesMatch:true,audibleFidelityVerified:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options=args.filter(v=>v.startsWith('--score='));assert.ok(options.length<=1);
 const score=options[0]?.slice(8)??'slct';
 const [trace,...paths]=args.filter(v=>!v.startsWith('--score='));console.log(JSON.stringify(auditSchedules(JSON.parse(readFileSync(trace)),paths.map(p=>JSON.parse(readFileSync(p))),score)));
}
