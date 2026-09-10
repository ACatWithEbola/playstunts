import {originalScaledSpriteLayout} from './scaled-sprite-layout.ts';
const u=(n:number)=>n&65535;
/** Original MCGA26610/27D0D anchored transparent scaling, including row stride. */
export function drawOriginalMcgaScaledSprite(memory:Uint8Array,d:number,offset:number,segment:number,scale:number,position:{x:number;y:number},coverage?:Uint8Array){
 const layout=originalScaledSpriteLayout(memory,'mcga',offset,segment,scale,position);if(!layout)return;
 const c=0x209e0,word=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),source=u(segment)*16,dest=word(0x5d96)*16,stride=word(0x5da8);
 let cursor=layout.cursor,fractionY=layout.fractionY,target=u(word(word(0x5d9e)+layout.y*2)+layout.x);
 memory[d+0x52d4]=fractionY;memory[d+0x52d5]=0;
 for(let y=0;y<layout.height;y++){
  let from=cursor,fractionX=layout.fractionX;
  for(let x=0;x<layout.width;x++){
   const value=memory[source+from];if(value!==255){memory[dest+u(target+x)]=value;if(coverage)coverage[(layout.y+y)*320+layout.x+x]=1;}
   fractionX=u(fractionX+layout.step);from=u(from+(fractionX>>>8));fractionX&=255;
  }
  if(y+1<layout.height){target=u(target+stride);fractionY=u(fractionY+layout.step);cursor=u(cursor+(fractionY>>>8)*layout.originalWidth);fractionY&=255;memory[d+0x52d4]=fractionY;}
 }
}
