import {focusBrowserGameCanvas} from './browser-game-focus.ts';
import {originalOpeningExitDialog} from './opening-exit-flow.ts';
import {createBrowserMenuInput} from './browser-menu-input.ts';
import {interactNativeOriginalDialog} from './native-dialog-interaction.ts';
import {drawOriginalDialog} from './dialog-raster.ts';
import {createNativeDisplayDialogRuntime} from './native-display-dialog-runtime.ts';
import {captureNativeDisplayDialogBackground} from './native-display-dialog-background.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
export interface BrowserOpeningDisplay {owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>;present():void}
/** Main2D16..2D4E: original exit confirmation after Escape from the opening.
 * The current opening framebuffer remains the background in every display. */
export async function confirmBrowserOpeningExit(canvas:HTMLCanvasElement,signal:AbortSignal,native?:BrowserOpeningDisplay){
 const response=await fetch('/game/main-dialog-text.json',{signal});if(!response.ok)throw Error('Original exit prompt could not load');
 const {resources}=await response.json() as {resources:Record<string,number[]>};
 const input=createBrowserMenuInput(canvas,{onPoll(){if(signal.aborted)throw new DOMException('Opening closed','AbortError');}}),close=()=>input.close();signal.addEventListener('abort',close,{once:true});
 try{
  focusBrowserGameCanvas(canvas);
  if(native){
   const {owner}=native,present=()=>native.present(),m=owner.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);
   const dialogs=createNativeDisplayDialogRuntime({...input,input:input.read,memory:()=>owner.memory(),d:owner.d,mode:owner.mode,drawing:owner.drawing,resources,present,capture:retain=>captureNativeDisplayDialogBackground(owner,retain)},0xe800);
   const answer=await dialogs.dialog(originalOpeningExitDialog.resource,originalOpeningExitDialog.mode,originalOpeningExitDialog.selected,v.getUint16(owner.d+0x4ec2,true));
   return answer;
  }
  const [fontResponse,paletteResponse]=await Promise.all([fetch('/game/fontdef.fnt',{signal}),fetch('/game/track-materials.json',{signal})]);
  if(!fontResponse.ok||!paletteResponse.ok)throw Error('Original exit dialog drawing resources could not load');
  const font=new Uint8Array(await fontResponse.arrayBuffer()),{palette}=await paletteResponse.json() as {palette:number[]},pixels=new Uint8Array(65536);
  const context=canvas.getContext('2d')!,saved=document.createElement('canvas');saved.width=canvas.width;saved.height=canvas.height;saved.getContext('2d')!.drawImage(canvas,0,0);
  const surface=document.createElement('canvas');surface.width=320;surface.height=200;const drawing=surface.getContext('2d')!,image=drawing.createImageData(320,200);
  const restore=()=>{context.setTransform(1,0,0,1,0,0);context.drawImage(saved,0,0);};
  const result=await interactNativeOriginalDialog({font,input:input.read,release:()=>input.release(),gameCounter:()=>input.gameCounter(),restore,draw(selection){
   const {layout}=drawOriginalDialog(pixels,font,resources.edos,selection,{text:15,border:4,disabled:1},undefined,2);
   const [left,right,top,bottom]=layout.bounds;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const at=y*320+x,c=pixels[at]*3;image.data.set([palette[c],palette[c+1],palette[c+2],255],at*4);}
   drawing.putImageData(image,0,0);restore();context.imageSmoothingEnabled=false;
   context.drawImage(surface,left,top,right-left,bottom-top,left*canvas.width/320,top*canvas.height/200,(right-left)*canvas.width/320,(bottom-top)*canvas.height/200);
  }},resources.edos,originalOpeningExitDialog.mode,originalOpeningExitDialog.selected);
  return result;
 }finally{signal.removeEventListener('abort',close);input.close();}
}
