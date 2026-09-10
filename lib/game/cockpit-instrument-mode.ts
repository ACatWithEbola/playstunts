import {cockpitGaugeIndices} from './cockpit-gauges.ts';
/** Original 14fbc..1500c and digital branch 150de. Keep the special 0xffff
 * absent-display sentinel distinct from the zero digital-display sentinel.
 */
export function cockpitInstrumentMode(speed:number,rpm:number,centerY:number,speedPoints:number,rpmPoints:number){
 const indices=cockpitGaugeIndices(speed,rpm,speedPoints,rpmPoints),center=centerY&65535;
 const mode=center===65535?2:center===0?1:0;
 return {mode,speedIndex:mode===2?0:mode===1?(speed&65535)>>>8:indices.speedIndex,rpmIndex:indices.rpmIndex};
}
