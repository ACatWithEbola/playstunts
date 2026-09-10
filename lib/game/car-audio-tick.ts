export interface CarAudioCall {kind:'volume'|'pitch'|'stop'|'is-finished'|'start';args:number[]}
/** Original per-car iteration 0x193fe-0x19535. The enclosing timer cadence and
 * nested driver/effect operations are separate; finished supplies query result.
 */
export function stepCarAudioTick(before:Uint8Array,enabled:boolean,finished:boolean,handle:number){
 if(before.length!==76)throw Error('Invalid original car audio record');
 const record=before.slice(),v=new DataView(record.buffer),calls:CarAudioCall[]=[];
 const word=(offset:number)=>v.getUint16(offset,true);
 if(!record[0]||!enabled)return {record,calls};
 const gain=((word(4)*7+(record[10]<<4))&65535)>>>3;
 v.setUint16(4,gain,true);const volume=(gain>>>4)&255;
 if(volume!==record[14]||record[26]){
  calls.push({kind:'volume',args:[word(2),volume]});
  for(const offset of [20,22])if(word(offset)!==65535)calls.push({kind:'volume',args:[word(offset),Math.max(volume-10,0)]});
  record[14]=volume;
 }
 const smoothed=((v.getUint32(6,true)*7+(word(12)<<4))>>>0)>>>3;
 v.setUint32(6,smoothed,true);const pitch=(smoothed>>>4)&65535;
 if((pitch!==word(16)||record[26])&&word(18)!==65535){
  calls.push({kind:'pitch',args:[word(18),pitch]});v.setUint16(16,pitch,true);
 }
 record[26]=0;
 if(record[27]){
  if(record[1]){calls.push({kind:'stop',args:[word(20)]});record[27]=0;}
  else{
   calls.push({kind:'is-finished',args:[word(20)]});
   if(finished){calls.push({kind:'start',args:[handle]});record[27]=0;}
  }
 }
 return {record,calls};
}
