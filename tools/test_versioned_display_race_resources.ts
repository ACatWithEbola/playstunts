import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {prepareNativeDisplayRace} from '../lib/game/prepare-native-display-race.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {prepareOriginalRaceViewport} from '../lib/game/race-viewport.ts';
const [path]=process.argv.slice(2);if(!path)throw Error('Provide a modern opponent1 replay reference');
const original=readFileSync(path),bytes=decodeVersionedReplay(original,'ms-1991').bytes;assert.equal(bytes[6],1);
const packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991'},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'DISPLAY',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();
const live=race.session.state.memory,unchanged=live.slice();
for(const engine of ['ms-1990','ms-1991'] as const)for(const mode of ['cga','tandy','ega'] as const)for(let opponent=1;opponent<=6;opponent++){
 const beforeRecords=JSON.stringify(fixtureData.records),beforePoints=JSON.stringify(fixtureData.points);
 const selectedLive=live.slice();selectedLive[0x2d1a0+0x8fc8]=opponent;
 const result=await prepareNativeDisplayRace({...fixtureData,physicsEngine:engine},mode,decodeNativeInitialDisplayData(packet.modes[mode]),selectedLive,race.raw);
 const memory=result.owner.memory(),d=result.owner.d,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 assert.equal(memory[d+0x9362+high+9],(engine==='ms-1991'?[90,120,110,120,140,175]:[80,110,90,90,100,150])[opponent-1],'Display opponent speed profile follows '+engine+' in '+mode);
 if(opponent===6){assert.equal(memory[d+0x9362+high+11],engine==='ms-1991'?60:40);assert.equal(memory[d+0x9362+high+12],engine==='ms-1991'?50:30);}
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),names=[];
 for(let at=view.getUint16(d+0x4b16,true);at<view.getUint16(d+0x4b18,true);at+=18)if(view.getUint16(d+at+16,true))names.push(Buffer.from(memory.subarray(d+at,d+at+12)).toString().split('\0')[0]);
 assert.ok(names.some(name=>name===(engine==='ms-1991'?'m91opp':'opp')+opponent+'.pre'),'Versioned opponent cache identity in '+mode);
 assert.deepEqual(live,unchanged,'Display preparation must not modify live simulation');
 assert.equal(JSON.stringify(fixtureData.records),beforeRecords);assert.equal(JSON.stringify(fixtureData.points),beforePoints);
 const renderLive=selectedLive.slice();prepareOriginalRaceViewport(renderLive,0x2d1a0,0xeefe);const renderBefore=renderLive.slice();
 const pixels=result.renderer.render(renderLive);
 assert.equal(pixels.length,320*200);assert.ok(new Set(pixels).size>1,'Rendered frame must not be blank in '+mode);
 assert.ok(pixels.every(pixel=>pixel<(mode==='cga'?4:16)),'Pixels remain in original display palette');
 const changes=Array.from(renderLive.keys()).filter(index=>renderLive[index]!==renderBefore[index]);
 assert.ok(changes.every(index=>index===0x2d1a0+0x9ab6||index===0x2d1a0+0x31e9),'Renderer may consume only documented live redraw flags');
 assert.deepEqual(live,unchanged,'Rendering a detached view must not modify the live race');
 console.log(engine+' '+mode+' opponent '+opponent+': profile/cache isolation, rasterization and live-state preservation pass');
}
assert.deepEqual(readFileSync(path),original);
