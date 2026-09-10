import {MCGA_PRIMITIVE_QUEUE,type OriginalPrimitiveQueueLayout} from './drain-primitive-queue.ts';
import {DISPLAY_PRIMITIVE_QUEUES} from './display-primitive-queue-layout.ts';
export interface OriginalModelDisplayLayout {address:(mcga:number)=>number;queue:OriginalPrimitiveQueueLayout}
const low=new Set([0x556a,0x5584,0x5586,0x5588,0x558a,0x558c,0x558e,0x5590,0x58b2,0x58b4,0x5f0a,0x5f0c,0x5f28,0x5f32,0x5f34,0x5f36,0x5f3e,0x5f42]);
const high=new Set([0x7fef,0x8000,0x8938,0x8a44,0x900a,0x9b28,0x9b5c,0xa3a8,0xaa5c]);
/** Explicit original global operands in16A08..17AE0 and18010..18121.
 * Caller-owned pointers are never relocated; only these named global bases are. */
export const MODEL_DISPLAY_LAYOUTS:Record<'mcga'|'cga'|'tandy'|'ega',OriginalModelDisplayLayout>={mcga:{address:n=>n,queue:MCGA_PRIMITIVE_QUEUE},...Object.fromEntries((['cga','tandy','ega'] as const).map((mode,index)=>[mode,{queue:DISPLAY_PRIMITIVE_QUEUES[mode],address:(n:number)=>n+(low.has(n)?[0x5da,0x616,0x462][index]:high.has(n)?[0x5e0,0x620,0x45c][index]:0)}]))} as Record<'mcga'|'cga'|'tandy'|'ega',OriginalModelDisplayLayout>;
