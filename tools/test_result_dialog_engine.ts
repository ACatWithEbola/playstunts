import assert from 'node:assert/strict';
import {bindResultDialogEngine} from '../lib/game/result-dialog-engine.ts';
import {createNativeDialogRuntime} from '../lib/game/native-dialog-runtime.ts';
const font=new Uint8Array(4096),v=new DataView(font.buffer);v.setUint16(14,8,true);v.setUint16(16,1,true);
for(let c=32;c<127;c++)v.setUint16(22+c*2,1,true);
let cases=0;
for(const inherited of [undefined,'ms-1990','ms-1991'] as const)for(const engine of [undefined,'ms-1990','ms-1991'] as const){
 const keys=[0x4800,13],pixels=new Uint8Array(65536).fill(7),resources={prompt:Array.from('Title][A][B][C]\0',c=>c.charCodeAt(0))};
 const host={physicsEngine:inherited,pixels,font,resources,present(){},async input(){return {key:keys.shift()??13,x:0,y:0,buttons:0,mouseActive:false};},async release(){},async gameCounter(){return 1;},async enumerate(){return [];},async editPath(path:string){return {path,key:27};}};
 const routed=bindResultDialogEngine(host,engine);assert.equal(routed.physicsEngine,engine);assert.equal(host.physicsEngine,inherited);
 assert.equal(routed.pixels,pixels);assert.equal(routed.resources,resources);
 assert.equal(await createNativeDialogRuntime(routed).dialog('prompt',2),engine==='ms-1991'?2:0);
 assert.ok(pixels.every(n=>n===7));cases++;
}
console.log(JSON.stringify({routingCases:cases,completedEngineOverridesDefault:true,missingMetadataStaysLegacy:true,hostAndBackdropPreserved:true,pass:true}));
