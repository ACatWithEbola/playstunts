import {scoreHash} from '../game/global-score-format.ts';
/** Track labels are optional; a catalog outage must not hide database scores.
 * Failed loads are retried, while successful content hashes are cached. */
export function createTrackLabelCatalog(load:()=>Promise<{tracks:{name:string;raw:number[]}[]}>,warn:(error:unknown)=>void=()=>{}){
 let retained:Promise<Map<string,string>>|undefined;
 return ()=>retained??=(async()=>{const data=await load();return new Map(await Promise.all(data.tracks.map(async track=>[await scoreHash(Uint8Array.from(track.raw)),track.name] as const)));})().catch(error=>{retained=undefined;warn(error);return new Map<string,string>();});
}
