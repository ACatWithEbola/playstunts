import {i16} from './math.ts';
import {playerStartOffset} from './start-offset.ts';
/** Original player initializer arguments 0x9311..0x93ec; terrain-row coordinates. */
export function playerStartPosition(column:number,row:number,angle:number,hill:0|1){
 const [x,z]=playerStartOffset(angle);
 return {position:[i16(column*1024+512+x)*64,(hill?450:0)*64,i16((29-row)*1024+512+z)*64],heading:i16(-angle)};
}
