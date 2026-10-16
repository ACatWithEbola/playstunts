import {createNativeResourceCatalog} from '../game/native-resource-catalog.ts';
import type {NativeDemoData} from '../game/native-demo-runtime.ts';
type Template={data:Omit<NativeDemoData,'catalog'>;files:Parameters<typeof createNativeResourceCatalog>[0]};
let retained:Template|undefined;
const completedBytes=new Map<string,Uint8Array>();
/** Physics and resource bytes come only from the deployed original assets. */
export async function globalScoreData(assets:Fetcher,origin:string){
 // Worker I/O promises belong to the request that created them. Cache only
 // completed immutable bytes, never unfinished fetches across requests.
 const binary=async(path:string)=>{const cached=completedBytes.get(path);if(cached)return cached.slice();
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{const bytes=await Promise.race([(async()=>{const r=await assets.fetch(new Request(new URL('/game/'+path,origin)));if(!r.ok)throw Error('Score validation resources unavailable');return new Uint8Array(await r.arrayBuffer());})(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Score validation resource load timed out')),15000);})]);completedBytes.set(path,bytes);return bytes.slice();}
  finally{clearTimeout(timer);}
 };
 if(!retained){
  const json=async(path:string)=>JSON.parse(new TextDecoder().decode(await binary(path+'.json')));
  const [base,manifest,cars,records,vectors,samples,objects,points,indices,planes,walls]=await Promise.all([
   binary('native-resource-base.bin'),json('original-resources/manifest'),json('assets'),json('route-records'),json('route-vectors'),json('route-sample-vectors'),json('track-objects'),json('route-point-vectors'),json('route-speed-indices'),json('collision-planes'),json('collision-walls')]);
  retained={data:{base,cars:cars.cars,records,vectors,samples,objects,points,indices,planes,walls:walls.walls},files:manifest.files};
 }
 // Each verification owns its catalogue's pending reads. Resolved bytes are
 // still reused, so warm checks do not repeatedly download game resources.
 return {...retained.data,catalog:createNativeResourceCatalog(retained.files,file=>binary('original-resources/'+file))};
}
