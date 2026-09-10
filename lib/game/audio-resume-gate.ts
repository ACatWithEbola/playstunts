/** A delayed browser resume must not undo a newer pause, seek or close. */
export function createAudioResumeGate(){
 let generation=0;
 return {
  cancel(){generation++;},
  async resume(resumeContext:()=>Promise<void>,start:()=>void){
   const request=++generation;
   await resumeContext();
   if(request===generation)start();
  },
 };
}
