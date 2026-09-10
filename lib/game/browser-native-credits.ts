import {focusBrowserGameCanvas} from './browser-game-focus.ts';
import type {BrowserOpeningDisplay} from './browser-opening-exit.ts';
import {createBrowserHerculesPresenter} from './browser-hercules-presenter.ts';
import {prepareNativeDisplayCredits} from './native-display-credits.ts';
import {loadBrowserNativeInitialDisplayData,nativeRaceDisplayPalette,type NativeBrowserDisplayMode} from './browser-native-display-race.ts';
import {loadBrowserOriginalResourceCatalog} from './native-resource-catalog.ts';
import {originalPackedDisplayPixels} from './packed-display-pixels.ts';
import {createBrowserMenuInput} from './browser-menu-input.ts';
import {originalInputWait} from './input-repeat.ts';
/** Browser timing/input for the unchanged source title-card generators. */
export async function runBrowserNativeCredits(canvas:HTMLCanvasElement,mode:NativeBrowserDisplayMode,signal:AbortSignal,hercules=false,onFinish?:(display:BrowserOpeningDisplay)=>void){
 const presentHercules=hercules?createBrowserHerculesPresenter(canvas):undefined;
 const context=canvas.getContext('2d')!,surface=document.createElement('canvas');surface.width=320;surface.height=200;const drawing=surface.getContext('2d')!,image=drawing.createImageData(320,200),aborted=()=>{if(signal.aborted)throw new DOMException('Native credits closed','AbortError');};
 const input=createBrowserMenuInput(canvas,{onPoll:aborted});const closeInput=()=>input.close();signal.addEventListener('abort',closeInput,{once:true});let display:Awaited<ReturnType<typeof prepareNativeDisplayCredits>>|undefined;
 const present=()=>{if(!display)return;if(presentHercules){presentHercules(display.owner);return;}const {owner}=display,palette=nativeRaceDisplayPalette(mode,owner.memory(),owner.d),pixels=mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode);for(let i=0;i<64000;i++){const c=pixels[i];image.data[i*4]=palette[c*3];image.data[i*4+1]=palette[c*3+1];image.data[i*4+2]=palette[c*3+2];image.data[i*4+3]=255;}drawing.putImageData(image,0,0);context.setTransform(1,0,0,1,0,0);context.imageSmoothingEnabled=false;context.drawImage(surface,0,0,canvas.width,canvas.height);};
 try{
  display=await prepareNativeDisplayCredits(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),await loadBrowserOriginalResourceCatalog(),present);aborted();focusBrowserGameCanvas(canvas);let previous=input.counter();
  const timed=async(flow:Generator<{type:'timer'}|{type:'input';delta:number},number,number>)=>{let step=flow.next();while(!step.done){aborted();let value:number;if(step.value.type==='timer'){await input.nextFrame();const now=input.counter();value=(now-previous)&65535;previous=now;}else value=input.readImmediate(step.value.delta).key;step=flow.next(value);}return step.value;};
  const flow=display.credits();let step=flow.next();while(!step.done){aborted();const request=step.value;let value:number;if(request.type==='timer'){await input.nextFrame();const now=input.counter();value=(now-previous)&65535;previous=now;}else if(request.type==='input')value=input.readImmediate(request.delta).key;else value=await timed(request.type==='present'?display.presentation(request.mode):originalInputWait(request.duration));step=flow.next(value);}onFinish?.({owner:display.owner,present});return step.value;
 }finally{signal.removeEventListener('abort',closeInput);try{display?.release();}finally{input.close();}}
}
