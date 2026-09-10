import type {NativeCarMenuHost,NativeCarMenuPresentation} from './native-car-runtime.ts';
import type {prepareNativeDisplayCarResources} from './native-display-car-resources.ts';
import {drawOriginalCarMenuDisplay} from './car-menu-display.ts';
import {originalCarAccelerationGraph,originalCarMenuBounds} from './car-menu-raster.ts';
import {drawOriginalMenuButtonDisplay} from './menu-button-display.ts';
import {captureNativeDisplayRegion} from './native-display-region.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
/** Original car controls share native driver drawing and retained button state. */
export function createNativeDisplayCarPresentation(resources:Awaited<ReturnType<typeof prepareNativeDisplayCarResources>>,host:NativeCarMenuHost,portrait:()=>void=()=>{if(host.opponent)throw Error('Original opponent portrait presentation is required');}):NativeCarMenuPresentation{
 const {owner}=resources,{d,mode,drawing}=owner,word=(at:number)=>{const m=owner.memory();return m[d+at]|(m[d+at+1]<<8);},normal=()=>{restoreOriginalDisplayWindow(owner.memory(),d,mode);new DataView(owner.memory().buffer).setUint16(d+0x4dd2,resources.normalFontSegment,true);};
 return {
  async car(id){const model=await resources.car(id);return {...model,render(angle,paint){normal();model.render(angle,paint);}};},
  panel(car,transmission){normal();const simulation=Uint8Array.from(car.rawSimulation.match(/../g)!,byte=>parseInt(byte,16));drawOriginalCarMenuDisplay(owner.memory(),d,mode,drawing,{graphBitmap:resources.graph,labels:['ebdo','ebnx','ebla',transmission?'ebau':'ebma','ebco'].map(key=>host.resources[key]),description:host.descriptions[car.id],smallFontSegment:resources.smallFontSegment,normalFontSegment:resources.normalFontSegment,textScratch:0xe800},originalCarAccelerationGraph(car,simulation).points);},
  portrait,
  captureButtons(){normal();return captureNativeDisplayRegion(owner,{x:224,y:107,width:96,height:90});},
  outline(selection,colour){normal();const r=originalCarMenuBounds[selection],pattern=word(colour===14?0x4e90:0x4e8e);drawing.rectangle(r.left,r.top,r.right-r.left+1,1,pattern);drawing.rectangle(r.left,r.bottom,r.right-r.left+1,1,pattern);drawing.rectangle(r.left,r.top,1,r.bottom-r.top+1,pattern);drawing.rectangle(r.right,r.top,1,r.bottom-r.top+1,pattern);},
  transmission(value){normal();drawOriginalMenuButtonDisplay(owner.memory(),d,drawing,host.resources[value?'ebau':'ebma'],230,162,86,16,word(0x4eb4),word(0x4eb6),word(0x4eb8),0,0xe800);}
 };
}
