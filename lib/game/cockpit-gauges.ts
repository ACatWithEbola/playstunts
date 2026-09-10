/** Original analog gauge indices 0x14fcb-0x1500c. The supplied build uses
 * signed RPM division, unlike the community listing's unsigned shift.
 */
export function cockpitGaugeIndices(speed:number,rpm:number,speedPoints:number,rpmPoints:number){
 let speedIndex=Math.floor((speed&65535)/640);
 const speedCount=speedPoints<<16>>16,rpmCount=rpmPoints<<16>>16;
 if(speedCount<=speedIndex)speedIndex=(speedCount-1)<<16>>16;
 const signed=rpm<<16>>16,magnitude=(signed<0?-signed:signed)<<16>>16;
 let rpmIndex=((signed<0?-(magnitude>>7):magnitude>>7)|0);
 if(rpmCount<=rpmIndex)rpmIndex=(rpmCount-1)<<16>>16;
 return {speedIndex,rpmIndex};
}
