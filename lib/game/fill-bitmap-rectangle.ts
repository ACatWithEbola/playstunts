/** Original253AC/25406 rectangle fills over the active bitmap segment. */
export function fillOriginalBitmapRectangle(m:Uint8Array,x:number,y:number,width:number,height:number,color:number,clipped=false,cs=0x209e0){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16,word=(at:number)=>v.getUint16(cs+u(at),true);
 [x,y,width,height]=[x,y,width,height].map(s);
 if(clipped){let excess=s(word(0x5da0)-x);if(excess>0){x=s(word(0x5da0));width=s(width-excess);if(width<=0)return;}excess=s(x+width-word(0x5da2));if(excess>0){width=s(width-excess);if(width<=0)return;}excess=s(word(0x5da4)-y);if(excess>0){height=s(height-excess);if(height<=0)return;y=s(word(0x5da4));}excess=s(y+height-word(0x5da6));if(excess>0){height=s(height-excess);if(height<=0)return;}}
 if(width<=0||height<=0)return;
 const destination=word(0x5d96)*16,stride=word(0x5da8);let at=u(word(word(0x5d9e)+y*2)+x);
 for(let row=0;row<height;row++){for(let col=0;col<width;col++)m[destination+u(at+col)]=color&255;at=u(at+stride);}
}
/** Original27FF0 uses inclusive horizontal endpoints and excludes the bottom
 * endpoint from each vertical fill; horizontal fills draw both corners. */
export function outlineOriginalBitmapRectangle(m:Uint8Array,left:number,top:number,right:number,bottom:number,color:number,cs=0x209e0){
 const s=(n:number)=>n<<16>>16,width=s(right-left+1),height=s(bottom-top);
 if(width>0){fillOriginalBitmapRectangle(m,left,top,width,1,color,true,cs);fillOriginalBitmapRectangle(m,left,bottom,width,1,color,true,cs);}
 if(height>0){fillOriginalBitmapRectangle(m,left,top,1,height,color,true,cs);fillOriginalBitmapRectangle(m,right,top,1,height,color,true,cs);}
}
