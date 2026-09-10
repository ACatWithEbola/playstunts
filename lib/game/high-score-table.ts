import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
import {drawOriginalOutlinedFont} from './font-outline.ts';
import {originalHighScoreRow} from './high-score-format.ts';
/** Original3e62..40a6. File order is caller-owned; DS:a780 can reorder
 * records independently of the highlighted display row (DS:8fea). */
export function drawOriginalHighScoreTable(target:Uint8Array,font:Uint8Array,smallFont:Uint8Array,resources:Record<string,ReadonlyArray<number>>,name:string,file:ReadonlyArray<number>,order:ReadonlyArray<number>,selected:number){
 if(file.length!==364||order.length!==7||order.some(index=>index<0||index>6||!Number.isInteger(index)))throw Error('Original score table requires seven retained records and indices');
 const text=(bytes:ReadonlyArray<number>)=>String.fromCharCode(...bytes).split('\0')[0],rows=Array.from({length:256},(_,i)=>(i*320)&65535),heading=text(resources.ehs1)+" '"+name+"'";
 drawOriginalOutlinedFont(target,font,heading,Math.trunc((320-measureOriginalFont(font,Array.from(heading,c=>c.charCodeAt(0))))/2),5,15,0,rows);
 const columns=[16,120,224,272];for(const [i,key]of ['ehs2','ehs3','ehs5','ehs4'].entries())drawOriginalOutlinedFont(target,font,text(resources[key]),columns[i],15,15,0,rows);
 for(let row=0;row<7;row++){const offset=order[row]*52,record=originalHighScoreRow(file.slice(offset,offset+52)),color=row===(selected&255)?4:0;for(const [column,bytes]of record.fields.entries())drawOriginalFont(target,smallFont,text(bytes),columns[column],25+row*10,color,rows);}
}
