import {i16} from './math.ts';
/** Shared original MS90/MS91 guard after plane-local signed-word projection. */
export function undersideGuard(underside:boolean,oldHeight:number,newHeight:number){
 const old=i16(oldHeight),next=i16(newHeight);
 if(underside||old>=-12||next>=-12)return 'normal';
 return next<=-24?'ground-fallback':'underside-crash';
}
