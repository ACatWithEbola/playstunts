export type DrivingSoundRequest='engine-start'|'engine-stop'|'skid-start'|'skid2-start'|'skid-stop';
/** Original queue producer 0xa995-0xaa50, one car. Switching skid variants
 * first stops the old variant; the new one starts on the next producer call.
 */
export function updateDrivingSoundFlags(previous:number,current:number){
 let flags=previous&255;current&=255;
 const requests:DrivingSoundRequest[]=[];
 if(current&1){if(!(flags&1)){flags|=1;requests.push('engine-start');}}
 else if(flags&1){flags=(flags-1)&255;requests.push('engine-stop');}
 if((current&6)!==(flags&6)){
  if(flags&6){flags&=~6;requests.push('skid-stop');}
  else if(current&2){flags=(flags+2)&255;requests.push('skid-start');}
  else if(current&4){flags=(flags+4)&255;requests.push('skid2-start');}
 }
 return {flags,requests};
}
