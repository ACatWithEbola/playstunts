/** Supplied show_dialog prefix 19ab0..19bbe. This version counts only ']'
 * delimiters and uses fixed ten-pixel rows. In particular, an unterminated final
 * line is not measured; '}' is ordinary text, unlike the community locator.
 * Font measurement is supplied separately; this does not render a dialog.
 */
import {uses1991Physics,type PhysicsEngineVersion} from '../physics/engine-version.ts';
export function originalDialogLayout(text:ReadonlyArray<number>,measure:(line:ReadonlyArray<number>)=>number,x=-1,y=-1,physicsEngine?:PhysicsEngineVersion,fontHeight=8){
 const s16=(n:number)=>(n<<16)>>16;
 const modern=uses1991Physics(physicsEngine);
 const rowHeight=modern?s16(fontHeight+2):10;
 let width=32,lineCount=0,contentHeight=0;let line:number[]=[];
 for(const raw of text){const code=raw&255;if(!code)break;
  if(code===93||(modern&&code===125)){width=Math.max(width,s16(measure(line)));line=[];lineCount=s16(lineCount+1);contentHeight=s16(contentHeight+(code===125?4:rowHeight));}else line.push(code);
 }
 width=s16((width+24)&0xfff8);
 if(x===-1)x=s16(Math.trunc(s16(320-width)/2)&0xfff8);
 if(y===-1)y=Math.trunc(s16(200-contentHeight)/2);
 const bounds=[s16(x),s16(x+width),s16(y-8),s16(y+contentHeight+8)];
 return {x:s16(x+8),y:s16(y),innerWidth:s16(width-16),lineCount,bounds,...(modern?{contentHeight}:{})};
}
