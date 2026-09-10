import {loadSoundEffect} from './load-sound-effect.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
import type {AudioFarPointer} from './resolve-car-audio.ts';
/** Prepare the supplied car effects for the existing AdLib playback runtime.
 * Addresses belong to the caller's sound-bank allocation, not a fixed snapshot.
 * The current runtime represents one instrument and one sequence per effect.
 */
export function loadCarSoundResources(before:Uint8Array,voices:Uint8Array,names:readonly string[],bankAddress:AudioFarPointer,voiceAddress:AudioFarPointer,beforePercussion:readonly AudioFarPointer[]){
 let bank=before.slice(),percussion=beforePercussion.map(p=>({...p}));
 const resources:Record<string,LoadedEffectResource>={};
 for(const name of names){
  const loaded=loadSoundEffect(bank,voices,Uint8Array.from(name,c=>c.charCodeAt(0)),bankAddress,voiceAddress,percussion);
  bank=loaded.bank;percussion=loaded.percussion;
  if(loaded.header===null)throw Error(`Missing original car sound ${name}`);
  const h=loaded.header,view=new DataView(bank.buffer);
  if(bank[h+6]!==1||bank[h+11]!==1)throw Error('Car sound runtime requires one instrument and one sequence');
  const instrumentOffset=view.getUint16(h+7,true),instrumentSegment=view.getUint16(h+9,true);
  const sequenceOffset=view.getUint16(h+12,true),sequenceSegment=view.getUint16(h+14,true);
  const instrumentIndex=(instrumentOffset-voiceAddress.offset)&65535,sequenceIndex=(sequenceOffset-bankAddress.offset)&65535;
  const hasInstrument=!!(instrumentOffset|instrumentSegment);
  if(hasInstrument&&(instrumentSegment!==voiceAddress.segment||instrumentIndex+100>voices.length))throw Error('Car sound instrument is outside its loaded bank');
  if(sequenceSegment!==bankAddress.segment||sequenceIndex+4>bank.length)throw Error('Car sound sequence is outside its loaded bank');
  const length=view.getUint32(sequenceIndex,true);
  if(length<4||sequenceIndex+length>bank.length)throw Error('Incomplete car sound sequence');
  resources[name]={headerOffset:(bankAddress.offset+h)&65535,headerSegment:bankAddress.segment,header:bank.slice(h,h+17),instrumentOffset,instrumentSegment,instrument:hasInstrument?voices.slice(instrumentIndex,instrumentIndex+100):new Uint8Array(),sequenceOffset,sequenceSegment,sequence:bank.slice(sequenceIndex,sequenceIndex+length)};
 }
 return {bank,percussion,resources};
}
