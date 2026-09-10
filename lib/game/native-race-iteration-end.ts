import {originalRaceCompletion} from './race-completion-flow.ts';
export interface NativeRaceIterationEndHost {
 memory():Uint8Array;resetMouse(mode:number):void;control(mode:number,start:number,current:number):void;
 pauseAudio():void;replayControls():Promise<void>;key():number;command(key:number):void|Promise<void>;
 mouseButtons():number;joystickButtons():number;
}
/** Original13f52..14030, manual-game branch. Keyboard arrows are drained
 * before the next frame. Replay input returns to the renderer even when it
 * has requested an exit; the next original loop iteration handles that exit. */
export async function finishNativeRaceIteration(host:NativeRaceIterationEndHost,d:number){
 let m=host.memory();const action=originalRaceCompletion(m[d+0x8ff4],m[d+0xa3c2],m[d+0x8eac]).action;
 if(action==='exit')return 'exit' as const;
 if(action==='initialize-replay-controls'){
  m[d+0x8ff4]=0;m[d+0xa3c2]=2;host.resetMouse(0);host.control(0,0,0);host.control(2,4,0);
  host.memory()[d+0x9aca]=1;host.pauseAudio();
 }
 if(host.memory()[d+0xa3c2]===2){await host.replayControls();return 'render' as const;}
 let key:number;
 do{key=host.key()&65535;if(key)await host.command(key);}while(key===0x4800||key===0x4b00||key===0x4d00||key===0x5000);
 m=host.memory();
 if(m[d+0xa3c2]===1&&((host.mouseButtons()&3)!==0||(host.joystickButtons()&0x30)!==0)){
  m=host.memory();m[d+0xa3c2]=0;m[d+0x7fee]=0;return 'initialize' as const;
 }
 return 'render' as const;
}
