import type {readOriginalSetupSelection} from './read-setup-selection.ts';
import type {NativeBrowserDisplayMode} from './browser-native-display-race.ts';
/** Supplied SETUP menu IDs. Refuse missing browser backends rather than
 * silently starting with a different display or sound card. */
export function nativeLaunchProfile(selection:Awaited<ReturnType<typeof readOriginalSetupSelection>>){
 const displays:Record<number,NativeBrowserDisplayMode|undefined>={0:'cga',1:'cga',2:'ega',3:'tandy',4:undefined};
 if(!Object.hasOwn(displays,selection.video))throw Error('The saved display setting is not supported. Check Setup.');
 if(![0,1,2,3,4,5].includes(selection.sound))throw Error('The saved sound setting is not supported. Check Setup.');
 return {displayMode:displays[selection.video],soundDevice:selection.sound===5?'mt32' as const:selection.sound===2?'tandy' as const:selection.sound<=1?'pc-speaker' as const:undefined,initiallyMuted:selection.sound===0,...(selection.video===1?{hercules:true}:{})};
}

/** /ns calls the original music toggle followed by the effects toggle once.
 * Keep both controls available afterwards, as in the supplied executable. */
export function applyNativeStartupAudio(initiallyMuted:boolean,control:(operation:'toggle-music'|'toggle-sound')=>unknown){
 if(initiallyMuted){control('toggle-music');control('toggle-sound');}
}
