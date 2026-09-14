import {bundledTrackReplays} from './bundled-track-replays.ts';
import showroomMaterials from '../../public/game/track-materials.json';
import {createUpgradedCarMenu} from './upgraded-car-menu';
import type {createUpgradedRaceScene} from './upgraded-race-scene';
export interface BrowserGraphicsSwitch {enabled:boolean;chaseCamera?:0|1|2|3;selectOriginalCamera?:()=>void;refresh?:()=>void;notice?:(message:string)=>void;performanceFrame?:(at:number)=>void;resetPerformance?:()=>void;setPerformancePaused?:(paused:boolean)=>void;}
import {focusBrowserGameCanvas} from './browser-game-focus.ts';
import {createBrowserHerculesPresenter} from './browser-hercules-presenter.ts';
import {prepareBrowserNativeMainMenu} from './browser-native-display-race.ts';
import {createNativeDisplayOptionsPresentation} from './native-display-options-presentation.ts';
import {prepareBrowserNativeMenuDisplay} from './browser-native-display-race.ts';
import {createNativeDisplayEditorPresentation} from './native-display-editor-presentation.ts';
import {prepareBrowserNativeEditorDisplay} from './browser-native-display-race.ts';
import {createNativeDisplayTrackPresentation} from './native-display-track-presentation.ts';
import {prepareBrowserNativeTrackDisplay} from './browser-native-display-race.ts';
import {createNativeDisplayCarPresentation} from './native-display-car-presentation.ts';
import {prepareBrowserNativeCarDisplay,prepareBrowserNativeOpponentDisplay} from './browser-native-display-race.ts';
import {loadBrowserOriginalResourceCatalog} from './native-resource-catalog.ts';
import {createNativeDisplayResultsPresentation} from './native-display-results-presentation.ts';
import {prepareBrowserNativeResultsDisplay,type NativeBrowserDisplayMode} from './browser-native-display-race.ts';
import {drawOriginalRaceWaitingDisplay} from './race-waiting-display.ts';
import {editNativeDisplaySaveName} from './native-display-save-name.ts';
import {editNativeDisplayPath} from './native-display-path-entry.ts';
import {drawOriginalDialogDisplay} from './dialog-display.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
import {createNativeDisplayDialogRuntime} from './native-display-dialog-runtime.ts';
import {captureNativeDisplayDialogBackground} from './native-display-dialog-background.ts';
import type {prepareBrowserNativeManualDisplay} from './browser-native-display-race.ts';
import {runAllocatedRaceResults} from './native-allocated-race-results.ts';
import {drawOriginalRaceWaiting} from './race-waiting-dialog.ts';
import {loadAllocatedReplay,type AllocatedReplayLoadServices} from './allocated-replay-load.ts';
import type {NativeDemoData} from './native-demo-runtime.ts';
import {selectAllocatedMouseControl,selectAllocatedGraphicsLevel} from './allocated-mouse-selection.ts';
import {drawOriginalFont,measureOriginalFont} from './font-raster.ts';
import {originalElapsedInputTicks} from './elapsed-input-ticks.ts';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import {createNativeReplayBar,type NativeReplayBarArt} from './native-replay-bar.ts';
import {saveNativeReplay} from './native-replay-save.ts';
import type {createNativeRaceSession} from './native-race-session.ts';
import {runNativeMenuCoordinator} from './native-menu-coordinator.ts';
import {runNativeMainMenuSelection} from './native-main-menu.ts';
import {restoreOriginalMainMenuPixels} from './main-menu-raster.ts';
import {originalMainMenuBounds} from './main-menu-hit.ts';
import {ENHANCED_STATIC_ARTWORK,loadEnhancedStaticArtwork} from './enhanced-static-artwork.ts';
import {runNativeCarMenu,type NativeCarMenuHost} from './native-car-runtime.ts';
import {runNativeOpponentMenu,type NativeOpponentHost} from './native-opponent-runtime.ts';
import {runNativeOptions,type NativeOptionsHost} from './native-options-runtime.ts';
import {runNativeTrackMenu,type NativeTrackMenuHost} from './native-track-runtime.ts';
import {runNativeEditor,type NativeEditorHost} from './native-editor-runtime.ts';
import {createBrowserMenuInput} from './browser-menu-input.ts';
import {createNativeFileStore,openNativeFilePersistence,nativeFileKey} from './native-file-store.ts';
import {createNativeEditorFileWrites} from './native-editor-file-writes.ts';
import {editNativeSaveName} from './native-save-name.ts';
import {editNativePath} from './native-path-entry.ts';
import {expandEditorArt} from './editor-art-expand.ts';
import {drawOriginalDialog} from './dialog-raster.ts';
import {createOriginalJoystickCalibration} from './joystick-calibration.ts';
import {decodeOriginalReplayFile} from './replay-file.ts';
import type {createNativeMusic} from './native-music.ts';
import type {NativeDialogHost} from './native-dialog-runtime.ts';
import {createNativeDialogRuntime} from './native-dialog-runtime.ts';
import {runNativeRaceResults,type NativeRaceResultsState,type NativeRaceResultsHost,type NativeEvaluationResources} from './native-race-results.ts';
import type {NativeHighScorePreparationHost} from './native-high-score-preparation.ts';
import type {Assets} from './types.ts';
const ENHANCED_BACKGROUND_ROOT='/site/enhanced-backgrounds';
const enhancedTrackOverviews=['desert','tropical','alpine','city','country'].map(name=>`${ENHANCED_BACKGROUND_ROOT}/${name}-overview.png`);
type TextResources={resources:NativeDialogHost['resources']};
type ScreenResources=NativeEditorHost['screenResources'];
type RouteResources=NativeEditorHost['routeResources'];
export interface BrowserNativeMenuOptions {
 graphics?:BrowserGraphicsSwitch;canvas:HTMLCanvasElement;assets:Assets;music:Awaited<ReturnType<typeof createNativeMusic>>;
 settings?:NativeOptionsHost['settings'];signal?:AbortSignal;displayMode?:NativeBrowserDisplayMode;hercules?:boolean;configuration?:number[];track?:NativeTrackMenuHost['track'];onScreen?:(screen:string)=>void;
}
/** Browser services for the native menus. The caller handles intro/race/exit
 * transitions; all submenus use the same live configuration and file overlay. */
