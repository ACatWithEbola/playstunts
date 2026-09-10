import {preparePlayerAudioResources} from './prepare-player-audio-resources.ts';
import {prepareRetainedRaceAudio} from './prepare-retained-race-audio.ts';
import type {PlayerAudioSeed} from './player-audio.ts';
/** Current native Countach opponent preview, using original retained startup
 * bytes. This is not a replacement for the game's full cold driver startup.
 */
export function prepareNativeRaceAudio(seed:PlayerAudioSeed,cars:readonly number[][],bank:Uint8Array,voices:Uint8Array){
 const loaded=preparePlayerAudioResources(seed,bank,voices);
 const resources=Object.values(loaded.resources).map(r=>({...r,header:Uint8Array.from(r.header),sequence:Uint8Array.from(r.sequence),instrument:Uint8Array.from(r.instrument)}));
 resources.push({headerOffset:0,headerSegment:0,header:new Uint8Array(),sequenceOffset:0,sequenceSegment:0,sequence:new Uint8Array(),instrumentOffset:loaded.engine.offset,instrumentSegment:loaded.engine.segment,instrument:Uint8Array.from(loaded.engine.instrument)});
 const before={cars:cars.map(c=>Uint8Array.from(c)),command:Uint8Array.from(loaded.command),timers:loaded.timers.map(t=>Uint8Array.from(t)),voices:loaded.voices.map(v=>Uint8Array.from(v)),lastNotes:Uint8Array.from(loaded.lastNotes),markers:Uint8Array.from(loaded.markers),busy:loaded.busy.slice(),velocities:loaded.velocities.slice(),driverSegment:loaded.driverSegment,carCounter:loaded.carCounter,soundFlags:cars.map(()=>0)};
 return prepareRetainedRaceAudio(before,resources,0,loaded.enabled,loaded.master);
}
