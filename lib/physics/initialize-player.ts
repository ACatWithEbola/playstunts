import {playerStartPosition} from './start-position.ts';
import {initializeCar} from './initialize-car.ts';
/** Original 0x9311..0x93fd, including the selected transmission and car initializer. */
export function initializePlayer(before:Uint8Array,tuning:Uint8Array,transmission:number,column:number,row:number,angle:number,hill:0|1){
 const start=playerStartPosition(column,row,angle,hill);
 return initializeCar(before,tuning,transmission,start.position,start.heading);
}
