import {i16,intSin,intCos} from './math.ts';
/** Original player starting offset, 0x9311..0x9395, before world placement. */
export function playerStartOffset(angle:number){
 return [intSin,intCos].map(trig=>i16(((trig(angle+512)*210+8192)>>14)+((trig(angle+256)*36+8192)>>14)));
}
