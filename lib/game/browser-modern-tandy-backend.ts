import {createMs91TandyRaceBinding} from './ms91-tandy-race-binding.ts';
import type {NativeRaceSoundDevice} from './native-race-sound-device.ts';
/** Deterministic browser device, not vintage CPU/analog emulation.
 * The caller must establish atomic game callbacks and enabled IRQ0 at render
 * boundaries. One shared PIT0 host owns game/sample dispatch; masked windows
 * fail explicitly instead of dropping interrupts. Reset latch/mix are defined
 * virtual output values. Selection depends on sound-driver identity, never the
 * replay's physics. Legacy supplied tone/BIOS behavior remains separate. */
export function createBrowserModernTandyBackend(sampleRate:number,device:NativeRaceSoundDevice|undefined){
 if(device?.kind!=='tandy'||device.driverGeneration!=='ms-1991')return;
 return createMs91TandyRaceBinding(0x39e1,{sampleRate,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(){}});
}
