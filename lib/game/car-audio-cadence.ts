/** Original enclosing car-audio callback 0x193cd. The stack guard calls
 * 0x222d7 and requires SS=DS; comparisons after the increment are signed.
 * This returns loop visits, not a claim about wall-clock registration frequency.
 */
export function carAudioCadence(counter:number,alternate:number,stackMatches:boolean){
 counter&=65535;
 if(!stackMatches)return {counter,handles:[] as number[]};
 counter=(counter+1)&65535;
 const signed=counter<<16>>16;
 if(signed<2&&alternate!==0)return {counter,handles:[] as number[]};
 return {counter:signed>=2?0:counter,handles:Array.from({length:25},(_,i)=>i)};
}
