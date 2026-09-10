import {readCarEngine,readCarGrip,readCarSuspension} from '../physics/reference-state.ts';
import type {LevelState} from '../physics/level-step.ts';
import type {Vector} from '../physics/math.ts';
/** Decode the opponent's persistent car, route target and shared target-speed byte. */
export function readOpponentCarState(bytes:Uint8Array,side:number){
 if(bytes.length!==184)throw Error('Expected the original opponent car structure');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),vector=(at:number)=>[0,1,2].map(i=>v.getInt16(at+i*2,true)) as Vector;
 const car:LevelState={pose:{position:[0,1,2].map(i=>v.getInt32(i*4,true)) as Vector,rotation:vector(24)},engine:readCarEngine(bytes),grip:readCarGrip(bytes),suspension:readCarSuspension(bytes),wheelPositions:Array.from({length:4},(_,i)=>vector(0x74+i*6))};
 return {car,route:{routeIndex:v.getUint16(0x4a,true),point:bytes[0xb6],completed:bytes[0xb5]},routeTarget:{midpoint:vector(0x8c),first:vector(0x92),second:vector(0x98),side:side&255},targetAlternate:v.getUint16(0x9e,true),angle:v.getUint16(0x48,true),contact:bytes[0xb0]};
}
export function readOpponentRaceState(memory:Uint8Array,dataSegment:number){
 if(dataSegment<0||dataSegment+65536>memory.length)throw Error('Original data segment is outside memory');
 return readOpponentCarState(memory.subarray(dataSegment+0x8cf0,dataSegment+0x8da8),memory[dataSegment+0x8eaf]);
}
