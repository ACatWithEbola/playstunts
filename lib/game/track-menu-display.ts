import {measureOriginalFont} from './font-raster.ts';
import {originalHighScoreRow} from './high-score-format.ts';
import {drawOriginalMenuButtonDisplay,type OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
export interface OriginalTrackMenuDisplayHost extends OriginalMenuButtonDisplayHost {shadowText(offset:number,x:number,y:number,colour:number,shadow:number):number;}
/** Original3970..3B90 title, best-score row and buttons over the live overview. */
export function drawOriginalTrackMenuDisplay(memory:Uint8Array,d:number,host:OriginalTrackMenuDisplayHost,resources:{labels:readonly (readonly number[])[];highScoreHeading:readonly number[];normalFontSegment:number;smallFontSegment:number;textScratch:number},name:string,score:readonly number[]|null){
 const u=(n:number)=>n&65535,word=(at:number)=>memory[at]|(memory[at+1]<<8),put=(at:number,value:number)=>{memory[at]=value&255;memory[at+1]=(value>>>8)&255;},copy=(bytes:readonly number[])=>{bytes.forEach((value,index)=>{memory[d+u(resources.textScratch+index)]=value;});memory[d+u(resources.textScratch+bytes.length)]=0;};
 const heading=(bytes:readonly number[],y:number)=>{const zero=bytes.indexOf(0),text=zero<0?bytes:bytes.slice(0,zero);copy(text);const font=word(d+0x4dd2)*16,x=Math.trunc((320-measureOriginalFont(memory.subarray(font,font+65536),text))/2);host.shadowText(resources.textScratch,x,y,word(d+0x4e8a),0);};
 heading(Array.from("'"+name+"'",ch=>ch.charCodeAt(0)),6);
 if(score&&(score[50]|score[51]<<8)!==65535){
  heading(resources.highScoreHeading,18);put(d+0x4dd2,resources.smallFontSegment);put(resources.smallFontSegment*16,0);put(resources.smallFontSegment*16+2,0);
  const {fields}=originalHighScoreRow(score);for(const [index,x] of [16,120,224,272].entries()){copy(fields[index]);host.text(resources.textScratch,x,30,false);}put(d+0x4dd2,resources.normalFontSegment);
 }
 for(let index=0;index<3;index++)drawOriginalMenuButtonDisplay(memory,d,host,resources.labels[index],17+index*96,172,94,24,word(d+0x4eb4),word(d+0x4eb6),word(d+0x4eb8),0,resources.textScratch);
}
