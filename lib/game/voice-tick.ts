import {stepVoiceDuration} from './voice-duration.ts';
/** One original hardware voice iteration. Driver operations remain ordered requests. */
export function stepVoiceTick(before:Uint8Array,instrument:Uint8Array,releaseFlag:number,ownerCount:number,ownerNote:number){
 if(before.length!==46||instrument.length<67)throw Error("Invalid original voice or instrument record");
 let record=before.slice();const calls:number[]=[];
 if(!record[1])return {record,calls,ownerCount,ownerNote};
 if(record[0]>15){const d=stepVoiceDuration(record,releaseFlag);record=d.record;if(d.releaseChannels.length)calls.push(12);}
 const v=new DataView(record.buffer),p=new DataView(instrument.buffer,instrument.byteOffset,instrument.byteLength);
 const s=(o:number)=>v.getInt16(o,true),u=(o:number)=>v.getUint16(o,true),w=(o:number,n:number)=>v.setUint16(o,n,true),ps=(o:number)=>p.getInt16(o,true),pu=(o:number)=>p.getUint16(o,true);
 if(record[22]===1){w(20,s(20)+ps(32));if(s(20)>=ps(30)){w(20,ps(30));record[22]=ps(36)<ps(30)?2:3;}}
 if(record[22]===2){w(20,s(20)-ps(34));if(s(20)<=ps(36)){record[22]=3;w(20,ps(36));}}
 if(record[22]===3&&ps(36)===0)record[22]=4;
 if(record[22]===4){w(20,s(20)-ps(38));if(s(20)<=0){w(20,0);record[22]=0;record[1]=0;ownerCount=(ownerCount-1)&255;ownerNote=0;calls.push(15);}}
 if(instrument[40]){
  if(u(24))w(24,u(24)-1);
  else if(u(26)){
   if(u(26)!==32767)w(26,u(26)-1);
   if(record[39])record[39]--;
   else{
    record[39]=instrument[41];const down=record[38]===2;
    w(28,s(28)+(down?-s(36):s(36)));
    if(Math.abs(s(28))>=pu(46)){
     if(instrument[52]&(down?1:2))record[38]=down?1:2;else w(28,0);
    }
   }
  }
 }
 if(instrument[53]){
  if(u(30))w(30,u(30)-1);
  else if(u(32)){
   w(32,u(32)-1);
   if(record[40])record[40]--;
   else{record[40]=instrument[58];const index=record[41];record[41]=(index+1)&255;record[34]=instrument[59+(index&7)];}
  }
 }
 calls.push(39);return {record,calls,ownerCount,ownerNote};
}
