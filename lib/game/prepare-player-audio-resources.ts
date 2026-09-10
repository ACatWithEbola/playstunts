import {loadCarSoundResources} from './load-car-sound-resources.ts';
import {soundResourceOffset} from './sound-resource.ts';
import type {PlayerAudioSeed} from './player-audio.ts';
const key=(name:string)=>Uint8Array.from(name,c=>c.charCodeAt(0));
/** Replace captured engine and effect bytes with resources loaded from the supplied files.
 * The remaining seed owns driver state and its existing DOS address allocation.
 */
export function preparePlayerAudioResources<T extends PlayerAudioSeed>(seed:T,bank:Uint8Array,voices:Uint8Array):T{
 const container=soundResourceOffset(bank,key('STAR'));
 const header=container===null?null:soundResourceOffset(bank,key('hdr1'),container);
 const instrument=soundResourceOffset(voices,key('STAR'));
 if(header===null||instrument===null||!seed.resources.STAR)throw Error('Missing original sound-bank allocation reference');
 const reference=seed.resources.STAR;
 const voiceAddress={offset:(reference.instrumentOffset-instrument)&65535,segment:reference.instrumentSegment};
 const loaded=loadCarSoundResources(bank,voices,Object.keys(seed.resources),{offset:(reference.headerOffset-header)&65535,segment:reference.headerSegment},voiceAddress,[]);
 const engineIndex=(seed.engine.segment-voiceAddress.segment)*16+seed.engine.offset-voiceAddress.offset;
 if(engineIndex<0||engineIndex+100>voices.length)throw Error('Original engine instrument is outside its sound bank');
 const engine={...seed.engine,instrument:Array.from(voices.slice(engineIndex,engineIndex+100))};
 const resources=Object.fromEntries(Object.entries(loaded.resources).map(([name,r])=>[name,{...r,header:Array.from(r.header),instrument:Array.from(r.instrument),sequence:Array.from(r.sequence)}]));
 return {...seed,engine,resources};
}
