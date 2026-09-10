/** Original alternative window bounds. Active-window matching compares the
 * first backing segment, not descriptor identity; packed X uses logical shifts. */
export function setOriginalDisplayWindowBounds(memory:Uint8Array,mode:'cga'|'tandy'|'ega',offset:number,segment:number,left:number,right:number,top:number,bottom:number){
 const c=0x209e0,block=mode==='cga'?0x6864:mode==='tandy'?0x63d4:0x9114,shift=mode==='cga'?2:mode==='tandy'?1:3,base=(segment&65535)*16,u=(n:number)=>n&65535,word=(base:number,at:number)=>memory[(base+u(at))&0xfffff]|(memory[(base+u(at)+1)&0xfffff]<<8),put=(base:number,at:number,value:number)=>{memory[(base+u(at))&0xfffff]=value&255;memory[(base+u(at)+1)&0xfffff]=(value>>>8)&255;},active=word(base,offset+2)===word(c,block);
 for(const [field,activeField,value] of [[26,24,left],[12,10,u(left)>>>shift],[28,26,right],[14,12,u(right)>>>shift],[16,14,top],[18,16,bottom]]){put(base,offset+field,value);if(active)put(c,block+activeField,value);}
}
