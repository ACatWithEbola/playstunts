import {initializeRaceShared} from './initialize-race-shared.ts';
import {initializePlayer} from './initialize-player.ts';
/** Original 91c8..9426, with SI=0 as established by the enclosing initializer.
 * Buffer begins at DS:8c06 and includes DS:8f14. Preserve all untouched bytes.
 */
export function initializePlayerRace(before:Uint8Array,tuning:Uint8Array,transmission:number,column:number,row:number,angle:number,hill:0|1){
 if(before.length<0x30f)throw Error('Player race initialization requires the original shared state region');
 const out=initializeRaceShared(before,column,row,angle,hill);
 out.set(initializePlayer(out.subarray(0x32,0x32+0xb8),tuning,transmission,column,row,angle,hill),0x32);
 const view=new DataView(out.buffer,out.byteOffset,out.byteLength),word=(at:number,value:number)=>view.setUint16(at-0x8c06,value,true);
 word(0x8da8,0);
 for(const at of [0x8f13,0x8f14,0x8f11,0x8f12])out[at-0x8c06]=0;
 for(const at of [0x8dac,0x8dae])word(at,column<<24>>24);
 for(const at of [0x8db0,0x8db2])word(at,row<<24>>24);
 return out;
}
