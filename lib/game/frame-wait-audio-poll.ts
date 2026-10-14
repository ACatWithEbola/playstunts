/** Keep an explicit audio owner supplied during a delayed display wakeup.
 * Never return while a poll still owns game memory. Rendering stays rAF-owned. */
export async function pollAudioDuringFrameWait(frame:Promise<void>,poll:()=>void|Promise<void>,enabled:()=>boolean,interval=25){
 if(!Number.isFinite(interval)||interval<=0)throw Error('Invalid frame-wait poll interval');
 let ended=false,failure:unknown,failed=false,interimPolls=0,suppressedPolls=0;
 const completion=frame.then(()=>{ended=true;},error=>{ended=true;failed=true;failure=error;});
 while(!ended){
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{await Promise.race([completion,new Promise<void>(resolve=>{timer=setTimeout(resolve,interval);})]);}
  finally{if(timer!==undefined)clearTimeout(timer);}
  if(!ended){if(enabled()){interimPolls++;await poll();}else suppressedPolls++;}
 }
 await completion;if(failed)throw failure;return {interimPolls,suppressedPolls};
}
