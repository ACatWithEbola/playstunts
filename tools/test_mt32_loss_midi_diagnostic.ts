import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
import {applyOriginalMt32TrackControl} from '../lib/game/mt32-track-control.ts';
import {createMt32UnitRouter} from '../lib/game/mt32-unit-address.ts';
const path='public/game/mt32-music-over-seed.json',source=readFileSync(path,'utf8');
for(const generation of ['ms-1990','ms-1991'] as const){
 const seed=JSON.parse(source);seed.driverGeneration=generation;
 const resource=versionedMt15Resource(generation);if(resource)seed.driver=Array.from(resource);
 const runtime=createOriginalMt32MusicRuntime(seed),raw=runtime.tick().writes;
 const bytes=raw.map(([,value])=>value),index=bytes.indexOf(0xff);
 assert.ok(index>=0,'Loss first callback contains high-channel controller status');
 assert.deepEqual(bytes.slice(index-3,index+3),[0x99,36,127,0xff,7,66]);
 const unassigned=new Uint8Array(72);unassigned[0x47]=255;
 assert.deepEqual(applyOriginalMt32TrackControl([unassigned],[],0,7,66).writes,raw.slice(index,index+3),'Unassigned channel controller reproduces exact raw FF 07 42');
 const routed=createMt32UnitRouter().write(bytes.slice(index-3,index+3));
 assert.deepEqual(routed,[0x99,36,127,0xff,7,66],'Unit routing did not invent the bytes');
 // MIDI real-time FF does not cancel channel running status. Therefore the
 // following two data bytes are interpreted under the preceding 99 note-on.
 let status=0,arguments_:number[]=[],notes:number[][]=[];
 for(const byte of routed){if(byte>=0xf8)continue;if(byte&0x80){status=byte;arguments_=[];}else{arguments_.push(byte);if(arguments_.length===2){notes.push([status,...arguments_]);arguments_=[];}}}
 assert.deepEqual(notes,[[0x99,36,127],[0x99,7,66]]);
 console.log(`${generation}: loss warning mechanism traced to unassigned-channel FF controller followed by note-on running status; original executable parity still separate`);
}
assert.equal(readFileSync(path,'utf8'),source);
