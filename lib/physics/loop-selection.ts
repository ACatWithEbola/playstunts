import {i16,type Vector} from './math.ts';
import type {ElevatedSelection} from './elevated-track.ts';
/** Supplied loop branch 0x110a4-0x112f2, in canonical tile coordinates. */
export function loopSelection(point:Vector,roadSurface:number):ElevatedSelection{
 const [rawX,y,rawZ]=point,x=rawZ<0?i16(-rawX):rawX,z=rawZ<0?i16(-rawZ):rawZ;
 const out:ElevatedSelection={planeGroup:0,surface:4,wall:-1,wallRotation:0,wallLower:-1000,wallUpper:-12,underside:true};
 const arc=[0,224,389,449,389,224,0],edge=[-400,-400,-352,-304,-270,-235,-200];
 const choose=(section:number)=>{out.planeGroup=(rawZ<0?51:45)+section;out.surface=roadSurface;out.underside=false;return out;};
 const interpolate=(a:number,b:number,from:number,to:number,value:number)=>i16(a+Math.trunc(Math.imul(i16(b-a),i16(value-from))/i16(to-from)));
 if(z<=549){
  const sample=Math.min(z,448);let section=0;
  while(arc[section+1]<sample)section++;
  const upper=y>524;
  if(upper)section=5-section;
  if(upper || section<=1 || y>=100){
   const left=edge[section],next=edge[section+1];
   if(x>=left&&x<=next+400){
    if(x>next&&x<left+400)return choose(section);
    if(upper||left!==next){
     const boundary=interpolate(left,next,arc[section],arc[section+1],sample);
     if(x>boundary&&x<boundary+400)return choose(section);
    }
   }
  }
  if(upper)return out;
 }
 const distances=[0,178,360,536,704,868,2000],left=[0,-20,-40,-60,-80,-100,-120],right=[400,361,320,276,226,174,120];
 let section=0;while(section<5&&distances[section+1]<z)section++;
 if(z>2000)throw Error('Loop coordinate outside original piece bounds');
 const low=interpolate(left[section],left[section+1],distances[section],distances[section+1],z);
 const high=interpolate(right[section],right[section+1],distances[section],distances[section+1],z);
 if(x>=low&&x<=high)out.surface=roadSurface;
 return out;
}
