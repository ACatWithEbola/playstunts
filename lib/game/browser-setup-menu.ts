/** Public browser SETUP omits the DOS installer. The original initialized
 * menus and installation program remain available in the reference check. */
export function adaptBrowserSetupMenu(memory:Uint8Array){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>view.getUint16(at,true),put=(at:number,value:number)=>view.setUint16(at,value,true);
 const descriptor=0x19a,first=word(descriptor);let entry=first;
 do{
  const next=word(entry+14);
  if(word(entry)===5){
   const previous=word(entry+16);
   put(previous+14,next);put(next+16,previous);
   if(first===entry)put(descriptor,next);
   if(word(descriptor+2)===entry)put(descriptor+2,previous);
   put(descriptor+8,word(descriptor+8)-1);
   return;
  }
  entry=next;
 }while(entry!==first);
}
