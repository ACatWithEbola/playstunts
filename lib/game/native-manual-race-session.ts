import {createNativeAllocatedSound} from './native-race-sound-device.ts';
import {dispatchRaceFrameSounds} from './race-frame-sounds.ts';
import {prepareNativeAllocatedRace,prepareNativeAllocatedRaceReentry,type NativeSelectedReplay} from './native-allocated-race-preparation.ts';
import {createNativeRaceSession} from './native-race-session.ts';
import type {NativeDemoData,NativeDemoMenuState} from './native-demo-runtime.ts';
/** Fresh race entry with real allocated resources and the original transporter.
 * Uses the opponent route prepared during resource loading, without loading it
 * again after the cockpit/scene banks have changed the allocator state. */
export async function createNativeManualRaceSession(data:NativeDemoData,menu:NativeDemoMenuState&{mouse?:boolean;joystick?:boolean},host:{resetMouse(mode:number):void},progress:(stage:number)=>void=()=>{}){
 const prepared=await prepareNativeAllocatedRace(data,menu,false,progress),d=0x2d1a0,memory=prepared.memory;
 memory[d+0x12c]=Number(!!menu.mouse);memory[d+0x4602]=Number(!!menu.joystick);
 const result=await enterAllocatedManualSession(data,{...prepared,memory},{...host,async key(){throw Error('Fresh race unexpectedly requested replay input');}});
 if(result.entry!=='transporter')throw Error('Fresh race did not enter the original transporter');
 return result;
}
/** Options has already selected/read the recording. Seed its original bank
 * before resource loading, then follow13A3E's playback/fast-forward branch. */
export async function createNativeReplayRaceSession(data:NativeDemoData,menu:NativeDemoMenuState&{mouse?:boolean;joystick?:boolean},recording:NativeSelectedReplay,host:{resetMouse(mode:number):void;key(mode:number):Promise<number>},progress:(stage:number)=>void=()=>{}){
 const prepared=await prepareNativeAllocatedRace(data,menu,false,progress,recording),d=0x2d1a0;
 prepared.memory[d+0x12c]=Number(!!menu.mouse);prepared.memory[d+0x4602]=Number(!!menu.joystick);
 return enterAllocatedManualSession(data,prepared,host);
}
export async function reopenNativeManualRaceSession(data:NativeDemoData,before:Uint8Array,entry:'fresh'|'replay'|'resume',host:{resetMouse(mode:number):void;key(mode:number):Promise<number>},progress:(stage:number)=>void=()=>{}){
 return enterAllocatedManualSession(data,await prepareNativeAllocatedRaceReentry(data,before,entry,progress),host);
}
async function enterAllocatedManualSession(data:NativeDemoData,prepared:Awaited<ReturnType<typeof prepareNativeAllocatedRace>>,host:{resetMouse(mode:number):void;key(mode:number):Promise<number>}){
 const result=createAllocatedManualSession(data,prepared),audio=createNativeAllocatedSound(()=>result.session.state.memory,0x2d1a0,0x39e1,data.soundDevice);
 const entry=await result.session.enterSimulation(host,{entryStackPointer:0xeee2,incomingSI:0,afterStep:frame=>result.initialWrites.push(...dispatchRaceFrameSounds(frame,audio))});return {...result,entry};
}
/** Original162F9 initializer after the caller has loaded/analyzed a replay
 * and refreshed its resources. This path does not seek to the recording end. */
export function createLoadedNativeManualRaceSession(data:NativeDemoData,prepared:Awaited<ReturnType<typeof prepareNativeAllocatedRace>>){
 const result=createAllocatedManualSession(data,prepared);result.session.initializeLoadedReplay();return {...result,entry:'replay' as const};
}
function createAllocatedManualSession(data:NativeDemoData,prepared:Awaited<ReturnType<typeof prepareNativeAllocatedRace>>){
 const d=0x2d1a0,memory=prepared.memory,view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),length=view.getUint16(d+0x8fd8,true),bank=view.getUint16(d+0x9c40,true)+view.getUint16(d+0x9c42,true)*16;
 const car=(at:number)=>{
  const id=String.fromCharCode(...memory.slice(d+at,d+at+4)),tuning=data.cars.find(car=>car.id===id);
  if(!tuning)throw Error('Original car simulation is missing: '+id);
  const simulation=Uint8Array.from(tuning.rawSimulation.match(/../g)!.map(byte=>parseInt(byte,16)));return {tuning,simulation};
 };
 const player=car(0x8fc2),opponentSelected=memory[d+0x8fc8],opponent=opponentSelected?car(0x8fc9):{...player};
 // Resource initialization owns these records, including the retained inactive
 // opponent. Loading another player car must not replace that unused record.
 player.simulation=memory.slice(d+0xa46a,d+0xa46a+776);
 opponent.simulation=memory.slice(d+0x9c52,d+0x9c52+776);
 if(opponentSelected&&!prepared.opponentPath)throw Error('Original opponent did not find a driving route');
 const session=createNativeRaceSession({...data,...player,opponent,startup:memory,raw:prepared.raw,packedOpponent:new Uint8Array()}, {opponentSelected,preparedOpponentPath:prepared.opponentPath??undefined,replayInputs:length?memory.slice(bank,bank+length):undefined,deferSimulationEntry:true,produceAudio:true,preparedSimulationMemory:true,preparedTrackMemory:true});
 return {session,initialWrites:prepared.initialWrites,raw:prepared.raw,trackAddress:prepared.trackAddress,opponentPath:prepared.opponentPath};
}
