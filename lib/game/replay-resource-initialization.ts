import {selectOriginalReplayControl} from './replay-control-selection.ts';
import {initializeOriginalResourceList} from './initialize-resource-list.ts';
/** Original15830 mode0: resolve the retained SDGAME bank, then select Stop. */
export function initializeOriginalReplayResources(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],low={mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode];
 const offset=view.getUint16(d+0xa318+high,true),segment=view.getUint16(d+0xa31a+high,true);
 initializeOriginalResourceList(memory,d,offset,segment,0x315e,0x54c8+low);
 selectOriginalReplayControl(memory,d,4,mode);
}
