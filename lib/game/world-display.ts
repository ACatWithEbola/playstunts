import {drawOriginalCrashFireballs,type OriginalFireballHost} from './crash-fireballs.ts';
import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import {prepareOriginalView} from './prepare-original-view.ts';
import {submitOriginalDistantModels} from './distant-models.ts';
import {renderOriginalSceneFrame} from './render-scene-frame.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import {updateOriginalCarWheelMemory} from './car-wheel-memory.ts';
import {drawOriginalSceneBackgroundDisplay,type OriginalSceneBackgroundDisplayHost} from './scene-background-display.ts';
import type {OriginalWorldFrame} from './render-original-world.ts';
export interface OriginalWorldDisplayHost extends OriginalSceneBackgroundDisplayHost,OriginalFireballHost {
 primitives(scratch:{leftOffset:number;rightOffset:number}):void;
}
/** Original C279..CDDA world submission, background and primitive drain using
 * the selected native display driver. The caller owns resources and scratch. */
export function renderOriginalWorldDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalWorldDisplayHost,frame:OriginalWorldFrame,scratch:{leftOffset:number;rightOffset:number},renderBackground=true,renderFireballs=true){
 const layout=WORLD_DISPLAY_LAYOUTS[mode],a=layout.address,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const view=prepareOriginalView(memory,d,frame.angles,frame.rectangle,layout);
 const draw=(record:number[])=>{
  memory.set(record,d+frame.recordPointer);
  return renderOriginalModelMemory(memory,d,frame.recordPointer,frame.cache,undefined,undefined,layout).result;
 };
 const detail=memory[d+0x134];
 if(detail===0)submitOriginalDistantModels(memory,d,frame.angles[2],frame.camera[1],view.backgroundMatrix,draw,layout);
 const cameraTile=[frame.camera[0]>>10,29-(frame.camera[2]>>10)];
 const carTile=detail?[memory[d+a(0x8c3a)],(29-memory[d+a(0x8c42)])&255]:frame.carTile;
 const slots={...frame.slots,skip:Array(23).fill(0)},threshold=memory[d+0x88a+detail];
 const scene=renderOriginalSceneFrame(memory,d,view.heading,cameraTile,carTile,threshold,slots,frame.paint,frame.camera,frame.particles,frame.opponentRetainedRow,frame.visibility,draw,args=>updateOriginalCarWheelMemory(memory,d,args),layout);
 const polygonCount=v.getUint16(d+a(0x8938),true);
 if(renderBackground)drawOriginalSceneBackgroundDisplay(memory,d,mode,host,frame.rectangle,view.backgroundDirection,view.backgroundMatrix,frame.angles[0],frame.angles[2],frame.camera[1],scratch);
 host.bounds(0,320,frame.rectangle[2],frame.rectangle[3]);host.primitives(scratch);
 if(renderFireballs)drawOriginalCrashFireballs(memory,d,frame.rectangle,scene.visibility,mode,host);
 return {scene,polygonCount,view};
}
