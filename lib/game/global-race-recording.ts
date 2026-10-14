import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
type Runtime=Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;
/** Observe the existing recorder; never alter simulation memory, input or
 * timing. Keep the complete stream when the original bank slides by 600. */
export function captureGlobalRace(runtime:Runtime):{physicsEngine?:PhysicsEngineVersion;framesPerSecond?:10|20;continued:boolean;inputs:number[];total:number;introducing:boolean}{
 const session=runtime.session,history={physicsEngine:session.physicsEngine,...(resolveReplayCadence(session.framesPerSecond)===10?{framesPerSecond:10 as const}:{}),continued:session.replaying,inputs:[] as number[],total:0,introducing:session.introducing};
 const originalContinue=session.continueReplay;
 session.continueReplay=async function(restart,host){const result=await originalContinue.call(this,restart,host);if(result){history.continued=!restart;if(restart){history.inputs=[];history.total=0;}}return result;};
 const beforeTick=()=>{
  if(history.introducing&&!session.introducing){history.inputs=[];history.total=0;}history.introducing=session.introducing;
 };
 const afterTick=()=>{
  const m=session.state.memory,d=0x2d1a0,v=new DataView(m.buffer,m.byteOffset,m.byteLength),count=v.getUint16(d+0x8fd8,true),total=count+v.getUint16(d+0xa034,true);
  if(!session.replaying&&!history.continued){
   if(total<history.total){history.inputs=[];history.total=0;}
   const added=total-history.total,offset=v.getUint16(d+0x9c40,true),segment=v.getUint16(d+0x9c42,true)*16;
   for(let i=count-added;i<count;i++)history.inputs.push(m[segment+((offset+i)&65535)]);history.total=total;
  }
 };
 const originalTick=runtime.tick;
 runtime.tick=function(devices){
  beforeTick();const result=originalTick.call(this,devices);afterTick();return result;
 };
 const originalProgram=runtime.tickProgram;
 runtime.tickProgram=function*(devices,deferLegacyBios=false){
  beforeTick();const result=yield* originalProgram.call(this,devices,deferLegacyBios);afterTick();return result;
 };
 const originalWait=runtime.tickWithAudioWait;
 runtime.tickWithAudioWait=async function(devices,audioTick){
  beforeTick();const result=await originalWait.call(this,devices,audioTick);afterTick();return result;
 };
 const originalDelivery=runtime.tickWithAudioDelivery;
 runtime.tickWithAudioDelivery=async function(devices,deliver){
  beforeTick();const result=await originalDelivery.call(this,devices,deliver);afterTick();return result;
 };
 return history;
}
