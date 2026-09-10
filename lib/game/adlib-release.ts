/** Original melodic driver release (0x1d3) and forced silence (0x1f7). */
function operator(channel:number){
 if(!Number.isInteger(channel)||channel<0||channel>8)throw Error('Invalid AdLib melodic channel');
 return [0,1,2,8,9,10,16,17,18][channel];
}
export function adlibRelease(channel:number,storedPitch:number):number[][]{
 operator(channel);
 // Original writes the complete stored high byte; it does not mask bit 5.
 return [[0xb0+channel,(storedPitch>>>8)&255]];
}
export function adlibSilence(channel:number):number[][]{
 const offset=operator(channel);return [[0x40+offset,63],[0x43+offset,63]];
}
/** Entry 0x1e / helper 0x4da, used when an effect ends. */
export function adlibReset(channel:number):number[][]{
 const offset=operator(channel);
 return [...adlibSilence(channel),[0x80+offset,10],[0x83+offset,10],[0xb0+channel,1]];
}
