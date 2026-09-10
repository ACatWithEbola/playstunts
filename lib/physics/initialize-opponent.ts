import {opponentStartPosition} from './opponent-start-position.ts';
import {initializeCar} from './initialize-car.ts';
/** Original 0x9448..0x9533, including the shared car initializer. */
export function initializeOpponent(before:Uint8Array,tuning:Uint8Array,column:number,row:number,angle:number,hill:0|1){
 const start=opponentStartPosition(column,row,angle,hill);
 return initializeCar(before,tuning,1,start.position,start.heading);
}
