import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original EGA295CE solid polygon spans; hardware full bytes omit latch
 * reads, while partial edges read first. Software retains DS561C/561E. */
export function* drawOriginalEgaPolygonSpans(memory:Uint8Array,d:number,leftOffset:number,rightOffset:number,y:number,count:number,colour:number,patterned=false,twoColour=false):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),dw=(at:number)=>memory[d+u(at)]|(memory[d+u(at+1)]<<8),put=(at:number,value:number)=>{memory[d+u(at)]=value&255;memory[d+u(at+1)]=(value>>>8)&255;},hardware=cw(0x9114)===0xa000;
 patterned ||= twoColour;
 const maskBase=twoColour?0x5302:patterned?0x568c:0x5620,leftScratch=twoColour?0x52fe:patterned?0x5688:0x561c,rightScratch=leftScratch+2,swap=(value:number)=>((value&255)<<8)|(value>>>8);
 if(patterned&&!(y&1))put(0x4b20,swap(dw(0x4b20)));
 const spans=(left:number,right:number)=>{const difference=u(right-left);if(s(difference)<0)return [];const width=u(difference+1),index=left&7,first=memory[d+maskBase+index],step=memory[d+maskBase+16+index],remaining=u(width-step),cells:{byte:number;mask:number;full:boolean}[]=[];
  if(s(width)<step)cells.push({byte:0,mask:first&memory[d+maskBase+8+u(remaining+7)],full:false});
  else if(!remaining)cells.push({byte:0,mask:first,full:false});
  else {cells.push({byte:0,mask:first,full:false});for(let i=0;i<(remaining>>>3);i++)cells.push({byte:1+i,mask:255,full:true});if(remaining&7)cells.push({byte:1+(remaining>>>3),mask:memory[d+maskBase+7+(remaining&7)],full:false});}return cells;
 };
 if(hardware){
  yield {kind:'port-word',port:0x3c4,value:0xf02};yield {kind:'port-word',port:0x3ce,value:0x205};
  for(let row=0;row<Math.max(1,s(count));row++){
   const left=dw(leftOffset+row*2),cells=spans(left,dw(rightOffset+row*2)),start=u(cw(cw(0x911c)+(y+row)*2)+(left>>>3));let full=false;
   if(twoColour){
    for(let index=0;index<cells.length;){const cell=cells[index],offset=u(start+cell.byte);
     if(cell.full){const begin=index;while(index<cells.length&&cells[index].full)index++;
      yield {kind:'port-word',port:0x3ce,value:0xff08};
      for(let i=begin;i<index;i++)yield {kind:'write',offset:u(start+cells[i].byte),value:colour&255};
      yield {kind:'port-word',port:0x3ce,value:(memory[d+0x4b20]<<8)|8};
      for(let i=begin;i<index;i++){const at=u(start+cells[i].byte);yield {kind:'read',offset:at};yield {kind:'write',offset:at,value:memory[d+0x4b22]};}
     }else{yield {kind:'port-word',port:0x3ce,value:(cell.mask<<8)|8};yield {kind:'read',offset};yield {kind:'write',offset,value:colour&255};
      yield {kind:'port-word',port:0x3ce,value:((cell.mask&memory[d+0x4b20])<<8)|8};yield {kind:'read',offset};yield {kind:'write',offset,value:memory[d+0x4b22]};index++;}
    }
   }else for(const cell of cells){if(!cell.full||!full)yield {kind:'port-word',port:0x3ce,value:((cell.mask&(patterned?memory[d+0x4b20]:255))<<8)|8};const offset=u(start+cell.byte);if(patterned||!cell.full)yield {kind:'read',offset};yield {kind:'write',offset,value:colour&255};full=cell.full;}
   if(patterned)put(0x4b20,swap(dw(0x4b20)));
  }
  yield {kind:'port-word',port:0x3ce,value:0xff08};yield {kind:'port-word',port:0x3ce,value:5};return;
 }
 for(let pass=0;pass<(twoColour?2:1);pass++){
 if(twoColour&&pass===1)put(0x4b20,~dw(0x4b20));
 const passColour=twoColour&&pass===0?dw(0x4b22):colour,patternScratch=twoColour?0x52fc:0x5686;
 for(let plane=3;plane>=0;plane--){const segment=cw(0x9114+plane*2);if(!segment)continue;put(leftScratch,leftOffset);put(rightScratch,rightOffset);if(patterned)put(patternScratch,passColour&(1<<plane)?dw(0x4b20):~dw(0x4b20));
  for(let row=0;row<Math.max(1,s(count));row++){
   const left=dw(dw(leftScratch)),cells=spans(left,dw(dw(rightScratch))),start=u(cw(cw(0x911c)+(y+row)*2)+(left>>>3));
   for(const cell of cells){const at=(segment*16+u(start+cell.byte))&0xfffff;const pattern=patterned?(passColour&(1<<plane)?memory[d+patternScratch]:(~memory[d+patternScratch])&255):255,mask=cell.mask&pattern;if(passColour&(1<<plane))memory[at]|=mask;else memory[at]&=(~mask&255);}
   put(leftScratch,dw(leftScratch)+2);put(rightScratch,dw(rightScratch)+2);if(patterned)put(patternScratch,swap(dw(patternScratch)));
  }
 }
}
}
