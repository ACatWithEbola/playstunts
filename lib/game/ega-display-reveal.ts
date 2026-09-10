import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,rotate=(n:number)=>(n>>>1)|((n&1)<<7);
const rowOrder=[11,5,8,2,10,4,7,1,9,3,6,0],masks=[17,136,68,34];
/** Original EGA265DA hardware reveal. Plane records share the rotating mask;
 * the original background entries fall into the source-copy loop after byte1. */
export function* drawOriginalEgaDisplayReveal(memory:Uint8Array,offset:number,segment:number,phase:number,reverse=false):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8);
 if(cw(0x9114)!==0xa000)throw Error('Original EGA reveal requires the selected video aperture');
 const width=word(offset),height=word(offset+2),x=word(offset+8)>>>3,start=u(cw(0x911c)+word(offset+10)*2),end=u(start+height*2),planeSize=u((height&255)*(width&255)+(read(offset+15)>>4)),advance=(width&255)*12,step=reverse?-1:1;
 const records:{plane:number;kind:'copy'|'repeat'|'clear'|'set'}[]=[];let total=0;
 for(let slot=0;slot<4;slot++){
  let mask=read(offset+12+slot)&15;if(!mask)break;total=u(total+planeSize);
  while(mask){const bit=mask&-mask;records.push({plane:31-Math.clz32(bit),kind:mask===bit?'copy':'repeat'});mask&=mask-1;}
  if(records.length>=4)break;
 }
 for(const [mask,kind] of [[read(offset+12)>>4,'clear'],[read(offset+13)>>4,'set']] as const)for(let plane=0;plane<4;plane++)if(mask&(1<<plane))records.push({plane,kind});
 const frame=new Uint16Array(32),put=(at:number,value:number)=>{frame[(at+64)>>1]=u(value);},get=(at:number)=>frame[(at+64)>>1];
 records.forEach((record,index)=>{put(-0x28+index*2,(record.plane<<8)|(1<<record.plane));put(-0x30+index*2,record.kind==='copy'?0x5d62:record.kind==='repeat'?0x5dcb:record.kind==='clear'?0x5d9f:0x5db4);});
 put(-0x20,records.length*2);
 for(let slot=11;slot>=0;slot--){
  let rowPointer=u(start+rowOrder[slot]*2),cursor=u(offset+16+(width&255)*rowOrder[slot]);
  for(let guard=0;rowPointer<end;guard++){
   if(guard===8192)throw Error('Original EGA reveal row traversal does not terminate');
   if(!records.length)throw Error('Original EGA reveal uses an uninitialized plane record');
   const rowTarget=u(cw(rowPointer)+x);let mask=masks[phase&3];
   put(-0x1e,rowTarget);
   for(let entry=0;entry<records.length;entry++){
    const selection=get(-0x28+entry*2),address=get(-0x30+entry*2),kind=address===0x5d62?'copy':address===0x5dcb?'repeat':address===0x5d9f?'clear':address===0x5db4?'set':undefined;
    if(!kind)throw Error('Original EGA reveal stack overwrites its drawing target');
    const record={kind};
    yield {kind:'port-byte',port:0x3c4,value:2};yield {kind:'port-byte',port:0x3c5,value:selection&255};yield {kind:'port-byte',port:0x3ce,value:4};yield {kind:'port-byte',port:0x3cf,value:selection>>>8};
    let target=rowTarget;
    for(let col=0;col<(width||65536);col++){
     let value:number;
     if(col===0&&(record.kind==='clear'||record.kind==='set')){
      const original=yield {kind:'read',offset:target};value=record.kind==='clear'?original&(~mask&255):(original&(~mask&255))|mask;
      if(record.kind==='clear')mask=(~mask)&255;
     }else {const pixel=read(cursor);cursor=u(cursor+step);const original=yield {kind:'read',offset:target};value=(pixel&mask)|(original&(~mask&255));}
     yield {kind:'write',offset:target,value};target=u(target+step);mask=rotate(mask);
    }
    cursor=u(cursor+(record.kind==='copy'?planeSize-width:-width));
   }
   phase=(phase+1)&255;rowPointer=u(rowPointer+24);cursor=u(cursor-u(total-advance));
  }
 }
}
