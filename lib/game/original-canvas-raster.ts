import {presentationWheelContours} from './presentation-wheel.ts';
import type {OriginalRasterCall} from './drain-primitive-queue.ts';
import {originalPolygonEdgePlan} from './original-polygon-edge-plan.ts';
import {originalCirclePlan} from './original-circle-plan.ts';
import {originalLargeEllipseContour} from './original-large-ellipse-contour.ts';
import {originalWheelDrawPlan} from './wheel-draw-plan.ts';

/** Higher-resolution presentation of the original ordered screen primitives.
 * This is a presentation adapter, not the original pixel rasterizer. Original
 * visibility, geometry, material selection and order are resolved upstream.
 * Keep the indexed rasterizer as the executable comparison authority.
 */
export function createOriginalCanvasRaster(memory:Uint8Array,palette:readonly number[],canvas:(width:number,height:number)=>HTMLCanvasElement){
 const colors=Array.from({length:256},(_,i)=>`rgb(${palette[i*3]},${palette[i*3+1]},${palette[i*3+2]})`);
 const patterns=new Map<string,HTMLCanvasElement>();
 const signed=(n:number)=>(n<<16)>>16;
 return {draw(context:CanvasRenderingContext2D,call:OriginalRasterCall,rectangle:readonly number[]){
  const a=call.args;
  const line=(p:readonly number[],color:number)=>{
   context.strokeStyle=colors[color&255];context.lineWidth=1;context.lineCap='square';
   if(p[0]===p[2]&&p[1]===p[3]){context.fillStyle=colors[color&255];context.fillRect(p[0],p[1],1,1);return;}
   context.beginPath();context.moveTo(p[0]+0.5,p[1]+0.5);context.lineTo(p[2]+0.5,p[3]+0.5);context.stroke();
  };
  const polygon=(points:readonly (readonly number[])[],color:number,mask?:number,secondary?:number,presentation?:readonly (readonly number[])[])=>{
   const plan=originalPolygonEdgePlan(points,rectangle,color);
   if(!plan.length)return;
   if(!presentation&&plan[0].type==='line'){line(plan[0].coordinates,color);return;}
   // The source can traverse edges without producing any fill rows.
   if(!presentation&&!plan.some(event=>event.type==='fill'))return;
   points=presentation??points;
   context.fillStyle=colors[color&255];
   if(mask!==undefined){
    const key=`${mask&65535}/${color&255}/${secondary===undefined?'transparent':secondary&255}`;
    let tile=patterns.get(key);
    if(!tile){
     tile=canvas(8,2);const c=tile.getContext('2d');if(!c)throw Error('Original material canvas unavailable');
     for(let y=0;y<2;y++)for(let x=0;x<8;x++){
      const bit=(((y&1)?mask&255:mask>>>8)&(128>>>x))!==0;
      const ink=secondary===undefined?(bit?color:undefined):(bit?secondary:color);
      if(ink!==undefined){c.fillStyle=colors[ink&255];c.fillRect(x,y,1,1);}
     }
     patterns.set(key,tile);
    }
    const pattern=context.createPattern(tile,'repeat');if(!pattern)throw Error('Original material pattern unavailable');context.fillStyle=pattern;
   }
   context.beginPath();context.moveTo(points[0][0],points[0][1]);
   for(let i=1;i<points.length;i++)context.lineTo(points[i][0],points[i][1]);
   context.closePath();context.fill();
  };
  switch(call.address){
   case 0x2372a:polygon(call.points!,a[0],undefined,undefined,call.presentationPoints);break;
   case 0x246bc:polygon(call.points!,a[1],a[0],undefined,call.presentationPoints);break;
   case 0x21394:polygon(call.points!,a[1],a[0],a[2],call.presentationPoints);break;
   case 0x21d98:line(a.slice(0,4).map(signed),a[4]);break;
   case 0x2795a:context.fillStyle=colors[a[2]&255];context.fillRect(signed(a[0]),signed(a[1]),1,1);break;
   case 0x28ab2:for(const face of originalWheelDrawPlan(call.presentationPoints??call.points!,a[0],a.slice(1),call.presentationPoints?presentationWheelContours:undefined))polygon(face.points,face.color,undefined,undefined,call.presentationPoints?face.points:undefined);break;
   case 0x24ea8:{
    const plan=originalCirclePlan(memory,0x2d1a0,a[0],a[1],a[2],a[3],rectangle);
    if(plan.type==='ellipse')polygon(originalLargeEllipseContour(plan.points),plan.color);
    else if(plan.type==='point'){context.fillStyle=colors[plan.color&255];context.fillRect(...plan.point as [number,number],1,1);}
    else if(plan.type==='spans'){context.fillStyle=colors[plan.color&255];for(let y=0;y<plan.left.length;y++){const count=signed(plan.right[y]-plan.left[y]+1);if(count>0)context.fillRect(plan.left[y],plan.start+y,count,1);}}
    break;
   }
   default:throw Error(`Unsupported original canvas entry ${call.address.toString(16)}`);
  }
 },dispose(){patterns.clear();}};
}
