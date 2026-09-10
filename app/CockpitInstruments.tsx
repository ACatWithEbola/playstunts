 'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {cockpitExtensionRgba,type CockpitExtension} from '@/lib/game/cockpit-extension';
import cockpitIndex from '@/public/game/cockpit/index.json';
import {drawCockpitInstruments,type CockpitInstrumentAssets} from '@/lib/game/cockpit-instruments';
import {drawCockpitGear,type CockpitGearAssets} from '@/lib/game/cockpit-gear';
import {cockpitMarker} from '@/lib/game/cockpit-marker';
type Assets=CockpitInstrumentAssets&{extension?:CockpitExtension;palette:number[];gear:CockpitGearAssets;marker:{points:number[][];mask:CockpitGearAssets['mask'];art:CockpitGearAssets['art']}};
type Car=keyof typeof cockpitIndex;
const assetPromises=new Map<Car,Promise<Assets>>();
function assets(car:Car){
 let result=assetPromises.get(car);
 if(!result){result=Promise.all([`/game/cockpit/${car}/panel.json`,'/game/cockpit/gauges.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Unable to load original instruments');return r.json();})).then(([panel,gauges])=>({...panel as Pick<Assets,'palette'|'layers'|'gear'|'marker'>,...(gauges as Record<string,Pick<Assets,'speed'|'rpm'>>)[car]}));assetPromises.set(car,result);}
 return result;
}
export default function CockpitInstruments({car='COUN',speed,rpm,wheel,knobX,knobY,steeringScaled,readGaugeData,gaugeRevision=0}:{car?:Car;speed:number;rpm:number;wheel:number;knobX:number;knobY:number;steeringScaled:number;readGaugeData?:()=>Uint8Array|undefined;gaugeRevision?:number}){
 const dashboardTop=cockpitIndex[car].dashboardTop,dashboardHeight=200-dashboardTop;

 const extensionRef=useRef<HTMLCanvasElement>(null);
 const markerRef=useRef<HTMLCanvasElement>(null);
 const gearRef=useRef<HTMLCanvasElement>(null);
 const ref=useRef<HTMLCanvasElement>(null),[loaded,setLoaded]=useState<{car:Car;data:Assets}>();
 const data=loaded?.car===car?loaded.data:undefined;
 useEffect(()=>{let active=true;assets(car).then(value=>{if(active)setLoaded({car,data:value});}).catch(console.error);return()=>{active=false;};},[car]);
 useEffect(()=>{
  if(!data||!ref.current)return;
  const {width,height}=data.layers.ins2;
  const pixels=drawCockpitInstruments(data,speed,rpm,wheel,readGaugeData?.());
  const context=ref.current.getContext('2d');if(!context)return;
  const image=context.createImageData(width,height);
  for(let i=0;i<pixels.length;i++){const color=pixels[i]*3;image.data.set([data.palette[color],data.palette[color+1],data.palette[color+2],255],i*4);}
  context.putImageData(image,0,0);
 },[data,speed,rpm,wheel,readGaugeData,gaugeRevision]);
 useEffect(()=>{
  if(!data||!gearRef.current)return;
  const context=gearRef.current.getContext('2d');if(!context)return;
  const {width,height}=data.gear.base,pixels=drawCockpitGear(data.gear,knobX,knobY),image=context.createImageData(width,height);
  for(let i=0;i<pixels.length;i++){const color=pixels[i]*3;image.data.set([data.palette[color],data.palette[color+1],data.palette[color+2],255],i*4);}
  context.putImageData(image,0,0);
 },[data,knobX,knobY]);
 useEffect(()=>{
  if(!data||!markerRef.current)return;
  const {art,mask,points}=data.marker,position=cockpitMarker(points,steeringScaled),canvas=markerRef.current;
  canvas.style.left=`${(position.x-art.anchorX)/320*100}%`;
  canvas.style.top=`${(position.y-art.anchorY-dashboardTop)/dashboardHeight*100}%`;
  const context=canvas.getContext('2d');if(!context)return;
  const image=context.createImageData(art.width,art.height);
  for(let i=0;i<art.pixels.length;i++){
   if(mask.pixels[i]===255&&art.pixels[i]===0)continue;
   if(mask.pixels[i]!==0)throw Error('Original marker requires palette composition');
   const color=art.pixels[i]*3;image.data.set([data.palette[color],data.palette[color+1],data.palette[color+2],255],i*4);
  }
  context.putImageData(image,0,0);
 },[data,steeringScaled,dashboardTop,dashboardHeight]);
 useEffect(()=>{
  if(!data?.extension||!extensionRef.current)return;
  const context=extensionRef.current.getContext('2d');if(!context)return;
  const art=data.extension.art,image=context.createImageData(art.width,art.height);
  image.data.set(cockpitExtensionRgba(data.extension,data.palette));context.putImageData(image,0,0);
 },[data]);
 if(!data)return null;
 const placement=(layer:{x:number;y:number;width:number;height:number}):CSSProperties=>({left:`${layer.x/320*100}%`,top:`${(layer.y-dashboardTop)/dashboardHeight*100}%`,width:`${layer.width/320*100}%`,height:`${layer.height/dashboardHeight*100}%`});
 const panel=data.layers.ins2,gear=data.gear.base,marker=data.marker.art;
 return <>{data.extension&&<canvas ref={extensionRef} className="cockpit-extension" width={data.extension.art.width} height={data.extension.art.height} style={placement(data.extension.art)}/>}<canvas ref={ref} className="cockpit-instruments" width={panel.width} height={panel.height} style={placement(panel)}/><canvas ref={gearRef} className="cockpit-gear" width={gear.width} height={gear.height} style={placement(gear)}/><canvas ref={markerRef} className="cockpit-marker" width={marker.width} height={marker.height} style={{width:`${marker.width/320*100}%`,height:`${marker.height/dashboardHeight*100}%`}}/></>;
}
