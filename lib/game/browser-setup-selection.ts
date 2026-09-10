import {openNativeFilePersistence,nativeFileKey} from './native-file-store.ts';
import {readOriginalSetupSelection} from './read-setup-selection.ts';
export const browserDefaultSetup=()=>new TextEncoder().encode('rem 4 5 -1 -1 -1 -1\r\n');
export const NATIVE_GAME_DIRECTORY_KEY='stunts-native-game-directory';
/** Browser launch boundary: installed files override immutable supplied files.
 * Configuration parsing itself remains the original SETUP parser. */
export async function loadBrowserSetupSelection(signal:AbortSignal){
 const directory=localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\',key=nativeFileKey(directory,'SETUP','.DAT');
 const persistence=await openNativeFilePersistence();let bytes:Uint8Array|null=null,track:number[]|undefined;
 try{const files=await persistence.all();bytes=files.find(file=>file.key===key)?.bytes??null;const storedTrack=files.find(file=>file.key===nativeFileKey(directory,'DEFAULT','.TRK'));if(storedTrack)track=Array.from(storedTrack.bytes);}finally{persistence.close?.();}
 if(!bytes)bytes=browserDefaultSetup();
 const response=await fetch('/game/setup-initial-data.json',{signal});if(!response.ok)throw Error('Original SETUP initialized data could not load');const initial=await response.json() as {data:string};
 if(signal.aborted)throw new DOMException('Game configuration load closed','AbortError');
 const selection=await readOriginalSetupSelection(Uint8Array.from(initial.data.match(/../g)??[],byte=>parseInt(byte,16)),bytes);
 return {directory,selection,track};
}
