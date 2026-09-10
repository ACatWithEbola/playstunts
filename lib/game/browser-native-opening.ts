import type {BrowserOpeningDisplay} from './browser-opening-exit.ts';
import {runBrowserNativeTitleCards} from './browser-native-title-cards.ts';
import {runBrowserNativeIntro} from './browser-native-intro.ts';
import {runBrowserNativeCredits} from './browser-native-credits.ts';
import type {NativeBrowserDisplayMode} from './browser-native-display-race.ts';
import type {BrowserNativeDemoData} from './browser-native-demo.ts';
import type {Assets} from './types.ts';
/** The source outer opening order. A skipped stage proceeds to the main menu. */
export async function runBrowserNativeOpening(canvas:HTMLCanvasElement,mode:NativeBrowserDisplayMode,signal:AbortSignal,data:BrowserNativeDemoData,assets:Assets,seed:ReadonlyArray<number>,onStage:(stage:string)=>void=()=>{},hercules=false){
 let display:BrowserOpeningDisplay|undefined;const retain=(value:BrowserOpeningDisplay)=>{display=value;};
 onStage('title cards');const titleKey=await runBrowserNativeTitleCards(canvas,mode,signal,hercules,retain);
 if(titleKey)return {key:titleKey,randomState:Array.from(seed),display};
 onStage('animated logo');const intro=await runBrowserNativeIntro(canvas,mode,signal,data,assets,seed,hercules,retain);
 let key=intro.key;
 if(!key){onStage('credits');key=await runBrowserNativeCredits(canvas,mode,signal,hercules,retain);}
 return {key,randomState:intro.randomState,display};
}
