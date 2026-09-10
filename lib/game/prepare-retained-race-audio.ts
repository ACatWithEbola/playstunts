import {allocateCarAudio} from './allocate-car-audio.ts';
import {createRaceAudio,type RaceAudioState} from './race-audio.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
/** Original same-car resource reuse: a resolved descriptor shares its already
 * loaded bank pointers. Retained table bytes are supplied by the caller.
 */
export function prepareRetainedRaceAudio(before:RaceAudioState,resources:LoadedEffectResource[],playerHandle:number,enabled=true,master=127){
 const player=before.cars[playerHandle];
 if(!player)throw Error('Missing original player audio allocation');
 const descriptor=player.slice(28,76);
 if(!descriptor[6])throw Error('Retained startup requires resolved original resources');
 const v=new DataView(descriptor.buffer),offset=v.getUint16(8,true),segment=v.getUint16(10,true);
 const instrument=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment)?.instrument;
 if(!instrument)throw Error('Missing original shared engine instrument');
 const allocated=allocateCarAudio(before,descriptor,instrument);
 const race=createRaceAudio({...before,cars:allocated.cars,timers:allocated.timers,busy:allocated.busy},resources,enabled,master);
 const initialWrites=[...race.start(playerHandle),...race.start(allocated.handle)];
 return {race,initialWrites,opponentHandle:allocated.handle};
}
