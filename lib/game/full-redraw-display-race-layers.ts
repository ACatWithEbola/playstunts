import {drawOriginalRacePresentation} from './race-presentation-frame.ts';
import {drawOriginalCockpitBase} from './cockpit-base-frame.ts';
import {updateOriginalCockpitFrame} from './cockpit-frame.ts';
import {createOriginalCockpitDisplayHost,type OriginalCockpitDisplayDrawingHost} from './cockpit-display-host.ts';
import {drawOriginalViewCrashDisplay,drawOriginalWorldStatusDisplay,type OriginalRaceOverlayDrawingHost} from './race-overlay-display.ts';
import type {OriginalRaceStatusDrawingHost} from './race-status-overlay.ts';
import {drawOriginalReplayBarDisplay,type OriginalReplayBarDisplayHost} from './replay-bar-display.ts';
import {combineOriginalRectangles} from './combine-rectangles.ts';
import {COCKPIT_DISPLAY_LAYOUTS} from './cockpit-display-layout.ts';
import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
export type OriginalFullRedrawDisplayHost=OriginalCockpitDisplayDrawingHost&OriginalRaceOverlayDrawingHost&OriginalRaceStatusDrawingHost&Pick<OriginalReplayBarDisplayHost,'text'>;
/** Full-redraw native layer composition over one caller-owned display window.
 * Viewport and game-state transfer happen before this call. The world callback
 * renders the real scene into this same destination; this owns no resources. */
export function drawOriginalFullRedrawDisplayRaceLayers(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',drawing:OriginalFullRedrawDisplayHost,bp:number,screen:{offset:number;segment:number},drawWorld:()=>void){
 const a=WORLD_DISPLAY_LAYOUTS[mode].address,cockpitAddress=COCKPIT_DISPLAY_LAYOUTS[mode],u=(n:number)=>n&65535;
 if(memory[d+a(0xaa46)])throw Error('Alternate-screen presentation requires its buffer-swapping owner');
 drawing.selectWindow(screen);
 const screens={selectBackBuffer(){memory[d+0x131]=0;},selectFrontBuffer(){memory[d+0x131]=1;},selectDirectScreen(){drawing.selectWindow(screen);}};
 const cockpit=createOriginalCockpitDisplayHost(()=>memory,d,mode,drawing,screens);
 drawOriginalRacePresentation({...cockpit,
  cockpit(action,framePointer){if(action===1)drawOriginalCockpitBase(cockpit,d,cockpitAddress);else updateOriginalCockpitFrame(cockpit,d,framePointer,cockpitAddress);},
  replay(action,first,last){if(action===1)drawOriginalReplayBarDisplay(memory,d,mode,{...drawing,...screens},first,last);},
  world(){drawWorld();drawOriginalViewCrashDisplay(memory,d,mode,drawing,a(0x7fe6),u(bp-0x22));drawOriginalWorldStatusDisplay(memory,d,mode,drawing,u(bp-0x22));},
  combineRectangles(first,second,destination){combineOriginalRectangles(memory,d,first,second,destination,a);},
  present(){drawing.selectWindow(screen);},swapScreen(){throw Error('Unexpected alternate-screen swap');},
 },d,bp,a);
}
