import {selectOriginalRaceInput,type NativeRaceInputHost} from './race-input-selection.ts';
import {captureOriginalRaceInput} from './capture-race-input.ts';
/** Original14414..146d3: select hardware/replay input, then record it. */
export function captureNativeRaceInput(host:NativeRaceInputHost,d:number,forced=0){
 const input=selectOriginalRaceInput(host,d,forced);
 return {input,capture:input===null?null:captureOriginalRaceInput(host.memory(),d,input)};
}
