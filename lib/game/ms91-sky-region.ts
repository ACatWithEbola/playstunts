import type {Ms91Rectangle} from './ms91-rectangle-list.ts';
const signed=(word:number)=>word<<16>>16;
/** Original EE18..EE42 forward horizon bounds, before any clipping. Detail4
 * uses a one-pixel strip; other levels use the loaded panorama maximum height.
 * Signed word subtraction wraps exactly as in the original executable. */
export function ms91ForwardSkyRegion(horizon:number,maximumHeight:number,detail:number):Ms91Rectangle{
 return [0,320,signed(horizon-(detail===4?1:maximumHeight)),signed(horizon)];
}
/** Original EDC6..EDE1 full-viewport sky region on the fallback path. */
export function ms91FullSkyRegion(clip:Ms91Rectangle):Ms91Rectangle{return [0,320,signed(clip[2]),signed(clip[3])];}
/** Original EA54..EAB8 rolled-horizon working region. Add/subtract wrap before
 * signed comparison; the clip only clamps top on the non-full-redraw path. */
export function ms91RolledSkyRegion(base:number,delta:number,maximumHeight:number,clip:Ms91Rectangle,fullRedraw:boolean):Ms91Rectangle{
 if(fullRedraw)return ms91FullSkyRegion(clip);
 base=signed(base);const end=signed(base+delta),top=signed(Math.min(base,end)-maximumHeight);
 return [0,320,Math.max(signed(clip[2]),top),Math.max(base,end)];
}
