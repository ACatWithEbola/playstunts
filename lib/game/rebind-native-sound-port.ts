import type {NativeRaceSoundDevice} from './native-race-sound-device.ts';
/** Replace only the live browser speaker-port reader. Retain sample I/O,
 * driver identity and host callbacks across demo/race/replay transitions. */
export function rebindNativeSoundPort(device:NativeRaceSoundDevice|undefined,port61:()=>number):NativeRaceSoundDevice|undefined{
 return device?.kind==='pc-speaker'||device?.kind==='tandy'?{...device,port61}:device;
}
