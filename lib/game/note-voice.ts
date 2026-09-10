/** Original note initialization, loaded 0x2aa9c-0x2ab3b. Raw record layout
 * preserves still-undecoded fields while timing/modulation is reconstructed. */
export function initializeNoteVoice(before:Uint8Array,instrument:Uint8Array,timer:Uint8Array,duration:number,owner:number,voice:number,alternate:boolean,timerPointer:number){
 if(before.length!==46||instrument.length<58||timer.length!==72)throw Error('Invalid original note voice data');
 const record=before.slice(),out=new DataView(record.buffer),src=new DataView(instrument.buffer,instrument.byteOffset,instrument.byteLength);
 const word=(offset:number,value:number)=>out.setUint16(offset,value,true);
 record[0]=owner;word(0x2a,timerPointer);record[1]=1;record[0x16]=1;
 word(0x14,src.getUint16(0x1c,true));record[2]=timer[0x24];word(8,0);word(10,0);
 out.setUint32(12,(duration-1)>>>0,true);
 for(const [dest,source] of [[0x18,0x2a],[0x1a,0x2c],[0x24,0x30],[0x1e,0x36],[0x20,0x38]])word(dest,src.getUint16(source,true));
 word(0x1c,0);record[0x26]=instrument[0x34];
 for(const offset of [0x27,0x28,0x22,0x29])record[offset]=0;
 record[0x2c]=alternate?timer[0x47]:voice;
 return record;
}
