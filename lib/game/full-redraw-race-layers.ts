import {drawOriginalWorldStatus} from './world-status-overlay.ts';
import {combineOriginalRectangles} from './combine-rectangles.ts';
import {drawOriginalViewCrash} from './view-crash-overlay.ts';
import {drawOriginalRacePresentation} from './race-presentation-frame.ts';
import {drawOriginalCockpitBase} from './cockpit-base-frame.ts';
import {updateOriginalCockpitFrame} from './cockpit-frame.ts';
import {createOriginalCockpitRasterHost} from './cockpit-raster-host.ts';
import {drawOriginalReplayBarMemory} from './replay-bar-memory-raster.ts';
import {restoreOriginalVideoWindow} from './select-sprite-window.ts';
/** Original layers over the existing native full-redraw MCGA renderer.
 * World pixels already reach VGA, so the original dirty-region screen copy
 * is replaced by descriptor restoration. Alternate screens are not this path. */
export function drawNativeFullRedrawRaceLayers(m:Uint8Array,live:Uint8Array,d:number,bp:number,drawWorld:()=>void){
 if(live[d+0xaa46])throw Error('Alternate-screen presentation requires its native buffer host');
 const u=(n:number)=>n&65535;
 for(const [at,length] of [[0x7fe6,8],[0x897c,1],[0x8998,1],[0x9ab6,1],[0x9ac0,2],[0x9fe6,2],[0xaa46,1],[0xaae6,1],[0xa7d2,2],[0xa7da,4],[0xa42a,1],[0xa3c2,1],[0x90f8,1],[0x73b2,2],[0x73d6,2],[0x31e9,1],[0x5524,9],[0x8fd8,2],[0xa034,2],[bp-0x16,0x16]])m.set(live.subarray(d+at,d+at+length),d+at);
 restoreOriginalVideoWindow(m);
 const raster=createOriginalCockpitRasterHost(()=>m,{selectBackBuffer(){m[d+0x131]=0;},selectFrontBuffer(){m[d+0x131]=1;},selectDirectScreen(){throw Error('Unexpected alternate screen');}});
 drawOriginalRacePresentation({...raster,
  cockpit(mode,framePointer){if(mode===1)drawOriginalCockpitBase(raster,d);else updateOriginalCockpitFrame(raster,d,framePointer);},
  replay(mode,first,last){if(mode===1)drawOriginalReplayBarMemory(m,d,first,last);},
  world(){drawWorld();drawOriginalViewCrash(m,d,0x7fe6,u(bp-0x22));drawOriginalWorldStatus(m,d,u(bp-0x22));},
  combineRectangles(first,second,destination){combineOriginalRectangles(m,d,first,second,destination);},
  present(){restoreOriginalVideoWindow(m);},swapScreen(){throw Error('Unexpected alternate-screen swap');},
 },d,bp);
 for(const at of [0x9ab6,0x31e9])live[d+at]=m[d+at];
}
