import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Both original editions use unsigned shifts followed by a signed height. */
export function originalCircleHeight(diameter:number,engine?:PhysicsEngineVersion){
 const word=diameter&65535,quarter=word>>>2;
 return (word-quarter+(quarter>>>(engine==='ms-1991'?2:1)))<<16>>16;
}
