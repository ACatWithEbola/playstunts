import {adlibOperatorControl} from './adlib-operator-control.ts';
/** AD15.DRV 0x2aa update for the recovered engine instruments. */
const frequencies=[76, 81, 86, 91, 96, 102, 108, 114, 121, 128, 136, 144, 153, 162, 171, 182];
const signed=(n:number)=>(n<<16)>>16;
function pitch(note:number,transpose=0){const index=(((note%12+transpose)&255)<<24)>>24;if(index< -2||index>13)throw Error('Unreconstructed AdLib transposition lookup');return (frequencies[index+2]|((Math.trunc(note/12)<<10)&65535))&65535;}
export function adlibUpdate(record:Uint8Array,timer:Uint8Array,instrument:number[],channel:number){
 if(channel<0||channel>8||!Number.isInteger(channel))throw Error('Invalid AdLib channel');
 const r=record.slice(),v=new DataView(r.buffer),t=new DataView(timer.buffer,timer.byteOffset,timer.byteLength);
 if(!r[1])return {record:r,writes:[] as number[][]};
 let value=v.getUint16(4,true);
 if(instrument[53]===145)value=pitch((r[3]+r[34])&255);
 if(instrument[40]===144)value=(value+v.getUint16(28,true))&65535;
 if(instrument[25]===144)value=(value+v.getUint16(20,true))&65535;
 const bend=t.getInt16(38,true);
 if(bend>0){const delta=signed(pitch(r[3],instrument[18])-value);value=(value+((delta*bend)>>13))&65535;}
 else if(bend<0){const delta=signed(-signed(pitch(r[3],-instrument[18])-value));value=(value-((delta*signed(-bend))>>13))&65535;}
 value=(value+((instrument[17]<<24)>>24))&65535;v.setUint16(6,value,true);
 return {record:r,writes:[[160+channel,value&255],[176+channel,(((2-r[1])<<5)|(value>>>8))&255],...adlibOperatorControl(instrument,channel,instrument[0x35],r[0x22]),...adlibOperatorControl(instrument,channel,instrument[0x28],v.getUint16(0x1c,true)),...adlibOperatorControl(instrument,channel,instrument[0x19],v.getUint16(0x14,true))]};
}
