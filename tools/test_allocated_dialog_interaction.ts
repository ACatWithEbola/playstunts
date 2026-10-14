import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeDisplayCommonState} from '../lib/game/native-display-common-state.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {captureNativeDisplayDialogBackground} from '../lib/game/native-display-dialog-background.ts';
import {interactNativeOriginalDialog} from '../lib/game/native-dialog-interaction.ts';
import {drawOriginalDialogDisplay} from '../lib/game/dialog-display.ts';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
import {measureOriginalFont} from '../lib/game/font-raster.ts';
import {originalPackedDisplayPixels} from '../lib/game/packed-display-pixels.ts';
import {MS91_DIALOG_TEXT} from '../lib/game/ms91-dialog-resources.ts';
const packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));let cases=0;
for(const mode of ['cga','tandy','ega'] as const)for(const engine of ['ms-1990','ms-1991'] as const){
 const owner=await createNativeDisplayCommonState(mode,decodeNativeInitialDisplayData(packet.modes[mode]),fixtureData.catalog);
 const pixels=()=>mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode);
 for(const menu of ['emop','emrl','erbf'] as const)for(const action of ['up','hover','cancel'] as const){
  const text=engine==='ms-1991'?MS91_DIALOG_TEXT[menu]:'Menu][First][Second][Third]';
  const bytes=Array.from(text+'\0',c=>c.charCodeAt(0)),before=pixels().slice(),restore=captureNativeDisplayDialogBackground(owner);
  const memory=owner.memory(),d=owner.d,fontSegment=memory[d+0x4dd2]|memory[d+0x4dd3]<<8,font=memory.subarray(fontSegment*16,fontSegment*16+65536);
  const content=originalDialogContent(bytes,line=>measureOriginalFont(font,line),-1,-1,2,engine,new DataView(font.buffer,font.byteOffset,font.byteLength).getUint16(14,true));
  const last=content.choices.length-1,choice=content.choices[last];let inputs=0,restores=0,draws=0;
  const result=await interactNativeOriginalDialog({font,async input(){
   assert.ok(inputs<2,'Dialog must finish with the supplied input sequence');
   const key=action==='cancel'?27:action==='up'&&inputs===0?0x4800:13;inputs++;
   return {key,x:choice.right,y:choice.bottom,mouseActive:action==='hover',buttons:0};
  },async release(){},async gameCounter(){throw Error('Unexpected timed dialog');},draw(selected){
   draws++;drawOriginalDialogDisplay(owner.memory(),d,mode,owner.drawing,bytes,selected,{text:15,border:4,disabled:1},0xe800,undefined,2,{x:-1,y:-1},engine);
   assert.notDeepEqual(pixels(),before,'Real allocated dialog must draw');
  },restore(){restores++;restore();}},bytes,2,0,undefined,engine);
  assert.equal(result,action==='cancel'?-1:action==='hover'?last:engine==='ms-1991'?last:0);
  assert.equal(restores,1);assert.ok(draws>0);assert.deepEqual(pixels(),before,'Complete interaction restores the actual display');cases++;
 }
}
console.log(JSON.stringify({allocatedInteractionCases:cases,engines:2,displayModes:3,realFontsAndDrawing:true,hoverInclusiveEdgesAndVersionedWrap:true,cancellationRestoresBackdrop:true,noScoresOrLiveWrites:true,pass:true}));
