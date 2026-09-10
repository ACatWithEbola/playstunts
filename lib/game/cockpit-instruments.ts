import {drawCockpitDigitalPanel} from './cockpit-digital-panel.ts';
import {cockpitInstrumentMode} from './cockpit-instrument-mode.ts';
import {cockpitNeedleLines,cockpitGaugeLine,type CockpitGaugeGeometry} from './cockpit-needle.ts';
import {prepareCockpitLine} from './cockpit-line-prepare.ts';
import {rasterCockpitLine} from './cockpit-line-raster.ts';
import {composeCockpitPanel,composeCockpitPanelMemory,type CockpitPanelLayer} from './cockpit-panel.ts';
export interface CockpitInstrumentAssets {layers:Record<string,CockpitPanelLayer>;speed:CockpitGaugeGeometry;rpm:CockpitGaugeGeometry;digits?:CockpitPanelLayer[]}
export function drawCockpitInstruments(data:CockpitInstrumentAssets,speed:number,rpm:number,wheel:number,originalData?:Uint8Array,digitalLeading?:boolean){
  const base=data.layers.ins2,{width,height}=base;
  let pixels:Uint8Array=new Uint8Array(base.pixels);
  const indices=cockpitInstrumentMode(speed,rpm,data.speed.center[1],data.speed.points.length,data.rpm.points.length);
  const digital=indices.mode===1;
  if(digital){
   if(!data.digits)throw Error('Missing original digital speedometer artwork');
   if(digitalLeading===undefined)throw Error('Digital speedometer requires original retained caller state');
   pixels=drawCockpitDigitalPanel(pixels,width,height,speed,data.speed.points,data.digits,digitalLeading);
  }
  const lines=indices.mode!==0?[cockpitGaugeLine(data.rpm,indices.rpmIndex,15,originalData,0xa66e)]:cockpitNeedleLines(data.speed,data.rpm,indices.speedIndex,indices.rpmIndex,15,originalData);
  for(const line of lines){
   const record=prepareCockpitLine(line[0],line[1],line[2],line[3],line[4],width,height);
   for(const [x,y,color] of rasterCockpitLine(record))pixels[y*width+x]=color;
  }
  if(wheel!==1){const suffix=wheel===0?'1':'3';pixels=composeCockpitPanel(pixels,width,height,data.layers['inm'+suffix],data.layers['ins'+suffix]);}
  return pixels;
}

/** Full original destination segment for overlays whose authored coordinates
 * extend beyond the visible panel. The caller must supply retained scanlines;
 * do not invent clipping or move those sprites into the visible rectangle.
 */
export function drawCockpitInstrumentsMemory(data:CockpitInstrumentAssets,speed:number,rpm:number,wheel:number,before:Uint8Array,rowOffsets:Uint16Array,originalData?:Uint8Array,digitalLeading?:boolean){
 const {width,height}=data.layers.ins2;
 if(before.length!==65536||rowOffsets.length<height)throw Error('Original cockpit drawing memory is incomplete');
 const panel=drawCockpitInstruments(data,speed,rpm,1,originalData,digitalLeading);
 let memory=new Uint8Array(before);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)memory[(rowOffsets[y]+x)&65535]=panel[y*width+x];
 if(wheel!==1){const suffix=wheel===0?'1':'3';memory=composeCockpitPanelMemory(memory,rowOffsets,data.layers['inm'+suffix],data.layers['ins'+suffix]);}
 const pixels=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels[y*width+x]=memory[(rowOffsets[y]+x)&65535];
 return {memory,pixels};
}
