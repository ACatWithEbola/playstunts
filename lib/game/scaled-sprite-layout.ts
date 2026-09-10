const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Shared original clipped indexed-sprite scaling preparation. */
export function originalScaledSpriteLayout(memory:Uint8Array,mode:'mcga'|'cga'|'tandy'|'ega',offset:number,segment:number,scale:number,position:{x:number;y:number},anchored=true){
 const c=0x209e0,block=mode==='mcga'?0x5d96:mode==='cga'?0x6864:mode==='tandy'?0x63d4:0x9114,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8);
 scale=u(scale);if(scale<2)return;
 let x=u(position.x-(anchored?u((word(offset+4)*scale)>>>8):0)),y=u(position.y-(anchored?u((word(offset+6)*scale)>>>8):0));const phaseX=x;
 const originalWidth=word(offset);let height=u((word(offset+2)*scale)>>>8),width=u((originalWidth*scale)>>>8);if(!height||!width)return;
 const step=Math.floor(65536/scale),half=(step>>>8)>>>1;let cursor=u(offset+16+half+half*originalWidth),fractionX=0,fractionY=0;
 const left=cw(block+24),right=cw(block+26),top=cw(block+14),bottom=cw(block+16);
 if(s(x)<s(left)){const sum=u(x+width),visible=u(sum-left);if(s(sum)<=s(left))return;const product=u(width-visible)*step;fractionX=product&255;cursor=u(cursor+u(product>>>8));width=visible;x=left;}
 let sum=u(x+width),excess=u(sum-right);if(s(sum)>=s(right)){if(s(width)<=s(excess))return;width=u(width-excess);}
 if(s(y)<s(top)){const sum=u(y+height),visible=u(sum-top);if(s(sum)<=s(top))return;const product=u(height-visible)*step;fractionY=product&255;cursor=u(cursor+u(product>>>8)*originalWidth);height=visible;y=top;}
 sum=u(y+height);excess=u(sum-bottom);if(s(sum)>=s(bottom)){if(s(height)<=s(excess))return;height=u(height-excess);}
 return {x,y,phaseX,width,height,originalWidth,cursor,step,fractionX,fractionY,storedY:word(offset+10)};
}
