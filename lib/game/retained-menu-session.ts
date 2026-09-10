import {readRetainedMenuClock,writeRetainedMenuClock,type RetainedMenuClock} from './retained-menu-clock.ts';
/** Globals retained across Main2CC0..2D07's menu restore. These are session
 * values, not race-resource pointers or a replacement copy of the data bank. */
export interface RetainedMenuSession {randomSeed:number;evaluation:number[];scoreName:number[];replayName:number[];clock:RetainedMenuClock;lastInputCounter:number}
export function readRetainedMenuSession(memory:Uint8Array,d:number):RetainedMenuSession{
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return {lastInputCounter:view.getUint32(d+0x4dcc,true),clock:readRetainedMenuClock(memory,d),replayName:Array.from(memory.subarray(d+0xea,d+0xf3)),randomSeed:view.getUint32(d+0x38a2,true),evaluation:Array.from(memory.subarray(d+0x53f4,d+0x5400)),scoreName:Array.from(memory.subarray(d+0x9ff2,d+0xa003))};
}
export function writeRetainedMenuSession(memory:Uint8Array,d:number,state:RetainedMenuSession){
 if(state.evaluation.length!==12||state.scoreName.length!==17||state.replayName.length!==9)throw Error('Original menu session has invalid retained field lengths');
 new DataView(memory.buffer,memory.byteOffset,memory.byteLength).setUint32(d+0x38a2,state.randomSeed>>>0,true);
 writeRetainedMenuClock(memory,d,state.clock);
 new DataView(memory.buffer,memory.byteOffset,memory.byteLength).setUint32(d+0x4dcc,state.lastInputCounter,true);
 memory.set(state.replayName,d+0xea);memory.set(state.evaluation,d+0x53f4);memory.set(state.scoreName,d+0x9ff2);
}
