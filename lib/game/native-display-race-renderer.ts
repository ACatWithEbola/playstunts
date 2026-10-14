import {resetOriginalWorldRegions} from './reset-world-regions.ts';
import {transferNativeRaceRenderInputs} from './transfer-race-render-inputs.ts';
import {selectOriginalRaceCamera} from './select-race-camera.ts';
import {renderOriginalWorldDisplay} from './world-display.ts';
import {drawOriginalFullRedrawDisplayRaceLayers} from './full-redraw-display-race-layers.ts';
import {drawOriginalAlternatingEgaRaceLayers} from './alternating-ega-race-layers.ts';
import {originalPackedDisplayPixels} from './packed-display-pixels.ts';
import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import {nativeRaceRenderWindow} from './native-race-render-window.ts';
import {createMs91RepaintState} from './ms91-repaint-state.ts';
import {createNativeMs91RepaintHost,presentMs91Repaint} from './ms91-repaint-presentation.ts';
import {buildMs91BackgroundRepaintPlan} from './ms91-background-repaint-plan.ts';
import {buildMs91RolledBackgroundPlan} from './ms91-rolled-background-plan.ts';
import type {Ms91Rectangle} from './ms91-rectangle-list.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
import type {OriginalEgaPageOperation} from './ega-display-page.ts';
import type {RenderTileSlots} from './select-render-tiles.ts';
import type {Vector} from '../physics/math.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';
import {nativeDisplayRendererPolicy} from './native-renderer-policy.ts';

/** Renderer over independently prepared original resources. The simulation
 * retains its MCGA data layout; native display inputs cross an explicit boundary
 * and the selected driver owns rasterization, buffers and cockpit caches. */
