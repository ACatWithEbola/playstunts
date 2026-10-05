import {createNativeResourceCatalog} from '../game/native-resource-catalog.ts';
import type {NativeDemoData} from '../game/native-demo-runtime.ts';
let retained:Promise<NativeDemoData>|undefined;
/** Physics and resource bytes come only from the deployed original assets. */
export function globalScoreData(assets:Fetcher,origin:string){
 return retained??=(async()=>{
  const binary=async(path:string)=>{const r=await assets.fetch(new Request(new URL('/game/'+path,origin)));if(!r.ok)throw Error('Score validation resources unavailable');return new Uint8Array(await r.arrayBuffer());};
  const json=async(path:string)=>JSON.parse(new TextDecoder().decode(await binary(path+'.json')));
  const [base,manifest,cars,records,vectors,samples,objects,points,indices,planes,walls]=await Promise.all([
   binary('native-resource-base.bin'),json('original-resources/manifest'),json('assets'),json('route-records'),json('route-vectors'),json('route-sample-vectors'),json('track-objects'),json('route-point-vectors'),json('route-speed-indices'),json('collision-planes'),json('collision-walls')]);
  const cache=new Map<string,Promise<Uint8Array>>();
  return {base,cars:cars.cars,records,vectors,samples,objects,points,indices,planes,walls:walls.walls,
   catalog:createNativeResourceCatalog(manifest.files,file=>{let result=cache.get(file);if(!result){result=binary('original-resources/'+file);cache.set(file,result);}return result;})};
 })().catch(error=>{retained=undefined;throw error;});
}
