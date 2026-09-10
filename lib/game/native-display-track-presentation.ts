import type {prepareNativeDisplayTrackResources} from './native-display-track-resources.ts';
import {drawOriginalTrackMenuDisplay} from './track-menu-display.ts';
import {captureNativeDisplayRegion} from './native-display-region.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import {originalTrackMenuBounds,type NativeTrackMenuHost,type NativeTrackMenuPresentation} from './native-track-runtime.ts';
export function createNativeDisplayTrackPresentation(resources:Awaited<ReturnType<typeof prepareNativeDisplayTrackResources>>,host:Pick<NativeTrackMenuHost,'resources'>,file:NativeTrackMenuPresentation['file']):NativeTrackMenuPresentation{
 const {owner}=resources,{d,mode,drawing}=owner,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],word=(at:number)=>{const m=owner.memory();return m[d+at]|(m[d+at+1]<<8);};
 return {file,async draw(track,score){await resources.draw(track.raw);const m=owner.memory(),normal=word(0x9adc+high);new DataView(m.buffer).setUint16(d+0x4dd2,normal,true);drawOriginalTrackMenuDisplay(m,d,drawing,{labels:['ebmt','ebet','ebmm'].map(key=>host.resources[key]),highScoreHeading:host.resources.ehs0,normalFontSegment:normal,smallFontSegment:word(0x9338+high),textScratch:0xe800},track.name,score);},capture:()=>captureNativeDisplayRegion(owner,{x:0,y:0,width:320,height:200}),outline(selection,colour){restoreOriginalDisplayWindow(owner.memory(),d,mode);const r=originalTrackMenuBounds[selection],pattern=word(colour===14?0x4e90:0x4e8e);drawing.rectangle(r.left,r.top,r.right-r.left+1,1,pattern);drawing.rectangle(r.left,r.bottom,r.right-r.left+1,1,pattern);drawing.rectangle(r.left,r.top,1,r.bottom-r.top+1,pattern);drawing.rectangle(r.right,r.top,1,r.bottom-r.top+1,pattern);}};
}
