import assert from 'node:assert/strict';
import {versionedGameDialogHost} from '../lib/game/versioned-game-dialog-host.ts';
import {MS91_DIALOG_TEXT} from '../lib/game/ms91-dialog-resources.ts';
import {createNativeDialogRuntime} from '../lib/game/native-dialog-runtime.ts';
const font=new Uint8Array(4096),view=new DataView(font.buffer);
view.setUint16(14,8,true);view.setUint16(16,1,true);
for(let c=32;c<127;c++)view.setUint16(22+c*2,1,true);
for(const inherited of [undefined,'ms-1990','ms-1991'] as const)for(const engine of [undefined,'ms-1990','ms-1991'] as const){
 const resources={efex:Array.from('File Exists!]][Rename File[Save File]\0',c=>c.charCodeAt(0)),untouched:[65,0]};
 const before=structuredClone(resources),keys=[0x4800,13],pixels=new Uint8Array(65536).fill(7);
 const host={physicsEngine:inherited,resources,pixels,font,present(){},async input(){return {key:keys.shift()??13,x:0,y:0,buttons:0,mouseActive:false};},async release(){},async gameCounter(){return 1;},async enumerate(){return [];},async editPath(path:string){return {path,key:27};}};
 const routed=versionedGameDialogHost(host,engine);
 assert.equal(routed.physicsEngine,engine);assert.equal(host.physicsEngine,inherited);
 assert.deepEqual(resources,before);assert.equal(routed.resources.untouched,resources.untouched);
 if(engine==='ms-1991')assert.equal(String.fromCharCode(...routed.resources.efex),MS91_DIALOG_TEXT.efex+'\0');
 else assert.equal(routed.resources,resources);
 assert.equal(await createNativeDialogRuntime(routed).dialog('efex',2),engine==='ms-1991'?1:0);
 assert.ok(pixels.every(value=>value===7));
 const restored=versionedGameDialogHost(host,'ms-1990');assert.equal(restored.resources,resources);
}
console.log('Nine owning-engine dialog routes pass: versioned text/wrap, legacy restoration, host/input/backdrop isolation');
