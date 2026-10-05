import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
type Runtime=Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;
/** Observe the existing recorder; never alter simulation memory, input or
 * timing. Keep the complete stream when the original bank slides by 600. */
export function captureGlobalRace(runtime:Runtime){
 const session=runtime.session,history={continued:session.replaying,inputs:[] as number[],total:0,introducing:session.introducing};
 const originalContinue=session.continueReplay;
 session.continueReplay=async function(restart,host){const result=await originalContinue.call(this,restart,host);if(result){history.continued=!restart;if(restart){history.inputs=[];history.total=0;}}return result;};
 const originalTick=runtime.tick;
 runtime.tick=function(devices){
  if(history.introducing&&!session.introducing){history.inputs=[];history.total=0;}history.introducing=session.introducing;
  const result=originalTick.call(this,devices),m=session.state.memory,d=0x2d1a0,v=new DataView(m.buffer,m.byteOffset,m.byteLength),count=v.getUint16(d+0x8fd8,true),total=count+v.getUint16(d+0xa034,true);
  if(!session.replaying&&!history.continued){
   if(total<history.total){history.inputs=[];history.total=0;}
   const added=total-history.total,offset=v.getUint16(d+0x9c40,true),segment=v.getUint16(d+0x9c42,true)*16;
   for(let i=count-added;i<count;i++)history.inputs.push(m[segment+((offset+i)&65535)]);history.total=total;
  }
  return result;
 };
 return history;
}
