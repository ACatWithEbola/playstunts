export interface OriginalSetupTextScreen {cells:Uint16Array;column:number;row:number}
export function createOriginalSetupTextScreen():OriginalSetupTextScreen{return {cells:new Uint16Array(80*25).fill(0x0720),column:0,row:0};}
/** SETUP21FA's BIOS clear window, with the original forced foreground7. */
export function fillOriginalSetupText(screen:OriginalSetupTextScreen,top:number,left:number,bottom:number,right:number,background:number){
 for(let row=top&255;row<=Math.min(bottom&255,24);row++)for(let col=left&255;col<=Math.min(right&255,79);col++)screen.cells[row*80+col]=(((background|7)&255)<<8)|32;
}
/** SETUP2221: tabs advance four columns, LF returns to the initial column,
 * and a final cursor update precedes the terminating NUL check. */
export function writeOriginalSetupText(screen:OriginalSetupTextScreen,text:ArrayLike<number>,column:number,row:number,foreground:number,background:number){
 const initial=column&255,attribute=(foreground|background)&255;column=initial;row&=255;
 for(let i=0;;i++){
  screen.column=column&255;screen.row=row&255;const n=text[i]??0;if(!n)break;
  if(n===9)column+=4;else if(n===10){column=initial;row++;}else{const at=screen.row*80+screen.column;if(at<screen.cells.length)screen.cells[at]=(attribute<<8)|(n&255);column++;}
 }
}
export function drawOriginalSetupBox(screen:OriginalSetupTextScreen,memory:Uint8Array,top:number,left:number,bottom:number,right:number,foreground:number,background:number,style:number){
 fillOriginalSetupText(screen,top+1,left+2,bottom+1,right+2,0);fillOriginalSetupText(screen,top,left,bottom,right,background);
 if(!style)return;if(style!==1&&style!==2)throw Error('Original setup box uses unreconstructed scratch for this style');
 const base=style===1?0x162e:0x163c,span=Math.max(0,right-left-1),line=(start:number,middle:number,end:number)=>[memory[base+start],...Array(span).fill(memory[base+middle]),memory[base+end]];
 writeOriginalSetupText(screen,line(0,6,2),left,top,foreground,background);writeOriginalSetupText(screen,line(12,8,10),left,bottom,foreground,background);
 for(let row=top+1;row<bottom;row++){writeOriginalSetupText(screen,[memory[base+4]],left,row,foreground,background);writeOriginalSetupText(screen,[memory[base+4]],right,row,foreground,background);}
}
export function createOriginalSetupMenuDrawing(screen:OriginalSetupTextScreen,memory:Uint8Array){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at&65535,true),text=(at:number)=>{const result:number[]=[];for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return result;result.push(n);}throw Error('Original setup text has no terminator');};
 const row=(descriptor:number,entry:number,y:number,selected:boolean)=>{
  const left=word(descriptor+6)+2,right=word(descriptor+10)-2,background=word(descriptor+(selected?16:12)),foreground=selected?0:word(descriptor+14);
  fillOriginalSetupText(screen,y,left-1,y,right+1,background);writeOriginalSetupText(screen,text(word(entry+2)),left,y,foreground,background);
  const choice=word(entry+4);if(choice!==65535){const suffix=text(word(word(entry+6)+choice*2));writeOriginalSetupText(screen,suffix,right-suffix.length+1,y,foreground,background);}
 };
 const center=(value:number[],left:number,right:number,row:number,foreground:number,background:number)=>writeOriginalSetupText(screen,value,Math.trunc(((left-value.length+right)<<16>>16)/2),row,foreground,background);
 const clear=(top:number,left:number,bottom:number,right:number,background:number)=>{fillOriginalSetupText(screen,top+1,left+2,bottom+1,right+2,background);fillOriginalSetupText(screen,top,left,bottom,right,background);};
 const helpBar=(pointer:number)=>{fillOriginalSetupText(screen,24,0,24,79,0x30);if(pointer)center(text(pointer),0,79,24,0,0x30);};
 return {
  helpBar,
  async help(pointer:number,key:()=>number|Promise<number>,present:()=>void){
   if(!pointer)return;
   const top=word(pointer+2),left=word(pointer+4),bottom=word(pointer+6),right=word(pointer+8);
   drawOriginalSetupBox(screen,memory,top,left,bottom,right,word(pointer+12),word(pointer+10),1);helpBar(word(0x5dc));
   if(word(pointer))writeOriginalSetupText(screen,text(word(pointer)),left+1,top+1,0x10,15);else center(text(0x161c),left,right,top+1,0x10,15);
   present();await key();clear(top,left,bottom,right,0x70);present();
  },
  drawHeader(){
   drawOriginalSetupBox(screen,memory,1,2,3,75,15,16,0);
   const title=[...text(0x1512),...text(0x46),...text(0x1514)];memory.set([...title,0],0x9936);
   center(title,2,75,1,15,16);center(text(0x1524),2,75,2,15,16);center(text(0x1530),2,75,3,15,16);
  },
  drawMenu(descriptor:number,selected:number){
   drawOriginalSetupBox(screen,memory,word(descriptor+4),word(descriptor+6),word(descriptor+8),word(descriptor+10),word(descriptor+14),word(descriptor+12),1);
   const first=word(descriptor);let entry=first,y=word(descriptor+4)+1;do{row(descriptor,entry,y++,entry===selected);entry=word(entry+14);}while(entry!==first);
  },
  drawEntry(descriptor:number,entry:number,selected:number){let y=word(descriptor+4)+1,current=word(descriptor);while(current!==entry){y++;current=word(current+14);}row(descriptor,entry,y,selected===1);},
  clear
 };
}
