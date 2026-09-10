import {originalHighScoreTrackMatches,originalHighScoreEligibility} from './high-score-eligibility.ts';
import {createOriginalEmptyHighScores} from './high-score-empty.ts';
import type {NativeHighScoreState} from './native-high-score-runtime.ts';
export interface NativeHighScorePreparationHost {
 readSavedTrack():Promise<Uint8Array|null>;
 insertTrackDisk():Promise<number>;
 readScores():Promise<Uint8Array|null>;
 writeScores(bytes:Uint8Array):Promise<boolean>;
}
/** Original605b..616b and3d5c..3e61, with browser files at the DOS I/O
 * boundary. A missing track prompts once and may be read once more. Failed
 * score creation retains the blank in-memory table but marks it unavailable. */
export async function prepareNativeHighScores(host:NativeHighScorePreparationHost,state:NativeHighScoreState,currentTrack:Uint8Array,finishTime:number,flags:number,retainedTime:number){
 let saved=await host.readSavedTrack();
 if(saved===null&&await host.insertTrackDisk())saved=await host.readSavedTrack();
 let status=originalHighScoreTrackMatches(currentTrack,saved)?0:255;
 if(status===0){
  state.order=[0,1,2,3,4,5,6];state.selected=255;
  const scores=await host.readScores();
  if(scores!==null){if(scores.length!==364)throw Error('High-score file requires its original364-byte record context');state.file.set(scores);}
  else {state.file.set(createOriginalEmptyHighScores());if(!await host.writeScores(state.file.slice()))status=255;}
 }
 const last=state.file[362]|state.file[363]<<8;
 return originalHighScoreEligibility(status,finishTime,flags,last,retainedTime);
}
