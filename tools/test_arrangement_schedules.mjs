import assert from 'node:assert/strict';
import {auditSchedules} from './audit_arrangement_schedules.mjs';

const trace={generation:'ms-1991',sampleRate:32000,frames:3200,events:[]};
const message=(frame,...bytes)=>bytes.forEach(byte=>trace.events.push([frame,0x330,byte]));
for(const channel of [2,5,8])message(10,0x90+channel,60,100);
for(const key of [36,38,42,44,49,51])message(20,0x99,key,90);
// An unrelated old-pitch release must not terminate the active note.
message(30,0x82,59,0);
for(const channel of [2,5,8])message(40,0x80+channel,60,0);
const manifests=[...['bass','lead','harmony'].map(layer=>({layer,rate:48000,frames:4800,events:[{pitch:60,velocity:100,startFrame:10,releaseFrame:40}]})),...[36,38,42,44,49,51].map(key=>({key,rate:48000,frames:4800,events:[{sourceFrame:20,outputFrame:30,key,velocity:90}]}))];
assert.equal(auditSchedules(trace,manifests).scheduledAttacks,9);
assert.equal(auditSchedules(trace,manifests).audibleFidelityVerified,false);
let rejected=0;
function rejects(change){const t=structuredClone(trace),m=structuredClone(manifests);change(t,m);assert.throws(()=>auditSchedules(t,m));rejected++;}
rejects((t,m)=>m.pop());
rejects((t,m)=>m.push(structuredClone(m[0])));
for(const field of ['pitch','velocity','startFrame','releaseFrame'])rejects((t,m)=>m[0].events[0][field]++);
for(const field of ['sourceFrame','outputFrame','velocity'])rejects((t,m)=>m[3].events[0][field]++);
rejects((t,m)=>m[0].frames--);
rejects((t,m)=>m[0].rate=44100);
rejects(t=>t.generation='ms-1990');
rejects(t=>t.events.push([50,0x330,0x91],[50,0x330,64],[50,0x330,100]));
rejects(t=>t.events.push([50,0x330,0x92],[50,0x330,64]));
rejects(t=>t.events.push([1,0x330,0x92]));
rejects(t=>t.frames=NaN);
rejects(t=>t.frames=0);
rejects(t=>t.events.push([3200,0x330,0x99],[3200,0x330,36],[3200,0x330,100]));
console.log(`Arrangement schedules: valid fixture passed; ${rejected} invalid fixtures rejected; audible fidelity remains unverified.`);
const title=structuredClone(trace),titleLayers=structuredClone(manifests);
title.events=title.events.map(([frame,port,byte])=>[frame,port,byte===0x98?0x93:byte===0x88?0x83:byte]);
titleLayers[2].layer='accompaniment';
// Remove the complete key51 message; Title has toms instead of Menu's ride.
const at=title.events.findIndex((r,i)=>r[2]===0x99&&title.events[i+1]?.[2]===51);
title.events.splice(at,3);titleLayers.pop();
for(const key of [41,45,48]){
 for(const byte of [0x99,key,90])title.events.push([20,0x330,byte]);
 titleLayers.push({key,rate:48000,frames:4800,events:[{sourceFrame:20,outputFrame:30,key,velocity:90}]});
}
title.events.sort((a,b)=>a[0]-b[0]);
assert.equal(auditSchedules(title,titleLayers,'titl').scheduledAttacks,11);
assert.throws(()=>auditSchedules(title,titleLayers,'slct'));
assert.throws(()=>auditSchedules(title,titleLayers.slice(0,-1),'titl'));
assert.throws(()=>auditSchedules(title,titleLayers,'other'));
console.log('Title-specific full layer inventory passes; wrong score, missing tom and unknown score reject');
const over=structuredClone(trace),overLayers=structuredClone(manifests);
over.events=over.events.map(([frame,port,byte])=>[frame,port,byte===0x98?0x96:byte===0x88?0x86:byte]);
overLayers[2].layer='accompaniment';
const ride=over.events.findIndex((r,i)=>r[2]===0x99&&over.events[i+1]?.[2]===51);
over.events[ride+1][2]=7;overLayers.at(-1).key=7;overLayers.at(-1).events[0].key=7;
assert.equal(auditSchedules(over,overLayers,'over').scheduledAttacks,9);
assert.throws(()=>auditSchedules(over,overLayers.slice(0,-1),'over'));
assert.throws(()=>auditSchedules(over,overLayers,'titl'));
const mismatched=structuredClone(overLayers);mismatched[2].channel=3;
assert.throws(()=>auditSchedules(over,mismatched,'over'));
console.log('GameOver inventory preserves raw key7; missing event/layer, wrong score and inconsistent channel metadata reject');
const victory=structuredClone(title),victoryLayers=structuredClone(titleLayers);
for(const [frame,bytes]of [[10,[0x94,60,100]],[40,[0x84,60,0]],[20,[0x99,43,90]]])for(const byte of bytes)victory.events.push([frame,0x330,byte]);
victory.events.sort((a,b)=>a[0]-b[0]);
victoryLayers.push({layer:'accompaniment4',channel:4,rate:48000,frames:4800,events:[{pitch:60,velocity:100,startFrame:10,releaseFrame:40}]});
victoryLayers.push({key:43,rate:48000,frames:4800,events:[{sourceFrame:20,outputFrame:30,key:43,velocity:90}]});
assert.equal(auditSchedules(victory,victoryLayers,'vict').scheduledAttacks,13);
assert.throws(()=>auditSchedules(victory,victoryLayers.slice(0,-1),'vict'));
assert.throws(()=>auditSchedules(victory,victoryLayers,'titl'));
console.log('Victory complete13-layer inventory passes; missing extra tom and wrong-score layouts reject');
