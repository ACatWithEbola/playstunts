import {originalSetupTextBlink,SETUP_VGA_REFRESH_HZ} from './setup-text-blink.ts';
import {NATIVE_GAME_DIRECTORY_KEY,browserDefaultSetup} from './browser-setup-selection.ts';
import {loadBrowserSetupMedia} from './browser-setup-media.ts';
import {createBrowserSetupInput} from './browser-setup-input.ts';
import {createOriginalSetupMemory} from './initialize-setup-state.ts';
import {createOriginalSetupTextScreen} from './setup-text-screen.ts';
import {renderOriginalSetupTextPixels} from './setup-text-pixels.ts';
import {originalSetupVgaCursor} from './setup-vga-cursor.ts';
import {egaPaletteRgb} from './ega-display-palette.ts';
import {createNativeSetupStorage} from './native-setup-storage.ts';
import {openNativeFilePersistence} from './native-file-store.ts';
import {browserMt32Installed} from './browser-mt32-installation.ts';
import {runNativeSetupProgram} from './native-setup-program.ts';
/** Browser boundary for original SETUP; all menu and installation decisions
 * remain in the source-derived program. BIOS bell output is caller-owned. */
export async function runBrowserNativeSetup(canvas:HTMLCanvasElement,signal:AbortSignal,host:{bell():void|Promise<void>;ready?():void;browserSettings?:boolean}){
 const [media,initialResponse,fontResponse,mt32Installed]=await Promise.all([loadBrowserSetupMedia(signal),fetch('/game/setup-initial-data.json',{signal}),fetch('/game/reference-text-font.bin',{signal}),browserMt32Installed(signal)]);
 if(!initialResponse.ok||!fontResponse.ok)throw Error('Original SETUP presentation resources could not load');
 const initial=await initialResponse.json() as {data:string},font=new Uint8Array(await fontResponse.arrayBuffer()),memory=createOriginalSetupMemory(Uint8Array.from(initial.data.match(/../g)??[],byte=>parseInt(byte,16))),screen=createOriginalSetupTextScreen();
 if(signal.aborted)throw new DOMException('Native SETUP closed','AbortError');
 // The ready-to-play distribution is also available at C:\, while A: stays
 // read-only for the source installer's disk checks and file-copy operations.
 const mounted=new Map(media);for(const [path,file] of media)mounted.set('C:'+path.slice(2),file);
 mounted.set('C:\\SETUP.DAT',{bytes:browserDefaultSetup(mt32Installed),timestamp:0});
 const persistence=await openNativeFilePersistence();
 let animation=0,renderError:unknown;
 let storage:Awaited<ReturnType<typeof createNativeSetupStorage>>|undefined,input:ReturnType<typeof createBrowserSetupInput>|undefined;
 try{
  storage=await createNativeSetupStorage(mounted,persistence);const directory=localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\';if(storage.changeDirectory(directory)!==0)throw Error('Saved virtual game directory is missing');storage.changeDrive(directory.charCodeAt(0)-65);if(signal.aborted)throw new DOMException('Native SETUP closed','AbortError');
  input=createBrowserSetupInput(canvas,signal);canvas.width=720;canvas.height=400;const context=canvas.getContext('2d');if(!context)throw Error('SETUP canvas could not open');
  const image=context.createImageData(720,400),palette=Array.from({length:16},(_,i)=>egaPaletteRgb((i&7)|(i&8?16:0),'cga-compatible'));let shape=0x2000,blinkFrame=0;const epoch=performance.now();
  const present=()=>{const blink=originalSetupTextBlink(blinkFrame),pixels=renderOriginalSetupTextPixels(screen,font,{blinkVisible:blink.textVisible,cursor:originalSetupVgaCursor(shape,blink.cursorVisible)});for(let i=0;i<pixels.length;i++){const rgb=palette[pixels[i]],at=i*4;image.data[at]=rgb[0];image.data[at+1]=rgb[1];image.data[at+2]=rgb[2];image.data[at+3]=255;}context.putImageData(image,0,0);};
  const animate=()=>{try{const next=Math.floor((performance.now()-epoch)*SETUP_VGA_REFRESH_HZ/1000);if((next&16)!==(blinkFrame&16)){blinkFrame=next;present();}animation=requestAnimationFrame(animate);}catch(error){renderError=error;input?.close();}};animation=requestAnimationFrame(animate);
  canvas.focus({preventScroll:true});host.ready?.();
  const exitCode=await runNativeSetupProgram(memory,screen,storage,{key:input.key,pollKey:input.pollKey,present,cursorShape(value){shape=value;},bell:host.bell,detectVideo:()=>4},{browserSettings:host.browserSettings});
  const finalDirectory=storage.resolve('');if(exitCode===0)localStorage.setItem(NATIVE_GAME_DIRECTORY_KEY,finalDirectory);
  return {exitCode,directory:finalDirectory,configuration:await storage.read('SETUP.DAT')};
 }catch(error){throw renderError??error;}finally{cancelAnimationFrame(animation);input?.close();persistence.close?.();}
}
