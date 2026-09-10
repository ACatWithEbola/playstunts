/** ROM1.07 4C7B..4C9F: global addresses compare the configured unit ID;
 * addresses below03 use the channel route. Munt's global ID is fixed at10h. */
export function routeMt32UnitPacket(packet:readonly number[],unit:number):number[]|undefined{
 if(!Number.isInteger(unit)||unit<0||unit>31)throw Error('Invalid MT-32 unit ID');
 const bytes=[...packet];
 if(bytes.length<10||bytes[0]!==0xf0||bytes.at(-1)!==0xf7||bytes[1]!==0x41||bytes[3]!==0x16)return bytes;
 // Data writes and requests carry an address. Other handshakes stay with Munt.
 if(bytes[4]!==0x12&&bytes[4]!==0x11)return bytes;
 if(bytes[5]>=3){if(bytes[2]!==unit)return;bytes[2]=0x10;}
 return bytes;
}
/** Rejected packets emit empty framing to cancel MIDI running status in Munt.
 * MIDI framing survives arbitrary driver write boundaries. Real-time bytes
 * are forwarded immediately, without terminating an in-progress SysEx. */
export function createMt32UnitRouter(unit=16){
 let pending:number[]|undefined;
 return {
  get unit(){return unit;},setUnit(value:number){if(!Number.isInteger(value)||value<0||value>31)throw Error('Invalid MT-32 unit ID');unit=value;},
  write(input:readonly number[]){const result:number[]=[];for(const byte of input){
   if(!Number.isInteger(byte)||byte<0||byte>255)throw Error('Invalid MIDI byte');
   if(byte>=0xf8){result.push(byte);continue;}
   if(byte===0xf0){pending=[byte];continue;}
   if(pending){
    if(byte===0xf7){pending.push(byte);const routed=routeMt32UnitPacket(pending,unit);if(routed)result.push(...routed);else result.push(0xf0,0xf7);pending=undefined;}
    else if(byte&0x80){pending=undefined;result.push(byte);}
    else{if(pending.length>=65535){pending=undefined;throw Error('Roland SysEx exceeds capacity');}pending.push(byte);}
   }else result.push(byte);
  }return result;},
 };
}
