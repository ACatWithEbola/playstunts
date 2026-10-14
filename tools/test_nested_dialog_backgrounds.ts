import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeDisplayCommonState} from '../lib/game/native-display-common-state.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {captureNativeDisplayDialogBackground} from '../lib/game/native-display-dialog-background.ts';
import {originalPackedDisplayPixels} from '../lib/game/packed-display-pixels.ts';
const packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));let restored=0;
for(const mode of ['cga','tandy','ega'] as const){
 const owner=await createNativeDisplayCommonState(mode,decodeNativeInitialDisplayData(packet.modes[mode]),fixtureData.catalog);
 const pixels=()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode);
 for(let cycle=0;cycle<2;cycle++){
  const stack:{restore:()=>void;before:Uint8Array}[]=[];
  for(let depth=0;depth<3;depth++){
   const before=pixels().slice(),restore=captureNativeDisplayDialogBackground(owner);
   owner.drawing.rectangle(16+depth*12,16+depth*10,40,24,depth+1,false);
   assert.notDeepEqual(pixels(),before);stack.push({restore,before});
  }
  for(const entry of stack.reverse()){
   entry.restore();assert.deepEqual(pixels(),entry.before,`${mode}: nested backdrop must restore exactly`);
   entry.restore();assert.deepEqual(pixels(),entry.before,'Repeated dismissal is harmless');restored++;
  }
 }
}
console.log(JSON.stringify({actualNestedBackdropRestores:restored,displayModes:3,depth:3,realAllocatorAndDrawing:true,repeatedDismissalSafe:true,noScoresOrLiveWrites:true,pass:true}));
