export interface NativeReplaySaveHost {
 pauseAudio():void;
 editName():Promise<boolean>;
 buildPath():void;
 exists():Promise<boolean>;
 dialog(resource:string,mode:number,selected:number):Promise<number>;
 write():Promise<number>;
}
/** Original16308..1640a. Rename returns to the name fields; failed writes
 * show the original error then return there too. Audio resumes in the caller. */
export async function saveNativeReplay(host:NativeReplaySaveHost){
 host.pauseAudio();
 for(;;){
  if(!await host.editName())return false;
  host.buildPath();
  if(await host.exists()){
   const response=(await host.dialog('efex',2,0))<<16>>16;
   if(response===-1)return false;
   if(response===0)continue;
  }
  if(((await host.write())&255)===0)return true;
  await host.dialog('eser',1,0);
 }
}
