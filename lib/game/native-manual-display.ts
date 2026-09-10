import {prepareNativeDisplayRace} from './prepare-native-display-race.ts';
import {createNativeDisplayReplayControl} from './native-display-replay-control.ts';
import {drawOriginalReplayWait} from './replay-wait-message.ts';
import {RACE_OVERLAY_DISPLAY_LAYOUTS} from './race-overlay-display.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import type {NativeInitialDisplayData} from './native-display-common-state.ts';
import type {NativeDemoData} from './native-demo-runtime.ts';
export interface NativeManualRaceDisplay {
 render(memory:Uint8Array):Uint8Array;pixels():Uint8Array;
 controlReplay(operation:number,first:number,current:number):void;
 drawReplayWait():void;
}
/** Display implementation prepared before the manual race's first frame.
 * Its native graphics allocations are separate from simulation/audio banks. */
export async function prepareNativeManualDisplay(data:NativeDemoData,mode:'cga'|'tandy'|'ega',source:NativeInitialDisplayData,live:()=>Uint8Array){
 const memory=live(),d=0x2d1a0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),track=v.getUint16(d+0x9356,true)+v.getUint16(d+0x9358,true)*16;
 const {owner,renderer}=await prepareNativeDisplayRace(data,mode,source,memory,Array.from(memory.subarray(track,track+1802)));
 const display:NativeManualRaceDisplay={render:renderer.render,pixels:renderer.pixels,controlReplay:createNativeDisplayReplayControl(owner,live),drawReplayWait(){restoreOriginalDisplayWindow(owner.memory(),owner.d,mode);drawOriginalReplayWait(owner.memory(),owner.d,owner.drawing,RACE_OVERLAY_DISPLAY_LAYOUTS[mode]);}};
 return {owner,display};
}
