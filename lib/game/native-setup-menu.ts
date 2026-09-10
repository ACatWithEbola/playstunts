export interface OriginalSetupMenuHost {
 key():number|Promise<number>;
 drawMenu(descriptor:number,selected:number):void;
 drawEntry(descriptor:number,entry:number,selected:number):void;
 help(pointer:number):void|Promise<void>;
 helpBar(pointer:number):void;
 clear(top:number,left:number,bottom:number,right:number,attribute:number):void;
}
/** Supplied SETUP.EXE1742..18EE after unpacking at segment1000.
 * Menu rows form the original circular doubly linked lists. Presentation,
 * help dismissal and BIOS keyboard delivery are host boundaries. */
export async function runOriginalSetupMenu(memory:Uint8Array,descriptor:number,host:OriginalSetupMenuHost):Promise<number>{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at&65535,true);
 let selected=word(descriptor),result=0,done=false;
 host.drawMenu(descriptor,selected);host.helpBar(word(0x5da));
 while(!done){
  const key=(await host.key())&65535;
  if(key===27){result=-1;break;}
  if(key===0x3b00){await host.help(word(selected+8));host.helpBar(word(0x5da));continue;}
  let activate=key===13;
  if(!activate){
   host.drawEntry(descriptor,selected,0);
   if(key===0x4800)selected=word(selected+16);
   else if(key===0x5000)selected=word(selected+14);
   else{
    const initial=selected,letter=key>=97&&key<=122?key-32:key;
    do{selected=word(selected+14);}while(memory[word(selected+2)]!==(letter&255)&&selected!==initial);
    activate=memory[word(selected+2)]===(letter&255);
   }
   host.drawEntry(descriptor,selected,1);
  }
  if(!activate)continue;
  const child=word(selected+10);
  if(child){
   const choice=await runOriginalSetupMenu(memory,child,host);
   if(choice!==-1){v.setUint16((selected+4)&65535,choice&65535,true);v.setUint16(0xaa12,0,true);}
   host.drawMenu(descriptor,selected);
   if(word(selected+12)!==1)continue;
  }
  result=word(selected)<<16>>16;done=true;
 }
 host.clear(word(descriptor+4),word(descriptor+6),word(descriptor+8),word(descriptor+10),0x70);
 return result;
}
