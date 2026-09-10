import {focusBrowserGameCanvas} from './browser-game-focus.ts';
import {originalAnimatedOpeningSkip} from './opening-exit-flow.ts';
import type {BrowserOpeningDisplay} from './browser-opening-exit.ts';
import {createBrowserHerculesPresenter} from './browser-hercules-presenter.ts';
import {prepareNativeDisplayIntroResources} from './native-display-intro-resources.ts';
import {loadBrowserNativeInitialDisplayData,nativeRaceDisplayPalette,type NativeBrowserDisplayMode} from './browser-native-display-race.ts';
import {originalPackedDisplayPixels} from './packed-display-pixels.ts';
import {createBrowserMenuInput} from './browser-menu-input.ts';
import {initializeOriginalCarSimulation} from './initialize-car-simulation.ts';
import {initializeOriginalIntroScene,originalIntroRoute} from './initialize-intro-scene.ts';
import {createOriginalIntroDriving,type IntroDrivingData} from './intro-driving.ts';
import {initialOriginalIntroCamera,advanceOriginalIntroCamera} from './intro-camera.ts';
import {trackOpponentRoutePoint} from '../physics/track-route-point.ts';
import type {Vector} from '../physics/math.ts';
import type {BrowserNativeDemoData} from './browser-native-demo.ts';
import type {Assets} from './types.ts';
/** Original camera and opponent simulation, rendered through fresh display resources. */
export async function runBrowserNativeIntro(canvas:HTMLCanvasElement,mode:NativeBrowserDisplayMode,signal:AbortSignal,data:BrowserNativeDemoData,assets:Assets,seed:ReadonlyArray<number>,hercules=false,onFinish?:(display:BrowserOpeningDisplay)=>void){
 const presentHercules=hercules?createBrowserHerculesPresenter(canvas):undefined;
 const aborted=()=>{if(signal.aborted)throw new DOMException('Native intro closed','AbortError');};
 const response=await fetch('/game/native-race-startup.bin',{signal});if(!response.ok)throw Error('Original intro simulation startup could not load');
 const startup=new Uint8Array(await response.arrayBuffer()),d=0x2d1a0,tuning=assets.cars.find(car=>car.id==='COUN') as unknown as IntroDrivingData['tuning']&{rawSimulation:string},raw=assets.tracks.find(track=>track.name==='DEFAULT')?.raw;
 if(!tuning||!raw)throw Error('Original intro Countach or track is missing');
 const simulation=Uint8Array.from(tuning.rawSimulation.match(/../g)!,hex=>parseInt(hex,16)),drivingData:IntroDrivingData={...data,tuning,simulation,raw};
 initializeOriginalCarSimulation(startup,d,simulation,true);
 initializeOriginalIntroScene(startup,d,(entry,point)=>{const target=trackOpponentRoutePoint(raw,originalIntroRoute,entry,point,data.records,data.points,data.objects,data.indices,startup.subarray(d+0x9362,d+0x9362+511));return {...target,midpoint:target.midpoint as Vector,first:target.first as Vector,second:target.second as Vector};});
 const driving=createOriginalIntroDriving(startup.subarray(d,d+65536),drivingData),display=await prepareNativeDisplayIntroResources(mode,await loadBrowserNativeInitialDisplayData(mode,hercules),data.catalog,seed),{owner}=display;
 aborted();const input=createBrowserMenuInput(canvas,{onPoll:aborted}),surface=document.createElement('canvas');surface.width=320;surface.height=200;
 const raster=surface.getContext('2d')!,context=canvas.getContext('2d')!,image=raster.createImageData(320,200),palette=nativeRaceDisplayPalette(mode,owner.memory(),owner.d);
 const closeInput=()=>input.close();signal.addEventListener('abort',closeInput,{once:true});
 const present=()=>{
   if(presentHercules)presentHercules(owner);else{
   const pixels=mode==='ega'?owner.aperture.pixels(320,200,40,0):originalPackedDisplayPixels(owner.memory(),mode);
   for(let i=0;i<64000;i++){const colour=pixels[i]*3;image.data[i*4]=palette[colour];image.data[i*4+1]=palette[colour+1];image.data[i*4+2]=palette[colour+2];image.data[i*4+3]=255;}
   raster.putImageData(image,0,0);context.setTransform(1,0,0,1,0,0);context.imageSmoothingEnabled=false;context.drawImage(surface,0,0,canvas.width,canvas.height);
   }
 };
 let camera=initialOriginalIntroCamera(),previous=input.counter();
 try{
  focusBrowserGameCanvas(canvas);
  for(;;){
   await input.nextFrame();aborted();const now=input.counter(),delta=(now-previous)&65535,current=advanceOriginalIntroCamera(camera,delta,()=>{driving.tick();},()=>({position:driving.car.pose.position,heading:driving.car.pose.rotation[0]}));previous=now;camera=current.state;
   display.renderer.render(current.draw,{position:driving.car.pose.position,heading:driving.car.pose.rotation[0]});
   present();
   const key=input.readImmediate(delta).key;if(key||current.finished){onFinish?.({owner,present});return {key:originalAnimatedOpeningSkip(key),randomState:display.randomState};}
  }
 }finally{signal.removeEventListener('abort',closeInput);input.close();}
}
