import {drawOriginalFont} from './font-raster.ts';
import {drawOriginalMenuButton} from './menu-button-raster.ts';
import {initializeCar} from '../physics/initialize-car.ts';
import {readCarEngine} from '../physics/reference-state.ts';
import {stepEngine,type EngineTuning} from '../physics/engine.ts';
export function originalCarAccelerationGraph(tuning:EngineTuning,simulation:Uint8Array){
 let engine=readCarEngine(initializeCar(new Uint8Array(0xb8),simulation,1,[0,0,0],0));const points:{x:number;y:number}[]=[],speeds:number[]=[];
 for(let i=0;i<800;i++){
  engine=stepEngine(engine,tuning,1);speeds.push(engine.speed);
  const y=181-Math.trunc((engine.speed>>>8)*64/150);if(y<117)break;
  points.push({x:28+Math.trunc(38*i/800),y});
 }
 return {points,speeds};
}
export const originalCarMenuBounds=Array.from({length:5},(_,i)=>({left:229,right:316,top:107+i*18,bottom:124+i*18}));
/** Supplied47d6..4b62 lower panel. Top rotating model is a separate pass. */
export function drawOriginalCarMenuPanel(target:Uint8Array,font:Uint8Array,smallFont:Uint8Array,art:Record<string,ReadonlyArray<number>>,misc:Record<string,ReadonlyArray<number>>,description:ReadonlyArray<number>,transmission:number,graph:ReadonlyArray<{x:number;y:number}>){
 const button=(label:ReadonlyArray<number>|null,x:number,y:number,width:number,height:number)=>drawOriginalMenuButton(target,font,label,x,y,width,height,15,8,7,0);
 button(null,0,103,320,97);button(null,5,109,70,85);button(null,82,109,140,85);
 const bytes=art.grap,word=(o:number)=>bytes[o]|bytes[o+1]<<8;
 for(let y=0;y<word(2);y++)for(let x=0;x<word(0);x++)target[((word(10)+y)*320+word(8)+x)&65535]=bytes[16+y*word(0)+x];
 const rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 for(const [text,x,y] of [['150',9,115],['100',9,135],[' 50',9,155],['  0',9,175],['0  20  40',26,185]] as const)drawOriginalFont(target,smallFont,text,x,y,0,rows);
 for(const [i,name] of ['ebdo','ebnx','ebla',transmission?'ebau':'ebma','ebco'].entries())button(misc[name],originalCarMenuBounds[i].left+1,originalCarMenuBounds[i].top+1,86,16);
 for(const point of graph)target[(point.y*320+point.x)&65535]=1;
 let line:number[]=[],y=116;
 for(const code of description){if(!code)break;if(code===93){if(line.length)drawOriginalFont(target,smallFont,String.fromCharCode(...line),88,y,0,rows);line=[];y+=8;}else line.push(code);}
}
