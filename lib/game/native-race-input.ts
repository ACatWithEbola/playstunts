import {selectOriginalRaceInput,type NativeRaceInputHost} from './race-input-selection.ts';
import {captureOriginalRaceInput} from './capture-race-input.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Original14414..146d3: select hardware/replay input, then record it. */
export function captureNativeRaceInput(host:NativeRaceInputHost,d:number,forced=0,framesPerSecond:10|20=20,engine?:PhysicsEngineVersion){
 const input=selectOriginalRaceInput(host,d,forced,framesPerSecond,engine);
 return {input,capture:input===null?null:captureOriginalRaceInput(host.memory(),d,input,framesPerSecond,engine)};
}
