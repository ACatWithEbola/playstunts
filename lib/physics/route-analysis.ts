import {validateTerrain} from './terrain-validation.ts';
import {traverseRouteWithMetadata} from './route-metadata.ts';
import {routeSamples} from './route-samples.ts';
/** Explicit result contract: callback-written location is nullable until traversal ends. */
export type RouteAnalysisResult = {
 location:number[]|null;
 terrainError:ReturnType<typeof validateTerrain>;
 route:null;metadata:null;samples:null;
} | (ReturnType<typeof traverseRouteWithMetadata> & {
 location:number[]|null;
 terrainError?:never;
 samples:ReturnType<typeof routeSamples>|null;
});
/** Native reconstruction through original 0x13567; resource cleanup is external. */
export function analyzeRoute(raw:number[],records:{records:number[][]}[],metadataVectors:{vectors:number[][][]}[],sampleVectors:{vectors:number[][][]}[],objects:{multiTile:number}[],onBranchPush?:(index:number,bytes:number[])=>void,options?:{sample?:boolean;samples?:ReturnType<typeof routeSamples>}):RouteAnalysisResult{
 const terrain=validateTerrain(raw.slice(901,1801));
 if(terrain.error)return {location:terrain.location,terrainError:terrain,route:null,metadata:null,samples:null};
 let location:number[]|null=null;
 const result=traverseRouteWithMetadata(raw,records,metadataVectors,objects,value=>{location=value;},onBranchPush);
 return {...result,location,samples:result.route.error||options?.sample===false?null:(options?.samples??routeSamples(raw,result.route,records,sampleVectors,objects))};
}
