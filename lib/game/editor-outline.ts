/** Original 0x28e62 outline through clipped XOR rectangles at 0x279aa. */
export function drawEditorOutline(target:Uint8Array,stride:number,left:number,top:number,right:number,bottom:number,color:number,clip={left:0,top:0,right:320,bottom:200}){
 const rectangle=(x:number,y:number,width:number,height:number)=>{
  for(let row=Math.max(y,clip.top);row<Math.min(y+height,clip.bottom);row++)for(let column=Math.max(x,clip.left);column<Math.min(x+width,clip.right);column++)target[row*stride+column]^=color;
 };
 const width=right-left+1,height=bottom-top-1;
 if(width>0){rectangle(left,top,width,1);rectangle(left,bottom,width,1);}
 if(height>0){rectangle(left,top+1,1,height);rectangle(right,top+1,1,height);}
}
