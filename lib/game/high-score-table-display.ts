import {drawOriginalOutlinedFontDisplay} from './font-outline-display.ts';
import {measureOriginalFont} from './font-raster.ts';
import {originalHighScoreRow} from './high-score-format.ts';
import type {OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
/** Original high-score table with retained physical record order and fonts. */
export function drawOriginalHighScoreTableDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:Pick<OriginalMenuButtonDisplayHost,'text'>,resources:Record<string,ReadonlyArray<number>>,name:string,file:ReadonlyArray<number>,order:ReadonlyArray<number>,selected:number,smallFontSegment:number,scratch:number){
 if(file.length!==364||order.length!==7||order.some(index=>index<0||index>6||!Number.isInteger(index)))throw Error('Original score table requires seven retained records and indices');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true),normal=word(0x4dd2),text=(bytes:ReadonlyArray<number>)=>String.fromCharCode(...bytes).split('\0')[0],heading=text(resources.ehs1)+" '"+name+"'",font=normal*16;
 drawOriginalOutlinedFontDisplay(memory,d,mode,host,heading,Math.trunc((320-measureOriginalFont(memory.subarray(font,font+65536),Array.from(heading,c=>c.charCodeAt(0))))/2),5,word(0x4e8a),0,scratch);
 const columns=[16,120,224,272];for(const [i,key] of ['ehs2','ehs3','ehs5','ehs4'].entries())drawOriginalOutlinedFontDisplay(memory,d,mode,host,text(resources[key]),columns[i],15,word(0x4e8a),0,scratch);
 v.setUint16(d+0x4dd2,smallFontSegment,true);const small=smallFontSegment*16;
 for(let row=0;row<7;row++){
  const record=originalHighScoreRow(file.slice(order[row]*52,order[row]*52+52));v.setUint16(small,(row===(selected&255)?word(0x4ec2):0)&(mode==='cga'?3:15),true);v.setUint16(small+2,0,true);
  for(const [column,bytes] of record.fields.entries()){memory.set([...Array.from(text(bytes),c=>c.charCodeAt(0)),0],d+scratch);host.text(scratch,columns[column],25+row*10,false);}
 }
 v.setUint16(d+0x4dd2,normal,true);
}
