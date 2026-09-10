export interface AudioSampleQueueState {counter:number;read:number;write:number;busy:number;stackMatches:boolean}
/** Audio sample consumer in original callback 0x14318, preceding its remaining
 * game/replay work. It delivers at most one of forty 34-byte records per call.
 */
export function stepAudioSampleQueue(s:AudioSampleQueueState){
 let counter=s.counter&65535,read=s.read&65535;
 const events:{index:number;interval:number}[]=[];
 if(!s.stackMatches||s.busy)return {counter,read,events};
 counter=(counter+1)&65535;
 if((counter<<16>>16)>=5&&read!==(s.write&65535)){
  events.push({index:read,interval:counter});counter=0;read=(read+1)&65535;if(read===40)read=0;
 }
 return {counter,read,events};
}
