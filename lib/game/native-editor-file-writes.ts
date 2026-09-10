import type {createNativeFileStore} from './native-file-store.ts';
import {createOriginalEmptyHighScores} from './high-score-empty.ts';
/** Translate browser storage failures to the original file-write return code. */
export function createNativeEditorFileWrites(files:Pick<Awaited<ReturnType<typeof createNativeFileStore>>,'write'>){
 const write=async(path:string,name:string,extension:string,bytes:Uint8Array)=>{try{await files.write(path,name,extension,bytes);return 0;}catch{return 1;}};
 return {
  writeTrack:(path:string,name:string,bytes:Uint8Array)=>write(path,name,'.trk',bytes),
  // 1D8C4 calls 3D5C but ignores its result: SI still holds the track write
  // status at 1D8CC. A failed HIG reset must not terminate the browser game.
  clearScores:async(path:string,name:string)=>{await write(path,name,'.hig',createOriginalEmptyHighScores());},
 };
}
