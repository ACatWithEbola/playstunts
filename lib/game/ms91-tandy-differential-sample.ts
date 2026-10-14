/** TD15 MS1991:0AE4..0B31, ordinary in-buffer nibble decode only.
 * End-of-buffer reload, IRQ chaining and hardware scheduling belong to the host.
 */
export interface Ms91TandyDifferentialState {phase:number;packed:number;accumulator:number;lastOutput:number}
const deltas=[222,235,243,248,251,253,254,255,0,1,2,3,5,8,13,21] as const;
export function stepMs91TandyDifferentialSample(before:Ms91TandyDifferentialState,nextByte?:number){
 for(const value of Object.values(before))if(!Number.isInteger(value)||value<0||value>255)throw Error('Invalid TD15 differential state byte');
 const phase=before.phase^255;
 if(phase&&(!Number.isInteger(nextByte)||nextByte!<0||nextByte!>255))throw Error('TD15 differential decoder requires an explicit sample byte');
 const packed=phase?nextByte!:before.packed,nibble=phase?packed>>>4:packed&15;
 const accumulator=(before.accumulator+deltas[nibble])&255;
 const writes=accumulator===before.lastOutput?[]:[[0xc5,accumulator]];
 return {state:{phase,packed,accumulator,lastOutput:accumulator},consumed:phase?1:0,writes};
}
