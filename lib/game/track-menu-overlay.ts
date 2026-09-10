import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
import {drawOriginalMenuButton} from './menu-button-raster.ts';
import {originalHighScoreRow} from './high-score-format.ts';
/** Source3970..3b8f; draw over the current overview without clearing it. */
export function drawOriginalTrackMenuOverlay(target:Uint8Array,font:Uint8Array,smallFont:Uint8Array,resources:Record<string,ReadonlyArray<number>>,name:string,score:ReadonlyArray<number>|null){
 const rows=Array.from({length:256},(_,i)=>(i*320)&65535),label=(bytes:ReadonlyArray<number>)=>String.fromCharCode(...bytes).split('\0')[0];
 const heading=(text:string,y:number)=>{const x=Math.trunc((320-measureOriginalFont(font,Array.from(text,c=>c.charCodeAt(0))))/2);drawOriginalFont(target,font,text,x+1,y+1,0,rows);drawOriginalFont(target,font,text,x,y,15,rows);};
 heading("'"+name+"'",6);
 if(score&&(score[50]|score[51]<<8)!==65535){heading(label(resources.ehs0),18);const {fields}=originalHighScoreRow(score);for(const [i,x]of [16,120,224,272].entries())drawOriginalFont(target,smallFont,label(fields[i]),x,30,0,rows);}
 for(const [i,key]of ['ebmt','ebet','ebmm'].entries())drawOriginalMenuButton(target,font,resources[key],17+i*96,172,94,24,15,8,7,0);
}
