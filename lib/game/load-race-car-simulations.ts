import {loadNativeOpponentPreparation} from './load-opponent-preparation.ts';
import {loadCompleteNativeGameResource} from './load-complete-game-resource.ts';
import type {NativeRawResourceHost} from './load-raw-resource.ts';
import {initializeOriginalCarResource} from './initialize-car-resource.ts';
import {freeResource} from './free-resource.ts';
export interface RaceCarSimulationHost extends NativeRawResourceHost {
 retry():Promise<number>;
 progress(stage:number):void;
 prepareOpponent?(framePointer:number):void|Promise<void>;
}
/** Original15468..1550e: load, initialize and cache each car's resource bank.
 * Shape allocation precedes this block and supplies the owner table pointers. */
export async function loadNativeRaceCarSimulations(host:RaceCarSimulationHost,d:number,callerFramePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 const initialize=async(opponent:boolean)=>{
  for(let i=0;i<4;i++)host.memory()[d+0x147+i]=host.memory()[d+high+(opponent?0x8fc9:0x8fc2)+i];
  const resource=await loadCompleteNativeGameResource(host,d,0x144,(callerFramePointer-0x10)&65535);
  initializeOriginalCarResource(host.memory(),d,resource.offset,resource.segment,opponent,mode);
  const released=freeResource(host.memory(),d,resource.offset,resource.segment);host.writeMemory(released.memory);
  if(released.error)throw Error('Original car-data resource release failed: '+released.error);
 };
 await initialize(false);
 if(host.memory()[d+0x8fc8+high]){await initialize(true);host.progress(4);const opponentFrame=(callerFramePointer-0xe)&65535;if(host.prepareOpponent)await host.prepareOpponent(opponentFrame);else await loadNativeOpponentPreparation(host,d,opponentFrame,mode);}
}
