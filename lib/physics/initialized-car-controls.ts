import {initializeCar} from './initialize-car.ts';
import {readCarEngine,readCarGrip,readCarSuspension} from './reference-state.ts';
/** Decode initialized raw fields into the existing native simulation components. */
export function initializedCarControls(before:Uint8Array,tuning:Uint8Array,transmission:number,position:number[],heading:number){
 const raw=initializeCar(before,tuning,transmission,position,heading);
 return {raw,engine:readCarEngine(raw),grip:readCarGrip(raw),suspension:readCarSuspension(raw)};
}
