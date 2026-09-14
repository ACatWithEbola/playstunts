/** Build fresh native runtime resources; never import a captured game session. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {initializeOriginalDataSegment} from '../lib/game/initialize-data-segment.ts';
import {initializeOriginalRenderingState,initializeOriginalDefaultRenderingMaterials} from '../lib/game/initialize-rendering-state.ts';
import {initializeOriginalGameDisplayDefaults} from '../lib/game/initialize-game-display-defaults.ts';
import {initializeOriginalTrackCoordinates} from '../lib/game/initialize-track-coordinates.ts';
import {allocateOriginalGameBuffers} from '../lib/game/allocate-game-buffers.ts';
import {allocateOriginalRenderQueue} from '../lib/game/allocate-render-queue.ts';
import {loadNativeSceneShapes} from '../lib/game/load-scene-shapes.ts';
const output=process.argv[2];if(!output)throw Error('Pass the generated game directory');
const initial=JSON.parse(readFileSync(join(output,'native-initial-data.json'),'utf8')).modes.mcga;
const d=0x2d1a0,c=0x209e0;let memory:Uint8Array=new Uint8Array(0x100000);
initializeOriginalDataSegment(memory,d,Uint8Array.from(Buffer.from(initial.data,'hex')));
// The browser runtime does not execute the original DOS ownership prompt.
// Seed the same successful-validation state before deriving any race image.
memory[d+0xa42a]=1;
const word=(at:number,n:number)=>new DataView(memory.buffer).setUint16(at,n&65535,true);
// An empty native conventional-memory arena and original 18-byte descriptors.
for(let i=0;i<64;i++){word(d+0x6d00+i*18+14,i?0xa000:0x4000);word(d+0x6d00+i*18+16,i?0:2);}
[0x6d00,0x6d00,0x716e,0x716e].forEach((n,i)=>word(d+0x4b12+i*2,n));
word(d+0x4788,0x4000);
initializeOriginalGameDisplayDefaults(memory,d,'mcga',(end,reserved)=>{
 word(d+0x4784,end-reserved);word(d+0x4786,0x4000);word(d+0x478a,0x280);word(d+0x478c,d>>>4);
});
// The MCGA video window and its 200 scanline offsets. No saved back buffer.
for(const at of [0x5d94,0x5db2])[0,0xa000,0,0,0,0x5dd0,0,320,0,200,320,0,320,0,320].forEach((n,i)=>word(c+at+i*2,n));
for(let i=0;i<200;i++)word(c+0x5dd0+i*2,i*320);
word(c+0x6138,0x613a);memory.set(Uint8Array.from({length:256},(_,i)=>i),c+0x711c);
memory.set([97,100,0],d+0x7460);
initializeOriginalRenderingState(memory,d);initializeOriginalDefaultRenderingMaterials(memory,d);
writeFileSync(join(output,'native-resource-base.bin'),memory);
initializeOriginalTrackCoordinates(memory,d,0xeefe);
for(const allocate of [(m:Uint8Array)=>allocateOriginalRenderQueue(m,d),(m:Uint8Array)=>allocateOriginalGameBuffers(m,d,0xeefe)]){
 const result=allocate(memory);if(result.error)throw Error(result.error);memory=result.memory;
}
const filename=(at:number)=>{let name='';for(let i=0;i<65536;i++){const b=memory[d+((at+i)&65535)];if(!b)return name.toUpperCase();name+=String.fromCharCode(b);}throw Error('Unterminated resource filename');};
const host={memory:()=>memory,writeMemory(next:Uint8Array){memory=next;},async readFile(at:number){return new Uint8Array(readFileSync(join(output,'original-resources',filename(at))));},async retry(){throw Error('Missing scene resource');}};
if(await loadNativeSceneShapes(host,d,0xeefe))throw Error('Not enough scene memory');
writeFileSync(join(output,'native-render-resources.bin'),memory);
writeFileSync(join(output,'native-race-startup.bin'),memory);
console.log('Generated fresh race and rendering startup resources');
