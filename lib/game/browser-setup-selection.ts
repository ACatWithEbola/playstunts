import {openNativeFilePersistence,nativeFileKey} from './native-file-store.ts';
import {readOriginalSetupSelection} from './read-setup-selection.ts';
import {browserMt32Installed} from './browser-mt32-installation.ts';
// A fresh installation prefers MT-32 only when the compatible ROM pair is
// present. Sound Blaster is the sole fallback because it needs no external ROM.
export const browserDefaultSetup=(mt32Installed=false)=>new TextEncoder().encode(`rem 4 ${mt32Installed?5:4} -1 -1 -1 -1\r\n`);
export const NATIVE_GAME_DIRECTORY_KEY='stunts-native-game-directory';
/** Browser launch boundary: installed files override immutable supplied files.
 * Configuration parsing itself remains the original SETUP parser. */
export async function loadBrowserSetupSelection(signal:AbortSignal,mt32Installed=browserMt32Installed){
 const directory=localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\',key=nativeFileKey(directory,'SETUP','.DAT');
 const persistence=await openNativeFilePersistence();let bytes:Uint8Array|null=null,track:number[]|undefined;
 try{const files=await persistence.all();bytes=files.find(file=>file.key===key)?.bytes??null;const storedTrack=files.find(file=>file.key===nativeFileKey(directory,'DEFAULT','.TRK'));if(storedTrack)track=Array.from(storedTrack.bytes);}finally{persistence.close?.();}
 const response=await fetch('/game/setup-initial-data.json',{signal});if(!response.ok)throw Error('Original SETUP initialized data could not load');const initial=await response.json() as {data:string};
 if(signal.aborted)throw new DOMException('Game configuration load closed','AbortError');
 const memory=Uint8Array.from(initial.data.match(/../g)??[],byte=>parseInt(byte,16));
 let configuredSelection;
 if(bytes)configuredSelection=await readOriginalSetupSelection(memory,bytes);
 else{
  const installed=await mt32Installed(signal);if(signal.aborted)throw new DOMException('Game configuration load closed','AbortError');
  configuredSelection=await readOriginalSetupSelection(memory,browserDefaultSetup(installed));
  return {directory,selection:configuredSelection,configuredSelection,track,mt32Fallback:!installed};
 }
 if(configuredSelection.sound!==5)return {directory,selection:configuredSelection,configuredSelection,track,mt32Fallback:false};
 const installed=await mt32Installed(signal);if(signal.aborted)throw new DOMException('Game configuration load closed','AbortError');
 const selection=installed?configuredSelection:{...configuredSelection,sound:4};
 return {directory,selection,configuredSelection,track,mt32Fallback:!installed};
}
