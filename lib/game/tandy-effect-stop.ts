import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {runOriginalTandyTrackStop} from './tandy-track-control.ts';
import type {OriginalTandyEffectState} from './tandy-effect-runtime.ts';
/** Original 0x29466 with 0x2b4d8 and null-resource 0x29b02 initialization.
 * TD15 owner stop and retained timer reinitialization.
 */
export function stopOriginalTandyEffect(before:OriginalTandyEffectState&{markers:Uint8Array},handle:number,master:number,driverSegment:number,port61:number){
 const program=runOriginalTandyEffectStop(before,handle,master,driverSegment,port61);let step=program.next();while(!step.done)step=program.next();return step.value;
}
export function* runOriginalTandyEffectStop(before:OriginalTandyEffectState&{markers:Uint8Array},handle:number,master:number,driverSegment:number,port61:number,deferLegacyBios=false){
 const driver=before.driver.slice();
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),markers=before.markers.slice(),writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 const result=()=>({...before,driver,timers,voices,lastNotes,markers,writes,bios});
 handle=handle<<16>>16;if(handle<16||handle>23)return result();
 const program=runOriginalTandyTrackStop(driver,timers,voices,handle,driverSegment,port61,handle,before.driverGeneration,deferLegacyBios);let step=program.next();
 try{while(!step.done){
  const resumed:{driver:Uint8Array;port61:number}|undefined=yield {state:result(),writes:step.value.writes.map(write=>write.slice()),bios:step.value.bios.map(request=>({...request})),port61:step.value.port61};
  step=program.next(resumed);
 }}finally{program.return(undefined as never);}
 const stopped=step.value;writes.push(...stopped.writes);bios.push(...stopped.bios);
 const timer=timers[handle],v=new DataView(timer.buffer);
 for(const [offset,value] of [[0x22,127],[0x23,handle],[0x16,15],[0x32,0],[4,0],[0x24,0],[0x15,0],[0x1c,0],[0x28,master&255],[0x25,0],[0x29,0],[0x2a,0],[0x2b,0],[0x2c,0],[0x47,255]])timer[offset]=value;
 for(const offset of [0,2,0x18,0x1a,0x1e,0x20,0x26])v.setUint16(offset,0,true);
 if(timer.length===76)v.setUint32(0x48,0,true);
 lastNotes[handle]=0;markers[handle]=0;
 return result();
}