export function createNativeDisplayRaceRenderer(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,raw:number[],objects:TrackObject[],planes:CollisionPlane[],pageOperation?:(op:OriginalEgaPageOperation)=>number,metadata:{physicsEngine?:import('../physics/engine-version.ts').PhysicsEngineVersion;framesPerSecond?:10|20;experimentalMs91WindowCopy?:boolean;experimentalMs91RegionFlags?:boolean;experimentalMs91SelectiveCopy?:boolean;experimentalMs91PartialBackground?:boolean;experimentalMs91SlowVideoManagement?:boolean}={}){
 metadata={...metadata};
 if(metadata.experimentalMs91PartialBackground&&!metadata.experimentalMs91SelectiveCopy)throw Error('Partial background requires selective-copy state');
 if((metadata.experimentalMs91WindowCopy||metadata.experimentalMs91RegionFlags||metadata.experimentalMs91SelectiveCopy)&&metadata.physicsEngine!=='ms-1991')throw Error('Experimental renderer policies require MS91');
 if(metadata.experimentalMs91SelectiveCopy&&(!metadata.experimentalMs91WindowCopy||!metadata.experimentalMs91RegionFlags))throw Error('Selective copy requires the diagnostic window and region producers');
 if(metadata.experimentalMs91SlowVideoManagement!==undefined&&!metadata.experimentalMs91RegionFlags)throw Error('MS91 video-management policy requires descriptor tracking');
 if(metadata.experimentalMs91SlowVideoManagement===false&&metadata.experimentalMs91SelectiveCopy)throw Error('Fast video management cannot select retained-region copying');
 const {d,mode}=owner,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],a=WORLD_DISPLAY_LAYOUTS[mode].address,bp=0xeefe;
 const drawing={...owner.drawing,...metadata};
 const repaint=createMs91RepaintState([0,320,0,200],[320,0,200,0]);
 let renderWindowSeeded=false;
 let renderWindowCaptures=0;
 let partialBackgroundPasses=0;
 let rolledBackgroundPasses=0;
 let localCarRegionSubmissions=0;
 let diagnosticPlan:{current:Ms91Rectangle[];presentation:Ms91Rectangle[];flags:number[];bounds:Ms91Rectangle;fullRedraw:boolean;sourceProbe?:number;copiedProbe?:number;worldTrace?:{reset:Ms91Rectangle[];drawn:Ms91Rectangle[];empty:number[]}}|undefined;
 let slots=Object.fromEntries(['skip','east','south','terrain','tile','detail'].map(key=>[key,Array(23).fill(0)])) as unknown as RenderTileSlots,opponentRow=0;
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 const pixels=()=>{const memory=owner.memory(),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 if(mode!=='ega')return originalPackedDisplayPixels(memory,mode);
  const page=v.getUint16(d+0x5638,true),descriptor=v.getUint16(0x209e0+0xc0b6+page*4,true),start=v.getUint16(0x209e0+descriptor,true);
  return owner.aperture.pixels(320,200,40,start);
 };
 let forceFullRedraw=false;
 return {pixels,setMs91VideoManagement(slow:boolean){
  if(metadata.physicsEngine!=='ms-1991')throw Error('Video-management changes require an MS91 display renderer');
  const policy=nativeDisplayRendererPolicy(metadata.physicsEngine,slow);
  Object.assign(metadata,policy);Object.assign(drawing,policy);
  repaint.reset();renderWindowSeeded=false;diagnosticPlan=undefined;forceFullRedraw=true;
 },get experimentalLocalCarRegionSubmissions(){return localCarRegionSubmissions;},get experimentalRolledBackgroundPasses(){return rolledBackgroundPasses;},get experimentalPartialBackgroundPasses(){return partialBackgroundPasses;},get experimentalRenderWindowCaptures(){return renderWindowCaptures;},get experimentalRepaintDiagnostics(){return diagnosticPlan?structuredClone(diagnosticPlan):undefined;},render(live:Uint8Array,liveD=0x2d1a0){
  const memory=owner.memory(),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
  for(const offset of [0x8fc2,...(memory[d+0x8fc8+high]?[0x8fc9]:[])])for(let i=0;i<4;i++)if(memory[d+offset+high+i]!==live[liveD+offset+i])throw Error('Selected cars require freshly prepared display resources');
  if(memory[d+0x8fc8+high]!==live[liveD+0x8fc8])throw Error('Opponent selection requires freshly prepared display resources');
  transferNativeRaceRenderInputs(memory,d,mode,live,liveD,bp);
  if(forceFullRedraw){memory[d+a(0x9ab6)]=Math.max(memory[d+a(0x9ab6)],memory[d+a(0xa003)]);forceFullRedraw=false;}
  const s=(at:number)=>v.getInt16(d+at+high,true),l=(at:number)=>v.getInt32(d+at+high,true),b=(at:number)=>memory[d+at+high];
  const camera=selectOriginalRaceCamera(memory,d,raw,objects,planes,a,metadata.physicsEngine),world=[l(0x8c38),l(0x8c3c),l(0x8c40)];
  const rectangle=[0,1,2,3].map(i=>s(0x7fe6+i*2));
  const particles=Array.from({length:24},(_,i)=>({x:l(0x8ae6+i*4),y:l(0x8b46+i*4),z:l(0x8ba6+i*4),angleX:s(0x8db4+i*2),angleZ:s(0x8de4+i*2),heading:s(0x8e14+i*2),speed:s(0x8e44+i*2),verticalSpeed:s(0x8e74+i*2),style:b(0x8ee1+i),owner:b(0x8ef9+i)}));
  let backgroundFullRedraw=false;
  let worldTrace:NonNullable<typeof diagnosticPlan>['worldTrace'];
  const readRegions=()=>Array.from({length:15},(_,index)=>Array.from({length:4},(_,i)=>v.getInt16(d+a(0x901a)+index*8+i*2,true)) as Ms91Rectangle);
  const worldDrawing=metadata.experimentalMs91PartialBackground?{...owner.drawing,ms91SkyRepaintRegions(clip:Ms91Rectangle,heading:number){
   partialBackgroundPasses++;
   const previous=repaint.previous();return buildMs91BackgroundRepaintPlan(previous.regions,readRegions(),clip,previous.heading,heading,!!memory[d+a(0x9ab6)],v.getUint16(d+a(0x93da),true),v.getUint16(d+a(0x9ae8),true),memory[d+0x134],previous.heading);
  },ms91RolledRepaintPlan(clip:Ms91Rectangle,base:number,delta:number){
   rolledBackgroundPasses++;
   const previous=repaint.previous();return buildMs91RolledBackgroundPlan(previous.regions,readRegions(),clip,base,delta,v.getUint16(d+0x9ae2+high,true),!!memory[d+a(0x9ab6)],v.getUint16(d+a(0x93da),true),v.getUint16(d+a(0x9ae8),true));
  }}:owner.drawing;
  const drawWorld=()=>{
   resetOriginalWorldRegions(memory,d,mode);
   const reset=metadata.experimentalMs91SelectiveCopy?readRegions():undefined;
   const result=renderOriginalWorldDisplay(memory,d,mode,worldDrawing,{physicsEngine:metadata.physicsEngine,angles:camera.angles,camera:camera.position,rectangle,carTile:[(world[0]>>16)&255,(29-(world[2]>>16))&255],slots,paint:memory[d+0x8b4+((s(0x8c26)||s(0xaa78))&15)],particles,opponentRetainedRow:opponentRow,visibility:{player:0,opponent:0},cache,recordPointer:0xc900,ms91SlowVideoManagement:metadata.experimentalMs91SlowVideoManagement},{leftOffset:0xd000,rightOffset:0xd400},true,true,metadata.experimentalMs91RegionFlags);
   slots=result.scene.slots;opponentRow=result.scene.cars.opponent.row;
   localCarRegionSubmissions+=result.localCarRegionSubmissions;
   backgroundFullRedraw=!!result.backgroundRequiresFullRedraw;
   if(reset)worldTrace={reset,drawn:readRegions(),empty:Array.from({length:4},(_,i)=>v.getInt16(d+0x3312+i*2,true))};
  };
  if(mode==='ega'&&memory[d+a(0xaa46)])drawOriginalAlternatingEgaRaceLayers(memory,d,drawing,bp,drawWorld,program=>{
   let step=program.next();while(!step.done){const op=step.value;if(op.kind==='port-read'&&!pageOperation)throw Error('EGA retrace reads require the presentation clock');step=program.next(pageOperation?.(op)??0);}
  });
  else {
   const screen={offset:mode==='cga'?0x6880:mode==='tandy'?0x63f0:0x9a42,segment:0x209e};
   const renderWindow=metadata.experimentalMs91WindowCopy?nativeRaceRenderWindow(memory,d,mode):undefined;
   drawOriginalFullRedrawDisplayRaceLayers(memory,d,mode,drawing,bp,screen,drawWorld,renderWindow?{
    beforeWorld(){
     // Seed the existing direct-screen cockpit only on entry/full redraw.
     // Ordinary frames retain this window rather than recapturing the screen.
     // Background partial-drawing parity is still a separate release gate.
     if(!renderWindowSeeded||memory[d+a(0x9ab6)]){drawing.selectWindow(screen);drawing.capture(renderWindow.bitmap);renderWindowSeeded=true;renderWindowCaptures++;}
     drawing.selectWindow(renderWindow.window);
    },
    present(pointer){
     const bounds=Array.from({length:4},(_,i)=>v.getInt16(d+((pointer+i*2)&65535),true)) as [number,number,number,number];
     if(metadata.experimentalMs91SelectiveCopy){
      const current=Array.from({length:15},(_,index)=>Array.from({length:4},(_,i)=>v.getInt16(d+a(0x901a)+index*8+i*2,true)) as Ms91Rectangle);
      // The newer frame-finish collapse belongs to detached repaint banks,
      // not the legacy graph still owned by cockpit/status overlay routines.
      if(backgroundFullRedraw){current[0]=[...bounds];for(let i=1;i<15;i++)current[i]=[320,0,200,0];}
      const plan=repaint.prepare(current,bounds,camera.angles[2],{enabled:true,fullRedraw:!!memory[d+a(0x9ab6)],pageFlipping:false,detail:memory[d+0x134],alignment:v.getUint16(d+a(0x93da),true),mask:v.getUint16(d+a(0x9ae8),true)});
      diagnosticPlan={current,presentation:plan.presentation,flags:plan.flags,bounds,fullRedraw:!!memory[d+a(0x9ab6)],worldTrace};
      if(mode==='tandy'){const base=renderWindow.bitmap.segment*16+renderWindow.bitmap.offset,width=v.getUint16(base,true);diagnosticPlan.sourceProbe=memory[base+16+65*width+(171>>1)]&15;}
      presentMs91Repaint(plan,createNativeMs91RepaintHost(drawing,screen,renderWindow.bitmap,{beginCopy(){},endCopy(){}}));
      if(mode==='tandy')diagnosticPlan.copiedProbe=pixels()[65*320+171];
     }else{drawing.selectWindow(screen);drawing.bounds(...bounds);drawing.bitmap(renderWindow.bitmap);}
    },
   }:undefined);
  }
  // Consume the simulation's redraw request; EGA retains its second pass in
  // its own memory. The digital-gauge caller byte follows the original host.
  live[liveD+0x9ab6]=0;live[liveD+0x31e9]=memory[d+0x31e9];
  return pixels();
 }};
}
