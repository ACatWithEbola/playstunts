import type {OriginalRasterCall} from './drain-primitive-queue.ts';
import {DISPLAY_PRIMITIVE_QUEUES} from './display-primitive-queue-layout.ts';
import {drawOriginalDisplaySolidPolygon} from './display-solid-polygon.ts';
import {drawOriginalPackedDisplayLine} from './packed-display-line.ts';
import {drawOriginalEgaDisplayLine} from './ega-display-line.ts';
import {drawOriginalDisplayCircle} from './display-circle.ts';
import {drawOriginalDisplayWheel} from './display-wheel.ts';
import {drawOriginalPackedDisplayPoint,drawOriginalEgaPoint} from './indexed-display-point.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
/** Dispatch the supplied build's real raster targets. Geometry and material
 * arguments come from its primitive queue; the caller owns edge scratch. */
export function* drawOriginalDisplayRasterCall(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',call:OriginalRasterCall,scratch:{leftOffset:number;rightOffset:number}):Generator<OriginalEgaBitmapOperation,void,number>{
 const a=call.args,layout=DISPLAY_PRIMITIVE_QUEUES[mode];
 if(call.address===0x2372a)yield* drawOriginalDisplaySolidPolygon(memory,d,mode,call.points!,a[0],scratch);
 else if(call.address===0x246bc)yield* drawOriginalDisplaySolidPolygon(memory,d,mode,call.points!,a[1],scratch,a[0]);
 else if(call.address===0x21394)yield* drawOriginalDisplaySolidPolygon(memory,d,mode,call.points!,a[1],scratch,a[0],a[2]);
 else if(call.address===0x21d98){if(mode==='ega')yield* drawOriginalEgaDisplayLine(memory,d,a[0],a[1],a[2],a[3],a[4]);else drawOriginalPackedDisplayLine(memory,d,mode,a[0],a[1],a[2],a[3],a[4]);}
 else if(call.address===layout.circle)yield* drawOriginalDisplayCircle(memory,d,mode,a[0],a[1],a[2],a[3],scratch);
 else if(call.address===layout.wheel)yield* drawOriginalDisplayWheel(memory,d,mode,call.points!,a[0],a.slice(1),scratch);
 else if(call.address===layout.point){if(mode==='ega')yield* drawOriginalEgaPoint(memory,d,a[0],a[1],a[2]);else drawOriginalPackedDisplayPoint(memory,d,mode,a[0],a[1],a[2]);}
 else throw Error(`Unsupported ${mode} original raster entry ${call.address.toString(16)}`);
}
