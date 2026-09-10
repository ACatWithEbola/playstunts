import {loadNativeRaceCarShapes} from './load-race-car-shapes.ts';
import {loadNativeRaceCarSimulations,type RaceCarSimulationHost} from './load-race-car-simulations.ts';
/** Original1543e..1550e startup prefix. Caller-owned resistance tables must
 * already be allocated; the remaining scene/audio/cockpit startup follows. */
export async function prepareNativeRaceCars(host:RaceCarSimulationHost,d:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode];
 host.memory().fill(0,d+0x933a+high,d+0x933e+high);
 host.progress(2);
 await loadNativeRaceCarShapes(host,d,0x8fc2+high,0x8fc9+high,(framePointer-0x12)&65535,mode);
 await loadNativeRaceCarSimulations(host,d,framePointer,mode);
}
