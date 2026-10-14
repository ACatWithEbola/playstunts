/** Read-only model of a fresh decode versus paragraph-only cache restoration.
 * This isolates tail sensitivity; it does not certify an original-DOS fix. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {loadVleResource} from '../lib/game/load-vle-resource.ts';
import {soundResourceOffset} from '../lib/game/sound-resource.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {prepareRaceTrack} from '../lib/game/prepare-race-track.ts';
import {opponentPath} from '../lib/physics/opponent-path.ts';
const [path]=process.argv.slice(2);if(!path)throw Error('Provide the modern Audi opponent reference replay');
const source=new Uint8Array(readFileSync(path)),before=source.slice();
const replay=decodeVersionedReplay(source,'ms-1991').bytes;
const route=prepareRaceTrack(Array.from(replay.slice(24,0x722)),fixtureData.records,fixtureData.vectors,fixtureData.samples,fixtureData.objects).route;
for(let opponent=1;opponent<=6;opponent++){
 const packed=await fixtureData.catalog.read('OPP'+opponent+'.PRE');assert.ok(packed);
 const address=0x60000,fresh=loadVleResource(fixtureData.base,address,packed);
 const sped=soundResourceOffset(fresh.resource,new TextEncoder().encode('sped'));assert.notEqual(sped,null);
 // Cache acquisition copies complete paragraphs, not the decoder's released
 // staging paragraphs. Use identical zeroed working memory for both views.
 const restored=fixtureData.base.slice();restored.set(fresh.memory.subarray(address,address+fresh.resourceParagraphs*16),address);
 const freshCosts=Array.from(fresh.memory.subarray(address+sped!,address+sped!+256));
 const cachedCosts=Array.from(restored.subarray(address+sped!,address+sped!+256));
 const freshPath=opponentPath(route.primary,route.secondary,route.tiles,freshCosts);
 const cachedPath=opponentPath(route.primary,route.secondary,route.tiles,cachedCosts);
 console.log(JSON.stringify({opponent,size:fresh.resource.length,sped,costDifferences:freshCosts.flatMap((value,index)=>value===cachedCosts[index]?[]:[index]),samePath:JSON.stringify(freshPath)===JSON.stringify(cachedPath),firstRouteDifference:freshPath?.findIndex((value,index)=>value!==cachedPath?.[index])}));
}
assert.deepEqual(new Uint8Array(readFileSync(path)),before);
