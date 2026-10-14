import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSoundEffect} from '../lib/game/load-sound-effect.ts';
import {soundResourceOffset} from '../lib/game/sound-resource.ts';
const key=(name:string)=>Uint8Array.from(name,c=>c.charCodeAt(0));
let cases=0;
for(const device of ['','pc-','tandy-','mt32-'])for(const score of ['titl','slct','vict','over']){
 const bytes=readFileSync(`public/game/${device}music-${score}-seed.json`),seed=JSON.parse(bytes.toString());
 const bank=Uint8Array.from(seed.bank),container=soundResourceOffset(bank,key(score.toUpperCase()));
 assert.notEqual(container,null);
 const count=bank[container!+4];
 assert.ok(count<128,'Bundled container count must not hit the signed/unsigned difference');
 const expected=(container!+1+count*8)&65535;
 const view=new DataView(bank.buffer);
 assert.equal(view.getUint16(seed.header,true),expected);
 assert.equal(view.getUint16(seed.header+2,true),0x8000);
 const result=loadSoundEffect(bank,Uint8Array.from(seed.voices),key(score.toUpperCase()),{offset:0,segment:0x8000},{offset:0,segment:0x9000},[]);
 assert.deepEqual(result.bank,bank,'Already initialized bank must remain unchanged');
 assert.deepEqual(readFileSync(`public/game/${device}music-${score}-seed.json`),bytes);
 cases++;
}
console.log(JSON.stringify({bundledMusicCases:cases,signedUnsignedCountDifferenceUnreachableForBundledScores:true,retainedContainerPointersMatch:true,seedFilesUnchanged:true,pass:true}));
