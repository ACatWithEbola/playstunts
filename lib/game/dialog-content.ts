import {originalDialogLayout} from './dialog-layout.ts';
/** Supplied 19c4e..19ec0 text/choice parsing. Retains the source's accumulated
 * inline prefix and full-width hit areas when the first three choices align.
 */
export function originalDialogContent(text:ReadonlyArray<number>,measure:(line:ReadonlyArray<number>)=>number,x=-1,y=-1,mode=2){
 const layout=originalDialogLayout(text,measure,x,y),s16=(n:number)=>(n<<16)>>16;
 const lines:{text:number[];x:number;y:number}[]=[],choices:{offset:number;length:number;left:number;right:number;top:number;bottom:number}[]=[];
 const fields:{x:number;y:number}[]=[];
 let offset=0,row=1,line:number[]=[];
 const at=()=>text[offset]&255;
 while(at()&&at()!==91){
  if(at()===93){lines.push({text:[...line],x:layout.x,y:s16(layout.y+row)});line=[];row=s16(row+10);}
  else {if(at()===64&&mode===3)fields.push({x:s16(layout.x+measure(line)),y:s16(layout.y+row)});line.push(at()===64?32:at());}offset++;
 }
 while(at()===91){
  offset++;const start=offset,left=s16(layout.x+measure(line)),top=s16(layout.y+row);line.push(32);
  let length=0,width=0;
  while(at()&&at()!==91){
   if(at()===93){width=s16(measure(line));line=[];row=s16(row+10);}
   else {line.push(at());length=(length+1)&255;}offset++;
  }
  if(width===0)width=s16(measure(line));
  choices.push({offset:start,length,left,right:s16(left+width),top,bottom:s16(top+10)});
 }
 if(choices.length>2&&choices[0].left===choices[1].left&&choices[1].left===choices[2].left)
  for(const choice of choices)choice.right=s16(choice.left+layout.innerWidth);
 return {layout,lines,choices,fields};
}