export async function createBrowserNativeMenus(options:BrowserNativeMenuOptions){
 const json=async<T>(name:string):Promise<T>=>{const r=await fetch('/game/'+name+'.json');if(!r.ok)throw Error('Original menu resource could not load: '+name);return r.json() as Promise<T>;};
 const binary=async(name:string)=>{const r=await fetch('/game/'+name);if(!r.ok)throw Error('Original menu resource could not load: '+name);return new Uint8Array(await r.arrayBuffer());};
 const enhancedMainMenuPromise=loadEnhancedStaticArtwork(ENHANCED_STATIC_ARTWORK.mainMenu);
 const [misc,mainText,trackText,materials,font,smallFont,baseline,ground,panoramas,opponentArt,carArt,art,paletteMemory,terrainNames,packedArt,objects,records,metadataVectors,sampleVectors,presets,errorKeys,scores]=await Promise.all([
  json<TextResources>('misc-dialog-text'),json<TextResources>('main-dialog-text'),json<TextResources>('track-menu-text'),json<{palette:number[]}>('track-materials'),binary('fontdef.fnt'),binary('fontn.fnt'),binary('native-render-resources.bin'),json<{resources:NativeTrackMenuHost['groundModels']}>('overview-ground-models'),json<NativeTrackMenuHost['panoramas']>('menu-panorama-art'),json<{resources:NativeOpponentHost['art'];descriptions:NativeOpponentHost['descriptions']}>('opponent-menu-art'),json<{resources:NativeCarMenuHost['art'];descriptions:NativeCarMenuHost['descriptions']}>('car-menu-art'),json<Array<ScreenResources['art'][number]&{labelResource:string}>>('editor-tile-art'),json<{bytes:number[]}>('editor-palette-memory'),json<{names:ScreenResources['terrainNames']}>('editor-terrain-art'),json<{resources:Record<string,{bytes:number[]}>}>('editor-art'),json<ScreenResources['objects']>('track-objects'),json<RouteResources['records']>('route-records'),json<RouteResources['metadataVectors']>('route-vectors'),json<RouteResources['sampleVectors']>('route-sample-vectors'),json<NativeEditorHost['presets']>('editor-terrain-presets'),json<{keys:string[]}>('editor-error-keys'),json<Record<string,{file:string}>>('high-scores/manifest'),
 ]);

 const mainMenuArt=await binary('main-menu-art.bin'),enhancedMainMenu=await enhancedMainMenuPromise;
 const original=bundledTrackReplays(options.assets.tracks,binary);
 for(const [name,entry] of Object.entries(scores))original.set(nativeFileKey('',name,'.hig'),()=>binary('high-scores/'+entry.file));
 const files=await createNativeFileStore(original,await openNativeFilePersistence());
 const drivingSettings={...(options.settings??{mouse:false,joystick:false,graphics:2})};
 let activeRace:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>|undefined,racePoll:(()=>void|Promise<void>)|undefined;
 const presentHercules=options.hercules?createBrowserHerculesPresenter(options.canvas):undefined;
 const {canvas,music}=options,context=canvas.getContext('2d')!,surface=document.createElement('canvas');surface.width=320;surface.height=200;
 const drawing=surface.getContext('2d')!,image=drawing.createImageData(320,200),pixels=new Uint8Array(65536),input=createBrowserMenuInput(canvas,{joystickEnabled:()=>activeRace?!!activeRace.session.state.memory[0x2d1a0+0x4602]:drivingSettings.joystick,drivingBindings:()=>activeRace?activeRace.session.state.memory.subarray(0x2d1a0+0x430a,0x2d1a0+0x4314):[57,28,71,72,73,77,81,80,79,75],onPoll:()=>{if(options.signal?.aborted)throw new DOMException('Native menu closed','AbortError');return racePoll?.();}}),palette=materials.palette;
 const configuration=options.configuration??[67,79,85,78,0,1,0,255,0,0,0,0,0,68,69,70,65,85,76,84,0,0,1,0];
 const track=options.track??{name:'DEFAULT',path:'',raw:[...options.assets.tracks.find(t=>t.name==='DEFAULT')!.raw]};
 let entryPolls=0,selectedReplay:{bytes:Uint8Array;name:string;path:string}|undefined;
 // Original1AD1C forwards its literal1 to the complete device poll.
 // Fast-forward simulation is not gated to one browser frame per step.
 const fastForwardKey=async()=>{if((entryPolls++&15)===0)await input.nextFrame();return input.readImmediate(1).key;};
 let screen='main',outline:[number,number]|undefined,replay:ReturnType<typeof decodeOriginalReplayFile>|undefined;
 const show=(name:string)=>{screen=name;if(name!=='race'){canvas.style.cursor='';if(options.graphics?.enabled)options.graphics.notice?.('Upgraded graphics selected · experimental');}options.onScreen?.(name);};
 let lastNativeDisplay:Awaited<ReturnType<typeof prepareBrowserNativeMenuDisplay>>|undefined;
 const paint=(displayPalette=palette,nativeDisplay?:Awaited<ReturnType<typeof prepareBrowserNativeMenuDisplay>>,scanoutOwner?:{memory():Uint8Array;d:number})=>{
  if(options.graphics)options.graphics.refresh=screen==='main'?()=>paint(displayPalette,nativeDisplay,scanoutOwner):undefined;
  if(nativeDisplay)lastNativeDisplay=nativeDisplay;
  if(presentHercules){const owner=scanoutOwner??lastNativeDisplay?.owner;if(!owner)throw Error('Native Hercules display owner is missing');presentHercules(owner);return;}
  context.setTransform(1,0,0,1,0,0);context.imageSmoothingEnabled=false;
  if(screen==='main'&&!options.displayMode)restoreOriginalMainMenuPixels(pixels,mainMenuArt,outline);
  {for(let i=0;i<64000;i++){const c=pixels[i];image.data[i*4]=displayPalette[c*3];image.data[i*4+1]=displayPalette[c*3+1];image.data[i*4+2]=displayPalette[c*3+2];image.data[i*4+3]=255;}drawing.putImageData(image,0,0);}
  if(screen==='main'&&!options.displayMode&&options.graphics?.enabled&&enhancedMainMenu){
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(enhancedMainMenu,0,0,canvas.width,canvas.height);
   if(outline){const [selection,color]=outline,[left,top,right,bottom]=originalMainMenuBounds[selection],sx=canvas.width/320,sy=canvas.height/200,c=color*3;context.fillStyle=`rgb(${displayPalette[c]} ${displayPalette[c+1]} ${displayPalette[c+2]})`;context.fillRect(left*sx,top*sy,(right-left+1)*sx,sy);context.fillRect(left*sx,bottom*sy,(right-left+1)*sx,sy);context.fillRect(left*sx,top*sy,sx,(bottom-top+1)*sy);context.fillRect(right*sx,top*sy,sx,(bottom-top+1)*sy);}
  }else context.drawImage(surface,0,0,canvas.width,canvas.height);
 };
 const present=()=>paint();
 const host={pixels,font,smallFont,resources:{...misc.resources,...mainText.resources},present,input:input.read,release:input.release,gameCounter:input.gameCounter,counter:input.counter,waitTicks:input.waitTicks,enumerate:async(path:string,extension:string)=>files.enumerate(path,extension),editPath:(path:string,length:number,timeout:number,field:{x:number;y:number})=>editNativePath({pixels,font,present,counters:input.counters,keyboard:input.keyboard},path,length,timeout,field)};
 const trackHost={...host,resources:{...host.resources,...trackText.resources}};
 // Normal source mouse polling writes DS:893A, not the adjacent editor row
 // word DS:A38C. Keep that word from the captured initialized source image.
 const editor:NativeEditorHost={...trackHost,track,mainFrameBP:0xeefe,retainedMouseButtons:()=>baseline[0x2d1a0+0xa38c]|baseline[0x2d1a0+0xa38d]<<8,screenResources:{font,text:trackHost.resources,objects,art,labelKeys:art.map(a=>a.labelResource),pages:Array.from({length:11},(_,i)=>paletteMemory.bytes.slice(i*36)),terrainNames:terrainNames.names,images:Object.fromEntries(Object.entries(packedArt.resources).filter(([name])=>name!=='!cg0').map(([name,r])=>[name,expandEditorArt(r.bytes)]))},routeResources:{objects,records,metadataVectors,sampleVectors},presets,errorKeys:errorKeys.keys,saveName:state=>editNativeSaveName(trackHost,state,'Track'),exists:async(path,name)=>files.exists(path,name,'.trk'),...createNativeEditorFileWrites(files),readTrack:(path,name)=>files.read(path,name,'.trk')};
 const car=async(config:number[],opponent:number)=>{
  show('car');focusBrowserGameCanvas(canvas);const carHost:NativeCarMenuHost={...host,configuration:config,opponent,opponentArt:opponent?opponentArt.resources['opp'+opponent]:undefined,baseline,cars:options.assets.cars as unknown as NativeCarMenuHost['cars'],art:carArt.resources,descriptions:carArt.descriptions,bank:id=>binary('car-models/'+id.toLowerCase()+'.bin')};
  if(!options.displayMode){
   const preview=document.createElement('canvas');preview.width=canvas.width;preview.height=canvas.height;const previewContext=preview.getContext('2d')!;
   const base=document.createElement('canvas');base.width=320;base.height=200;const baseContext=base.getContext('2d')!,baseImage=baseContext.createImageData(320,200);
   let modelMemory:Uint8Array|undefined,showroom:ReturnType<typeof createUpgradedCarMenu>|undefined,failed=false;
   const presentCar=()=>{paint();if(options.graphics){options.graphics.refresh=presentCar;if(options.graphics.enabled&&modelMemory&&!failed){try{showroom??=createUpgradedCarMenu(palette,showroomMaterials.indices);previewContext.setTransform(1,0,0,1,0,0);previewContext.imageSmoothingEnabled=false;previewContext.drawImage(base,0,0,preview.width,preview.height);previewContext.drawImage(showroom.draw(modelMemory,preview.width,preview.height),0,0);if(showroom.lastBuildMilliseconds!==undefined)canvas.dataset.upgradedCarBuildMs=showroom.lastBuildMilliseconds.toFixed(1);}catch{failed=true;showroom?.close();showroom=undefined;options.graphics.notice?.('Upgraded car preview unavailable; original graphics remain active.');return;}context.save();context.beginPath();context.rect(0,0,canvas.width,95*canvas.height/200);context.clip();context.drawImage(preview,0,0);context.restore();}}};
   carHost.captureModel=(memory,background)=>{
    for(let i=0;i<64000;i++){const c=background[i]*3;baseImage.data.set([palette[c],palette[c+1],palette[c+2],255],i*4);}baseContext.putImageData(baseImage,0,0);
    modelMemory=memory;
   };
   carHost.present=presentCar;
   try{return await runNativeCarMenu(carHost);}finally{showroom?.close();delete canvas.dataset.upgradedCarBuildMs;if(options.graphics?.refresh===presentCar)options.graphics.refresh=undefined;}
  }
  const display=await prepareBrowserNativeCarDisplay({catalog:await loadBrowserOriginalResourceCatalog()},options.displayMode,options.hercules);
  try{const portrait=opponent?await display.portrait(opponent):()=>{};carHost.present=()=>{pixels.set(display.pixels());paint(display.palette,display);};await runNativeCarMenu(carHost,createNativeDisplayCarPresentation(display,carHost,portrait));}
  finally{display.release();}
 };
 const opponent=async(config:number[])=>{
  show('opponent');focusBrowserGameCanvas(canvas);const opponentHost:NativeOpponentHost={...host,configuration:config,art:opponentArt.resources,descriptions:opponentArt.descriptions,selectCar:async(...args)=>{await car(...args);show('opponent');}};
  if(!options.displayMode)return runNativeOpponentMenu(opponentHost);
  const display=await prepareBrowserNativeOpponentDisplay({catalog:await loadBrowserOriginalResourceCatalog()},options.displayMode,opponentHost,options.hercules);
  opponentHost.present=()=>{pixels.set(display.pixels());paint(display.palette,display);};
  await runNativeOpponentMenu(opponentHost,display.presentation);
 };
 const editTrack=async()=>{
  show('editor');if(!options.displayMode)return runNativeEditor(editor);
  const display=await prepareBrowserNativeEditorDisplay({catalog:await loadBrowserOriginalResourceCatalog()},options.displayMode,{...editor.screenResources,art,terrainNames:terrainNames.names},options.hercules),{owner}=display;
  const present=()=>{pixels.set(display.pixels());paint(display.palette,display);},editPath:NativeDialogHost['editPath']=(path,length,timeout,field)=>editNativeDisplayPath({memory:owner.memory,d:owner.d,mode:owner.mode,drawing:owner.drawing,present,counters:input.counters,keyboard:input.keyboard},path,length,timeout,field,0xe800);
  const displayHost={...editor,memory:owner.memory,d:owner.d,mode:owner.mode,drawing:owner.drawing,capture:(retain:boolean)=>captureNativeDisplayDialogBackground(owner,retain),present,editPath};
  const nativeDialogs=createNativeDisplayDialogRuntime(displayHost,0xe800,{enumerate:host.enumerate,editPath}),dialogs={file:nativeDialogs.file,dialog(resource:string,mode:number,selected=0,border=4,disabled?:ReadonlyArray<number>){const m=owner.memory(),at=border===4?0x4ec2:0x4ec0;return nativeDialogs.dialog(resource,mode,selected,border===4||border===1?(m[owner.d+at]|m[owner.d+at+1]<<8):border,disabled);}};
  try{await runNativeEditor({...editor,present,saveName:state=>editNativeDisplaySaveName(displayHost,state,'Track',0xe800)},createNativeDisplayEditorPresentation(display,dialogs,present));}
  finally{display.release();}
 };
 const selectTrack=async()=>{
  show('track');focusBrowserGameCanvas(canvas);const menuHost:NativeTrackMenuHost={...trackHost,track,configuration,baseline,groundModels:ground.resources,panoramas,loadTrack:async({path,name})=>Array.from(await files.read(path,name,'.trk')),readScores:async(name,path)=>files.exists(path,name,'.hig')?Array.from(await files.read(path,name,'.hig')):null,editTrack:async()=>{await editTrack();show('track');}};
  if(!options.displayMode){
   const upgraded=new Map(enhancedTrackOverviews.map((source,panorama)=>{const image=new Image();image.decoding='async';image.src=source;return [panorama,image] as const;}));
   const layer=document.createElement('canvas'),layerContext=layer.getContext('2d')!,mask=document.createElement('canvas'),maskContext=mask.getContext('2d')!;mask.width=320;mask.height=200;
   const maskImage=maskContext.createImageData(320,200);let backdrop:Uint8Array|undefined,layout:{horizon:number;height:number}|undefined;
   const presentTrack=()=>{
    paint();if(!options.graphics)return;options.graphics.refresh=presentTrack;
    const image=upgraded.get(track.raw[900]&7);
    if(!options.graphics.enabled||!backdrop||!layout||!image?.complete||!image.naturalWidth)return;
    if(layer.width!==canvas.width||layer.height!==canvas.height){layer.width=canvas.width;layer.height=canvas.height;}
    maskImage.data.fill(0);const top=Math.max(0,layout.horizon-layout.height),bottom=Math.min(100,layout.horizon);
    for(let y=top;y<bottom;y++)for(let x=0;x<320;x++){const i=y*320+x;if(pixels[i]===backdrop[i])maskImage.data[i*4+3]=255;}
    maskContext.putImageData(maskImage,0,0);layerContext.setTransform(1,0,0,1,0,0);layerContext.clearRect(0,0,layer.width,layer.height);
    layerContext.imageSmoothingEnabled=true;layerContext.imageSmoothingQuality='high';layerContext.drawImage(image,0,top*canvas.height/200,canvas.width,(bottom-top)*canvas.height/200);
    layerContext.globalCompositeOperation='destination-in';layerContext.imageSmoothingEnabled=false;layerContext.drawImage(mask,0,0,layer.width,layer.height);layerContext.globalCompositeOperation='source-over';
    context.drawImage(layer,0,0);
   };
   upgraded.forEach(image=>{image.onload=()=>options.graphics?.refresh?.();});menuHost.captureOverviewBackdrop=(captured,capturedLayout)=>{backdrop=captured;layout=capturedLayout;};menuHost.present=presentTrack;
   try{return await runNativeTrackMenu(menuHost);}finally{upgraded.forEach(image=>{image.src='';});layer.width=layer.height=1;if(options.graphics?.refresh===presentTrack)options.graphics.refresh=undefined;}
  }
  const display=await prepareBrowserNativeTrackDisplay({catalog:await loadBrowserOriginalResourceCatalog()},options.displayMode,options.hercules),{owner}=display;
  const present=()=>{pixels.set(display.pixels());paint(display.palette,display);};menuHost.present=present;
  const dialogs=createNativeDisplayDialogRuntime({...menuHost,memory:owner.memory,d:owner.d,mode:owner.mode,drawing:owner.drawing,capture:retain=>captureNativeDisplayDialogBackground(owner,retain),present},0xe800,{enumerate:host.enumerate,editPath:(path,length,timeout,field)=>editNativeDisplayPath({memory:owner.memory,d:owner.d,mode:owner.mode,drawing:owner.drawing,present,counters:input.counters,keyboard:input.keyboard},path,length,timeout,field,0xe800)});
  await runNativeTrackMenu(menuHost,false,createNativeDisplayTrackPresentation(display,menuHost,dialogs.file));
 };
 const readSelectedReplay=async({path,name}:{path:string;name:string})=>{const bytes=await files.read(path,name,'.rpl');selectedReplay={bytes:bytes.slice(),name,path};replay=decodeOriginalReplayFile(bytes);configuration.splice(0,24,...replay.header);track.raw=Array.from(bytes.slice(24,0x722));track.name=String.fromCharCode(...configuration.slice(13,22)).split('\0')[0];};
 const settings:NativeOptionsHost={...host,settings:drivingSettings,get replayPath(){return track.path;},set replayPath(path:string){track.path=path;},audio:async operation=>music.control(operation),loadReplay:async({path,name})=>{const waiting=baseline.slice();new DataView(waiting.buffer).setUint16(0x2d1a0+0x8a10,150,true);drawOriginalRaceWaiting(pixels,font,host.resources.ewai,waiting,0x2d1a0);show('race');present();await readSelectedReplay({path,name});},calibrateJoystick:async()=>{
  const saved=pixels.slice();settings.settings.joystick=true;settings.settings.mouse=false;
  const content=drawOriginalDialog(pixels,font,host.resources.ejoy,0,{text:15,border:4,disabled:1},undefined,3),calibration=createOriginalJoystickCalibration(content.fields,r=>{for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)pixels[(y*320+x)&65535]=r.color;},{grid:4,indicator:15});
  for(;;){const sample=await input.read();calibration.step(sample.joystickDirection);present();if(sample.key||sample.joystickButtons){settings.settings.joystick=calibration.finish();break;}}
  pixels.set(saved);present();
 }};
 const selectMain=async()=>{
  show('main');if(!options.displayMode)return runNativeMainMenuSelection({counter:input.counter,input:input.read,redraw:()=>{outline=undefined;present();},selectScreen:()=>{},outline:(selection,color)=>{outline=[selection,color];present();}});
  const display=await prepareBrowserNativeMainMenu({catalog:await loadBrowserOriginalResourceCatalog()},options.displayMode,options.hercules),nativePresent=()=>{pixels.set(display.pixels());paint(display.palette,display);};
  return runNativeMainMenuSelection({counter:input.counter,input:input.read,redraw(){display.redraw();nativePresent();},selectScreen(){},outline(selection,color){display.outline(selection,color);nativePresent();}});
 };
 const selectOptions=async()=>{
  show('options');focusBrowserGameCanvas(canvas);if(!options.displayMode)return runNativeOptions(settings);
  const display=await prepareBrowserNativeMenuDisplay({catalog:await loadBrowserOriginalResourceCatalog()},options.displayMode,options.hercules),{owner}=display,{d,mode,drawing}=owner,present=()=>{pixels.set(display.pixels());paint(display.palette,display);},word=(at:number)=>{const m=owner.memory();return m[d+at]|m[d+at+1]<<8;};
  const nativeDialogs=createNativeDisplayDialogRuntime({...settings,memory:owner.memory,d,mode,drawing,capture:retain=>captureNativeDisplayDialogBackground(owner,retain),present},0xe800,{enumerate:host.enumerate,editPath:(path,length,timeout,field)=>editNativeDisplayPath({memory:owner.memory,d,mode,drawing,present,counters:input.counters,keyboard:input.keyboard},path,length,timeout,field,0xe800)}),dialogs={file:nativeDialogs.file,dialog(resource:string,mode:number,selected=0,border=4,disabled?:ReadonlyArray<number>){return nativeDialogs.dialog(resource,mode,selected,border===4?word(0x4ec2):border===1?word(0x4ec0):border,disabled);}};
  const nativeHost:NativeOptionsHost={...settings,present,get replayPath(){return track.path;},set replayPath(path:string){track.path=path;},loadReplay:async selection=>{const high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode];new DataView(owner.memory().buffer).setUint16(d+0x8a10+high,150,true);drawOriginalRaceWaitingDisplay(owner.memory(),d,mode,drawing,host.resources.ewai,0xe800);present();await readSelectedReplay(selection);},calibrateJoystick:async()=>{
   const restore=captureNativeDisplayDialogBackground(owner,false);drivingSettings.joystick=true;drivingSettings.mouse=false;
   try{const content=drawOriginalDialogDisplay(owner.memory(),d,mode,drawing,host.resources.ejoy,0,{text:word(0x4e8a),border:word(0x4ec2),disabled:word(0x4ec0)},0xe800,undefined,3),calibration=createOriginalJoystickCalibration(content.fields,r=>drawing.rectangle(r.x,r.y,r.width,r.height,r.color),{grid:word(0x4ec2),indicator:word(0x4e8a)});
    for(;;){const sample=await input.read();calibration.step(sample.joystickDirection);present();if(sample.key||sample.joystickButtons){drivingSettings.joystick=calibration.finish();break;}}
   }finally{restore();present();}
  }};
  return runNativeOptions(nativeHost,createNativeDisplayOptionsPresentation(owner,nativeHost,dialogs));
 };
 if(options.displayMode)lastNativeDisplay=await prepareBrowserNativeMenuDisplay({catalog:await loadBrowserOriginalResourceCatalog()},options.displayMode,options.hercules);
 return {configuration,track,elapsedSinceInputPoll:input.elapsedSinceInputPoll,selectOptions,selectCar:car,selectOpponent:opponent,selectTrack,setInputActive:input.setActive,settings:drivingSettings,get replay(){return replay;},get selectedReplay(){return selectedReplay;},raceEntryKey:fastForwardKey,fadeMusic:()=>music.fadeOut(input.waitTicks),close:()=>{input.close();files.close();},
  /** Use the live allocated game banks and retained framebuffer. */
  async allocatedRacePresentation(runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,onPoll:()=>void|Promise<void>,alternate?:Awaited<ReturnType<typeof prepareBrowserNativeManualDisplay>>){
   let upgraded:ReturnType<typeof createUpgradedRaceScene>|undefined,loading=false,closed=false,failed=false;
   const graphics=options.graphics;if(graphics){runtime.enableGraphicsCapture();graphics.resetPerformance?.();}
   const presentWorld=()=>{
    display();if(!graphics)return;graphics.refresh=presentWorld;
    if(!graphics.enabled)return;
    if(failed)return;
    if(!upgraded){if(!loading){loading=true;graphics.notice?.('Loading upgraded driving graphics…');void import('./upgraded-race-scene').then(({createUpgradedRaceScene})=>{if(closed)return;upgraded=createUpgradedRaceScene(options.assets,baseline,runtime,()=>graphics.chaseCamera??0,()=>graphics.selectOriginalCamera?.());graphics.refresh?.();}).catch(()=>{failed=true;graphics.notice?.('Upgraded graphics are unavailable. Original graphics remain active.');});}return;}
    try{const shown=upgraded.draw(canvas);if(shown)graphics.performanceFrame?.(performance.now());graphics.notice?.(shown?'Upgraded driving graphics · experimental':'Original graphics for this scene');}catch{failed=true;upgraded.close();upgraded=undefined;display();graphics.notice?.('Upgraded graphics are unavailable. Original graphics remain active.');}
   };
   const gameText=await json<TextResources>('race-dialog-text');
   activeRace=runtime;racePoll=onPoll;
   const memory=()=>runtime.session.state.memory;
   const display=()=>{pixels.set(runtime.pixels);show('race');paint(alternate?.palette,undefined,alternate?.owner);};
   const alternateDialogPresent=()=>{if(!alternate){paint();return;}pixels.set(alternate.display.pixels());show('race');paint(alternate.palette,undefined,alternate.owner);};
   const control=(mode:number,start:number,current:number)=>{runtime.controlReplay(mode,start,current);if(mode===1)presentWorld();};
   let dialogRefresh:(()=>void)|undefined,activeDialogBounds:readonly number[]|null=null;
   const presentRaceDialog=(bounds:readonly number[]|null,presentSource:()=>void=()=>paint())=>{
    activeDialogBounds=bounds;
    if(!bounds){dialogRefresh=undefined;graphics?.setPerformancePaused?.(false);presentWorld();return;}
    graphics?.setPerformancePaused?.(true);
    const redraw=()=>{
     // Keep the source menu opaque, including black pixels which may also
     // match the source background. Only its rectangle covers the 3D scene.
     presentSource();
     if(graphics?.enabled&&upgraded&&!failed){
      try{if(upgraded.draw(canvas)){
       const [left,right,top,bottom]=bounds,sx=canvas.width/320,sy=canvas.height/200;
       context.imageSmoothingEnabled=false;
       context.drawImage(surface,left,top,right-left,bottom-top,left*sx,top*sy,(right-left)*sx,(bottom-top)*sy);
      }}catch{failed=true;paint();}
     }
     dialogRefresh=redraw;if(graphics)graphics.refresh=redraw;
    };
   redraw();
   };
   const displayDialogs=(resources:Record<string,ReadonlyArray<number>>)=>{
    if(!alternate){
     const presentDialog=(bounds:readonly number[]|null)=>presentRaceDialog(bounds),editPath:NativeDialogHost['editPath']=(path,length,timeout,field)=>editNativePath({pixels,font,present:()=>activeDialogBounds?presentDialog(activeDialogBounds):paint(),counters:()=>input.counters(),keyboard:()=>input.keyboard()},path,length,timeout,field),dialogHost={...host,resources,presentDialog,editPath};
     const dialog=createNativeDialogRuntime(dialogHost);
     return {file:(...args:Parameters<typeof dialog.file>)=>dialog.file(...args),dialog:(...args:Parameters<typeof dialog.dialog>)=>dialog.dialog(...args),saveName:(state:{name:string;path:string},title:string)=>editNativeSaveName(dialogHost,state,title)};
    }
    const owner=alternate.owner,presentDialog=(bounds:readonly number[]|null)=>presentRaceDialog(bounds,alternateDialogPresent),editPath:NativeDialogHost['editPath']=(path,length,timeout,field)=>editNativeDisplayPath({memory:owner.memory,d:owner.d,mode:owner.mode,drawing:owner.drawing,present:()=>activeDialogBounds?presentDialog(activeDialogBounds):alternateDialogPresent(),counters:()=>input.counters(),keyboard:()=>input.keyboard()},path,length,timeout,field,0xe800),dialogHost={...host,memory:owner.memory,d:owner.d,mode:owner.mode,drawing:owner.drawing,resources,capture:(retain:boolean)=>captureNativeDisplayDialogBackground(owner,retain),present:alternateDialogPresent,presentDialog,editPath};
    const dialog=createNativeDisplayDialogRuntime(dialogHost,0xe800,{enumerate:(...args)=>host.enumerate(...args),editPath});
    return {file:(...args:Parameters<typeof dialog.file>)=>dialog.file(...args),dialog(resource:string,mode:number,selected=0,border=4,disabled?:ReadonlyArray<number>){const m=owner.memory(),originalBorder=m[owner.d+0x4ec2]|(m[owner.d+0x4ec3]<<8);return dialog.dialog(resource,mode,selected,border===4?originalBorder:border===1?(m[owner.d+0x4ec0]|(m[owner.d+0x4ec1]<<8)):border,disabled);},saveName:(state:{name:string;path:string},title:string)=>editNativeDisplaySaveName(dialogHost,state,title,0xe800)};
   };
   const dialogs=displayDialogs(gameText.resources),setupDialogs=displayDialogs(host.resources);
   const saveResources={...host.resources,...Object.fromEntries(['esav','efex','eser'].map(key=>[key,trackText.resources[key]]))},saveDialogs=displayDialogs(saveResources);
   const saveName=(state:{name:string;path:string},title:string)=>saveDialogs.saveName(state,title);
   const dialog=async(resource:string,mode:number,selected:number,border:number,disabled?:ReadonlyArray<number>)=>{pixels.set(runtime.pixels);return dialogs.dialog(resource,mode,selected,border,disabled);};
   let waitingField:{x:number;y:number}|undefined;
   const opponent={
    async show(resource:string,mode:number,x:number,y:number,border:number){
     pixels.set(runtime.pixels);if(alternate){const owner=alternate.owner,m=owner.memory(),d=owner.d,word=(at:number)=>m[d+at]|(m[d+at+1]<<8);restoreOriginalDisplayWindow(m,d,owner.mode);const content=drawOriginalDialogDisplay(m,d,owner.mode,owner.drawing,gameText.resources[resource],0,{text:word(0x4e8a),border:border===4?word(0x4ec2):border,disabled:0},0xe800,undefined,mode,{x,y});waitingField=content.fields[0];presentRaceDialog(content.layout.bounds,alternateDialogPresent);return;}
     const content=drawOriginalDialog(pixels,font,gameText.resources[resource],0,{text:memory()[0x2d1a0+0x4e8a],border,disabled:0},undefined,mode,{x,y});waitingField=content.fields[0];presentRaceDialog(content.layout.bounds);
    },
    drawTime(text:string){if(!waitingField)throw Error('Original opponent timer field is missing');if(alternate){const owner=alternate.owner,m=owner.memory(),d=owner.d,v=new DataView(m.buffer),fontAt=v.getUint16(d+0x4dd2,true)*16,bytes=Array.from(text,c=>c.charCodeAt(0)),x=Math.trunc((320-measureOriginalFont(m.subarray(fontAt,fontAt+65536),bytes))/2);m.set([...bytes,0],d+0xe800);owner.drawing.text(0xe800,x,waitingField.y,true);presentRaceDialog(activeDialogBounds,alternateDialogPresent);return;}const x=Math.trunc((320-measureOriginalFont(font,Array.from(text,c=>c.charCodeAt(0))))/2);drawOriginalFont(pixels,font,text,x,waitingField.y,memory()[0x2d1a0+0x4e8a],Array.from({length:256},(_,i)=>(i*320)&65535),0);presentRaceDialog(activeDialogBounds);},
    key:fastForwardKey
   };

   focusBrowserGameCanvas(canvas);
   const waiting=()=>{if(!alternate){drawOriginalRaceWaiting(pixels,font,host.resources.ewai,memory(),0x2d1a0);show('race');present();}else{const owner=alternate.owner,m=owner.memory(),v=new DataView(m.buffer),live=memory(),source=new DataView(live.buffer),at={cga:0x8ff0,tandy:0x9030,ega:0x8e6c}[owner.mode];v.setInt16(owner.d+at,source.getInt16(0x2d1a0+0x8a10,true),true);restoreOriginalDisplayWindow(m,owner.d,owner.mode);drawOriginalRaceWaitingDisplay(m,owner.d,owner.mode,owner.drawing,host.resources.ewai,0xe800);live[0x2d1a0+0x131]=0;display();}canvas.style.cursor='none';};
   return {control,present:presentWorld,presentWorld,dialog,opponent,waiting,saveName,saveDialog:saveDialogs.dialog,file:setupDialogs.file,setupDialog:async(resource:string,mode:number,selected:number,border:number)=>{pixels.set(runtime.pixels);return setupDialogs.dialog(resource,mode,selected,border);},read:()=>input.readMemory(memory,0x2d1a0,()=>originalElapsedInputTicks(memory(),0x2d1a0)),input:(delta:number)=>input.readMemory(memory,0x2d1a0,delta),ctrlHeld:input.ctrlHeld,waitTicks:input.waitTicks,
    changeGraphics:(writeAudio:(writes:number[][])=>void)=>selectAllocatedGraphicsLevel({memory,audio:operation=>writeAudio(runtime.dialogAudio(operation)),dialog:async(...args)=>{pixels.set(runtime.pixels);return setupDialogs.dialog(...args);},hideCursor(){canvas.style.cursor='none';}},0x2d1a0),
    selectMouse:(writeAudio:(writes:number[][])=>void)=>selectAllocatedMouseControl({memory,audio:operation=>writeAudio(runtime.dialogAudio(operation)),dialog:async(...args)=>{pixels.set(runtime.pixels);return setupDialogs.dialog(...args);},hideCursor(){canvas.style.cursor='none';}},0x2d1a0),
    hideCursor(){canvas.style.cursor='none';},
    counter:()=>originalElapsedInputTicks(memory(),0x2d1a0)&65535,nextFrame:input.nextFrame,key:input.takeKey,mouseButtons:()=>input.mouse().buttons,joystickButtons:input.joystickButtons,releaseInput:input.release,resetMouse:input.resetMouse,
    devices:{mouse:input.mouse,controls:input.controls,keyDown:input.keyDown,joystickSteering:input.joystickSteering},
    close(){closed=true;upgraded?.close();graphics?.setPerformancePaused?.(false);graphics?.resetPerformance?.();if(graphics&&(graphics.refresh===presentWorld||graphics.refresh===dialogRefresh))graphics.refresh=undefined;if(activeRace===runtime){const m=memory();drivingSettings.graphics=m[0x2d1a0+0x134];drivingSettings.mouse=!!m[0x2d1a0+0x12c];drivingSettings.joystick=!!m[0x2d1a0+0x4602];activeRace=undefined;racePoll=undefined;}}
   };
  },
  async replayPresentation(session:ReturnType<typeof createNativeRaceSession>,background:Uint8Array,replayFont:Uint8Array){
   if(background.length<64000)throw Error('Replay presentation requires the retained game framebuffer');
   const [art,packed]=await Promise.all([json<NativeReplayBarArt>('replay-bar-art'),binary('sdgame.pvs')]);
   session.restoreReplayBank(packed);const memory=()=>session.state.memory;
   const display=()=>{pixels.set(background.subarray(0,Math.min(background.length,pixels.length)));show('replay');present();};
   const control=createNativeReplayBar({memory,pixels:()=>background,font:replayFont,art,present:display},0x2d1a0);
   focusBrowserGameCanvas(canvas);
   return {control,present:display,read:()=>input.readMemory(memory,0x2d1a0),input:(delta:number)=>input.readMemory(memory,0x2d1a0,delta),ctrlHeld:input.ctrlHeld,waitTicks:input.waitTicks};
  },
  resetRaceMouse:input.resetMouse,
  async showTrackValidationError(error:number){
   const resource=errorKeys.keys[error];
   if(!resource||!trackText.resources[resource])throw Error('Original track validation message is unavailable');
   show('race');focusBrowserGameCanvas(canvas);
   await createNativeDialogRuntime(trackHost).dialog(resource,1,0,1);
  },
  showRaceWaiting(memory:Uint8Array){show('race');canvas.style.cursor='none';if(lastNativeDisplay){const {owner}=lastNativeDisplay,high={cga:0x5e0,tandy:0x620,ega:0x45c}[owner.mode],y=new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint16(0x2d1a0+0x8a10,true);new DataView(owner.memory().buffer).setUint16(owner.d+0x8a10+high,y,true);restoreOriginalDisplayWindow(owner.memory(),owner.d,owner.mode);drawOriginalRaceWaitingDisplay(owner.memory(),owner.d,owner.mode,owner.drawing,host.resources.ewai,0xe800);pixels.set(lastNativeDisplay.pixels());paint(lastNativeDisplay.palette);return;}drawOriginalRaceWaiting(pixels,font,host.resources.ewai,memory,0x2d1a0);present();},
  async loadAllocatedRaceReplay(data:NativeDemoData,runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,services:Pick<AllocatedReplayLoadServices,'showWaiting'|'progress'|'writeAudio'>,displayOverride?:{file(path:string,extension:string,title:string,onPathChange?:(path:string)=>void):Promise<{path:string;name:string}|undefined>;present():void}){
   const d=0x2d1a0,dialogs=displayOverride??createNativeDialogRuntime(host);let selected:{path:string;name:string}|undefined;
   const readString=(memory:Uint8Array,at:number)=>{let value='';for(let i=0;i<65536;i++){const byte=memory[d+((at+i)&65535)];if(!byte)return value;value+=String.fromCharCode(byte);}throw Error('Unterminated original replay filename');};
   const writeString=(memory:Uint8Array,at:number,value:string)=>memory.set(Uint8Array.from([...value].map(char=>char.charCodeAt(0)&255).concat(0)),d+at);
   return loadAllocatedReplay(data,runtime,{...services,
    async selectReplay(memory){
     if(displayOverride)displayOverride.present();else{pixels.set(runtime.pixels);show('replay');present();}
     selected=await dialogs.file(readString(memory(),0x98),'.rpl',String.fromCharCode(...host.resources.erep).split('\0')[0],path=>writeString(memory(),0x98,path));
     if(!selected)return 0;writeString(memory(),0x98,selected.path);writeString(memory(),0xea,selected.name);return 1;
    },
    async readReplay(){if(!selected)throw Error('Original replay load requires a selected file');return files.read(selected.path,selected.name,'.rpl');},
   });
  },
  async saveReplay(session:ReturnType<typeof createNativeRaceSession>,state:{name:string;path:string},pauseAudio:()=>void,displayOverride?:{saveName(state:{name:string;path:string},title:string):Promise<{name:string;path:string}|null>;saveDialog(resource:string,mode:number,selected:number,border:number):Promise<number>;present():void}){
   // These three MAIN resources were extracted with the editor's save flow.
   // Do not merge TEDIT emen or GAME econ into the shared file-dialog scope.
   const saveHost={...host,resources:{...host.resources,...Object.fromEntries(['esav','efex','eser'].map(key=>[key,trackText.resources[key]]))}},dialogs=createNativeDialogRuntime(saveHost);
   let destination={...state};if(displayOverride)displayOverride.present();else show('replay');focusBrowserGameCanvas(canvas);
   return saveNativeReplay({pauseAudio,
    editName:async()=>!!await (displayOverride?displayOverride.saveName(state,String.fromCharCode(...host.resources.erep).split('\0')[0]):editNativeSaveName(saveHost,state,String.fromCharCode(...host.resources.erep).split('\0')[0])),
    buildPath:()=>{destination={...state};},
    exists:()=>Promise.resolve(files.exists(destination.path,destination.name,'.rpl')),
    dialog:(resource,mode,selected)=>{const m=session.state.memory;return (displayOverride?.saveDialog??dialogs.dialog)(resource,mode,selected,new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(0x2d1a0+0x4ec0,true));},
    write:()=>session.saveReplay(async bytes=>{try{await files.write(destination.path,destination.name,'.rpl',bytes);return 0;}catch{return 1;}}),
   });
  },
  /** Replay dialogs share the browser's original font, input and surface,
   * while GAME resources remain separate from MISC file-dialog resources. */
  async replayMenu(session:ReturnType<typeof createNativeRaceSession>,services:Omit<Parameters<typeof session.replayMenu>[0],'dialog'>,background:Uint8Array,displayOverride?:{dialog(resource:string,mode:number,selected:number,border:number,disabled?:ReadonlyArray<number>):Promise<number>;present():void}){
   if(displayOverride){displayOverride.present();focusBrowserGameCanvas(canvas);await session.replayMenu({...services,dialog:displayOverride.dialog});return;}
   const gameText=await json<TextResources>('race-dialog-text');
   const dialogs=createNativeDialogRuntime({...host,resources:gameText.resources});
   if(background.length<64000)throw Error('Replay presentation requires the retained game framebuffer');
   pixels.set(background.subarray(0,Math.min(background.length,pixels.length)));show('replay');present();focusBrowserGameCanvas(canvas);
   await session.replayMenu({...services,selectControl:(...args)=>{services.selectControl(...args);if(args[0]===1){pixels.set(background.subarray(0,Math.min(background.length,pixels.length)));present();}},dialog:(...args)=>dialogs.dialog(...args)});
  },
  async allocatedRaceResults(data:NativeDemoData,runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,progress:(stage:number)=>void,displayMode?:NativeBrowserDisplayMode):Promise<number>{
   const alternate=displayMode?await prepareBrowserNativeResultsDisplay(data,displayMode,options.hercules):undefined;
   const resultPresent=()=>{if(!alternate){present();return;}pixels.set(alternate.pixels());show('results');paint(alternate.palette,undefined,alternate.owner);};
   const dialogs=alternate?createNativeDisplayDialogRuntime({...host,memory:alternate.owner.memory,d:alternate.owner.d,mode:alternate.owner.mode,drawing:alternate.owner.drawing,capture:retain=>captureNativeDisplayDialogBackground(alternate.owner,retain),present:resultPresent},0xe800):createNativeDialogRuntime(host);
   const parts=(filename:string)=>{const value=filename.replaceAll('/','\\'),end=Math.max(value.lastIndexOf('\\'),/^[A-Za-z]:/.test(value)?1:-1);return {path:value.slice(0,end+1),name:value.slice(end+1)};};
   try{return await runAllocatedRaceResults(data,runtime,{progress,
    async readFile(filename){const {path,name}=parts(filename);try{return files.exists(path,name,'')?await files.read(path,name,''):null;}catch{return null;}},
    async writeFile(filename,bytes){const {path,name}=parts(filename);try{await files.write(path,name,'',bytes);return 0;}catch{return 1;}},
    insertTrackDisk:()=>{const m=runtime.session.state.memory;return dialogs.dialog('eihd',1,1,alternate?new DataView(alternate.owner.memory().buffer).getUint16(alternate.owner.d+0x4ec2,true):new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(0x2d1a0+0x4ec2,true));},
    present:(state,services)=>this.results(state,services,alternate),
   });}finally{alternate?.release();}
  },
  async results(state:NativeRaceResultsState,services:{randomWord():number;randomByte():number;files?:NativeHighScorePreparationHost;selectEvaluation?:NativeRaceResultsHost['selectEvaluation'];prepareScores?:NativeRaceResultsHost['prepareScores']},alternate?:Awaited<ReturnType<typeof prepareBrowserNativeResultsDisplay>>){
   const scoreText=await json<TextResources>('high-score-text'),resultHost={...host,resources:{...host.resources,...scoreText.resources}},dialogs=createNativeDialogRuntime(resultHost);
   const read=async(extension:string)=>{try{return files.exists(state.trackPath,state.trackName,extension)?await files.read(state.trackPath,state.trackName,extension):null;}catch{return null;}};
   const scoreFiles:NativeHighScorePreparationHost=services.files??{readSavedTrack:()=>read('.trk'),insertTrackDisk:()=>dialogs.dialog('eihd',1,1,4),readScores:()=>read('.hig'),writeScores:async bytes=>{try{await files.write(state.trackPath,state.trackName,'.hig',bytes);return true;}catch{return false;}}};
   const results:NativeRaceResultsHost={...resultHost,playResultMusic:name=>music.play(name),smallFont,counter:input.counter,files:scoreFiles,evaluation:opponent=>json<NativeEvaluationResources>('opponent-evaluation/'+opponent),randomWord:services.randomWord,randomByte:services.randomByte,selectEvaluation:services.selectEvaluation,prepareScores:services.prepareScores};
   show('results');focusBrowserGameCanvas(canvas);
   if(!alternate)return runNativeRaceResults(results,state);
   const owner=alternate.owner,displayHost={...results,present:()=>{pixels.set(alternate.pixels());paint(alternate.palette,undefined,alternate.owner);},editPath:(path:string,length:number,timeout:number,field:{x:number;y:number})=>editNativeDisplayPath({memory:owner.memory,d:owner.d,mode:owner.mode,drawing:owner.drawing,present:()=>{pixels.set(alternate.pixels());paint(alternate.palette,undefined,alternate.owner);},counters:input.counters,keyboard:input.keyboard},path,length,timeout,field,0xe800)};
   return runNativeRaceResults(displayHost,state,createNativeDisplayResultsPresentation(alternate,displayHost,state));
  },
  async run(){focusBrowserGameCanvas(canvas);return runNativeMenuCoordinator({configuration,main:selectMain,car:()=>car(configuration,0),opponent:()=>opponent(configuration),track:selectTrack,options:selectOptions});}};
}
