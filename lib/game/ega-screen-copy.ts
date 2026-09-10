import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original EGA2B60C page copy. Aligned copies use the aperture latches;
 * shifted copies visit planes3..0 and retain the final plane selection. */
export function* copyOriginalEgaDisplayScreen(memory:Uint8Array,d:number,x:number,y:number,width:number,height:number,shift:number):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8),page=memory[d+0x5638]|(memory[d+0x5639]<<8),descriptor=cw(0xc0b6+page*4),byteX=u(x)>>>3,bytes=u(width)>>>3,stride=cw(0x9126),bits=u(shift)&7;
 let from=u(cw(cw(descriptor+10)+u(y)*2)+byteX),to=u(cw(cw(0x911c)+u(y)*2)+byteX+(s(shift)>>3));
 if(!bits){
  yield {kind:'port-word',port:0x3c4,value:0xf02};yield {kind:'port-word',port:0x3ce,value:0x105};
  for(let row=0;row<Math.max(1,s(height));row++){
   for(let col=0;col<bytes;col++){const value=yield {kind:'read',offset:from};yield {kind:'write',offset:to,value};from=u(from+1);to=u(to+1);}
   from=u(from+stride-bytes);to=u(to+stride-bytes);
  }
  yield {kind:'port-word',port:0x3ce,value:5};return;
 }
 for(let row=0;row<Math.max(1,s(height));row++){
  for(let plane=3;plane>=0;plane--){
   yield {kind:'port-word',port:0x3c4,value:((1<<plane)<<8)|2};yield {kind:'port-word',port:0x3ce,value:(plane<<8)|4};
   let carry=((yield {kind:'read',offset:from})<<bits)&255;from=u(from+1);
   for(let col=0;col<(bytes||65536);col++){
    const value=yield {kind:'read',offset:from};from=u(from+1);const output=(value>>>(8-bits))|carry;carry=(value<<bits)&255;
    yield {kind:'read',offset:to};yield {kind:'write',offset:to,value:output};to=u(to+1);
   }
   to=u(to-bytes);from=u(from-bytes-1);
  }
  from=u(from+stride);to=u(to+stride);
 }
}
