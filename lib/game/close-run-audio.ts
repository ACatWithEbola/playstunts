/** Release every run-owned audio resource, retaining the first failure. */
export async function closeRunAudio(steps:ReadonlyArray<()=>void|Promise<void>>){
 let failed=false,first:unknown;
 for(const step of steps){
  try{await step();}catch(error){if(!failed){failed=true;first=error;}}
 }
 if(failed)throw first;
}
