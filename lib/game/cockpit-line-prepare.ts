/** Original line preparation for endpoints inside the instrument panel.
 * Small slopes use the original table's truncation; larger ones round with
 * exact half ties downward. General clipping remains a separate path.
 */
export function prepareCockpitLine(x0:number,y0:number,x1:number,y1:number,color:number,width:number,height:number){
 for(const [x,y] of [[x0,y0],[x1,y1]])if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=width||y<0||y>=height)throw Error('Cockpit line requires original clipping');
 if(y0>y1){[x0,x1]=[x1,x0];[y0,y1]=[y1,y0];}
 const dx=x1-x0,dy=y1-y0,major=Math.max(Math.abs(dx),dy),minor=Math.min(Math.abs(dx),dy);
 let kind:number;
 if(dy===0){kind=dx===0?9:dx<0?0:1;if(dx<0)[x0,x1]=[x1,x0];}
 else if(dx===0)kind=2;
 else if(Math.abs(dx)===dy)kind=dx<0?3:4;
 else if(Math.abs(dx)<dy)kind=dx<0?5:6;
 else kind=dx<0?7:8;
 const numerator=minor*65536;let step=major?Math.floor(numerator/major):0;
 if(major>=50&&numerator%major>Math.floor(major/2))step++;
 const record=new Uint8Array(28),v=new DataView(record.buffer);
 v.setInt32(0,x0*65536,true);v.setInt32(4,y0*65536,true);v.setInt16(8,x1,true);v.setInt16(10,y1,true);
 v.setUint16(12,step,true);v.setUint16(14,major+1,true);v.setUint16(16,color,true);v.setUint16(18,kind,true);
 return record;
}
