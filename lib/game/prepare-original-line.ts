import {reduceOriginalLineOverflow} from './reduce-original-line-overflow.ts';
import {prepareOriginalHorizontalLine} from './prepare-original-horizontal-line.ts';
import {rejectOriginalLine} from './reject-original-line.ts';
import {clipOriginalLineTop} from './clip-original-line-top.ts';
import {clipOriginalLineBottom} from './clip-original-line-bottom.ts';
import {clipOriginalLineLeft} from './clip-original-line-left.ts';
import {clipOriginalLineRight} from './clip-original-line-right.ts';
/** Original line preparation, overflow reduction and clipping, 20B10..212CC. */
export function prepareOriginalLine(x0:number,y0:number,x1:number,y1:number,rectangle:readonly number[],before:Uint8Array){
 const signed=(n:number)=>(n<<16)>>16;[x0,y0,x1,y1]=[x0,y0,x1,y1].map(signed);
 if(y0===y1)return prepareOriginalHorizontalLine(x0,x1,y0,rectangle,before);
 if(y0>y1){[x0,x1]=[x1,x0];[y0,y1]=[y1,y0];}
 let record=before.slice();const v=new DataView(record.buffer,record.byteOffset,record.byteLength),set=(o:number,n:number)=>v.setUint16(o,n,true);
 for(const o of [0,4,20,22,24,26])set(o,0);set(2,x0);set(6,y0);set(8,x1);set(10,y1);set(18,255);
 const [left,right,top,bottom]=rectangle.map(signed),reject=(code:number)=>rejectOriginalLine(record,code,top,bottom);
 let mask=0,dx=0,dy=0,major=0,minor=0;
 while(true){
 x0=v.getInt16(2,true);y0=v.getInt16(6,true);x1=v.getInt16(8,true);y1=v.getInt16(10,true);
 if(y0>=bottom)return reject(8);if(y1<top)return reject(4);
 const first=(y0<top?4:0)|(x0<left?2:0)|(x0>=right?1:0),last=(y1>=bottom?8:0)|(x1<left?2:0)|(x1>=right?1:0);
 if(first&last)return reject(first&last);
 mask=first|last;dx=x1-x0;dy=y1-y0;major=Math.max(Math.abs(dx),dy);minor=Math.min(Math.abs(dx),dy);
 if(dy>32767||dx>32767||dx<=-32768||(major===32767&&dx!==0&&Math.abs(dx)!==dy)){record.set(reduceOriginalLineOverflow(record,rectangle));continue;}
 break;
 }
 let kind:number;
 if(dx===0)kind=2;else if(Math.abs(dx)===dy)kind=dx<0?3:4;else if(Math.abs(dx)<dy)kind=dx<0?5:6;else kind=dx<0?7:8;
 record[18]=kind;set(14,major+1);
 if(kind>=5){const numerator=minor*65536;let step=Math.floor(numerator/major);if(major>=50&&numerator%major>Math.floor(major/2))step++;set(12,step);}
 if(mask&12){
  if(mask&4)record=clipOriginalLineTop(record,top);
  if(mask&8)record=clipOriginalLineBottom(record,bottom);
  const w=new DataView(record.buffer,record.byteOffset,record.byteLength),x=w.getInt16(2,true),rounded=signed(x+(w.getUint16(0,true)>=32768?1:0)),end=w.getInt16(8,true);
  const a=(x<left?2:0)|(rounded>=right?1:0),b=(end<left?2:0)|(end>=right?1:0);
  if(a&b)return reject(a&b);mask=a|b;
 }
 if(mask&2){const clipped=clipOriginalLineLeft(record,left);record=clipped.record;if(clipped.rejection)return reject(clipped.rejection);}
 if(mask&1){const clipped=clipOriginalLineRight(record,right);record=clipped.record;if(clipped.rejection)return reject(clipped.rejection);}
 return {record,result:0};
}
