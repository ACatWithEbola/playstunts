/** Do not expose an enhanced scene until asynchronous shader preparation ends.
 * A cancelled race owns neither the pending scene nor its GPU resources. */
export async function prepareUpgradedScene<T extends {prepare():Promise<void>;close():void}>(scene:T,closed:()=>boolean,install:(scene:T)=>void){
 try{await scene.prepare();}catch(error){scene.close();throw error;}
 if(closed()){scene.close();return;}
 install(scene);
}
