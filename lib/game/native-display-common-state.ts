import {initializeOriginalHerculesDisplay} from './hercules-display-initialize.ts';
import {initializeOriginalDataSegment} from './initialize-data-segment.ts';
import {initializeOriginalDisplayTables} from './initialize-display-tables.ts';
import {initializeOriginalDisplay,type OriginalDisplayStartupOperation} from './initialize-display.ts';
import {initializeOriginalDefaultRenderingMaterials} from './initialize-rendering-state.ts';
import {initializeOriginalGameDisplayDefaults} from './initialize-game-display-defaults.ts';
import {initializeNativeCommonGameState} from './initialize-common-game-state.ts';
import {createEgaPlanarMemory} from './ega-planar-memory.ts';
import {createOriginalEgaDrawingHost} from './ega-drawing-host.ts';
import {createOriginalPackedDisplayDrawingHost} from './packed-display-drawing-host.ts';

export interface NativeInitialDisplayData {hercules?:boolean;segment:number;data:Uint8Array;displayData:{offset:number;data:Uint8Array}[]}
/** Fresh native memory owner for display and common resources. This is the
 * pre-menu foundation, not race/audio initialization. Its virtual heap lies
 * outside all three original data segments; no captured frame is accepted. */
export async function createNativeDisplayCommonState(mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,files:{exists(name:string):boolean;read(name:string):Promise<Uint8Array|null>},options:{heapStart?:number;previousVideoMode?:number;equipmentWord?:number;operation?:(operation:OriginalDisplayStartupOperation)=>void}={}){
 if(source.hercules&&mode!=='cga')throw Error('Hercules requires the original CGA driver');
 const d={cga:0x2eed0,tandy:0x2e580,ega:0x32090}[mode],start=options.heapStart??0x4300;
 if(source.segment*16!==d)throw Error('Original source data belongs to a different display');
 if(!Number.isInteger(start)||start<0x4300||start>=(mode==='tandy'?0x9c00:0xa000))throw Error('Native resource heap is outside conventional memory');
 let memory:Uint8Array=new Uint8Array(0x100000);
 initializeOriginalDataSegment(memory,d,source.data,mode);
 initializeOriginalDisplayTables(memory,mode,source.displayData);
 const v=new DataView(memory.buffer),word=(at:number,value:number)=>v.setUint16(at,value,true);
 // Caller-owned resource arena, using the original 18-byte descriptors.
 for(let i=0;i<64;i++){word(d+0xc000+i*18+14,i?0xa000:start);word(d+0xc000+i*18+16,i?0:2);}
 [0xc000,0xc000,0xc46e,0xc46e].forEach((value,i)=>word(d+0x4b12+i*2,value));word(d+0x4788,start);
 initializeOriginalGameDisplayDefaults(memory,d,mode,(end,reserved)=>{
  // Native equivalents of the caller's successful conventional-memory owner:
  // original22FF2 records the PSP/data segments and allocation endpoints.
  word(d+0x478a,0x280);word(d+0x478c,d>>>4);word(d+0x4786,start);
  word(d+0x4784,end-reserved);word(d+0xc46e+14,end-reserved);
 });
 word(0x410,options.equipmentWord??0x20);word(0x463,0x3d4);
 const graphics=new Uint8Array(9);graphics[8]=255;
 const aperture=createEgaPlanarMemory({planes:Array.from({length:4},()=>new Uint8Array(65536)),latches:new Uint8Array(4),graphics,mapMask:15});
 const program=initializeOriginalDisplay(memory,d,mode);let step=program.next();
 while(!step.done){const op=step.value;options.operation?.(op);let input=0;
  switch(op.kind){
   case 'read-bios-video-mode':input=options.previousVideoMode??3;break;
   case 'port-byte':case 'port-word':
    if([0x3c4,0x3c5,0x3ce,0x3cf].includes(op.port)){if(op.kind==='port-byte')aperture.writePort(op.port,op.value);else aperture.writeWord(op.port,op.value);}break;
   case 'write-word':aperture.writeByte(op.offset,op.value);aperture.writeByte(op.offset+1,op.value>>>8);break;
   case 'write':aperture.writeByte(op.offset,op.value);break;
   case 'read':input=aperture.readByte(op.offset);break;
   // A newly created video surface is already blank. BIOS mode/palette and
   // CRTC requests are exposed to the presentation owner through operation.
  }
  step=program.next(input);
 }
 if(step.value.error)throw Error('Original display initialization failed: '+step.value.error);
 if(source.hercules)initializeOriginalHerculesDisplay(memory,d,{biosMode:mode=>options.operation?.({kind:'bios-video-mode',mode}),out:(port,value)=>options.operation?.({kind:'port-byte',port,value})});
 initializeOriginalDefaultRenderingMaterials(memory,d,mode);
 const name=(offset:number)=>{let value='';for(let i=0;i<65536;i++){const byte=memory[d+((offset+i)&65535)];if(!byte)return value;value+=String.fromCharCode(byte);}throw Error('Original resource name is unterminated');};
 await initializeNativeCommonGameState({memory:()=>memory,writeMemory(next){memory=next;},async exists(offset){return files.exists(name(offset));},async readFile(offset){return files.read(name(offset));},async retry(){throw Error('Original common resource is missing');}},d,0xee00,0xeefe,mode);
 const drawing=mode==='ega'?createOriginalEgaDrawingHost(()=>memory,d,aperture):createOriginalPackedDisplayDrawingHost(()=>memory,d,mode);
 return {mode,d,memory:()=>memory,writeMemory(next:Uint8Array){if(next.length!==0x100000)throw Error('Original memory owner requires one megabyte');memory=next;},drawing,aperture};
}
