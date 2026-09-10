import {resetOriginalWorldRegions} from './reset-world-regions.ts';
import {transferNativeRaceRenderInputs} from './transfer-race-render-inputs.ts';
import {selectOriginalRaceCamera} from './select-race-camera.ts';
import {renderOriginalWorldDisplay} from './world-display.ts';
import {drawOriginalFullRedrawDisplayRaceLayers} from './full-redraw-display-race-layers.ts';
import {drawOriginalAlternatingEgaRaceLayers} from './alternating-ega-race-layers.ts';
import {originalPackedDisplayPixels} from './packed-display-pixels.ts';
import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
import type {OriginalEgaPageOperation} from './ega-display-page.ts';
import type {RenderTileSlots} from './select-render-tiles.ts';
import type {Vector} from '../physics/math.ts';
import type {TrackObject} from '../physics/track.ts';
import type {CollisionPlane} from '../physics/plane.ts';

/** Renderer over independently prepared original resources. The simulation
 * retains its MCGA data layout; native display inputs cross an explicit boundary
 * and the selected driver owns rasterization, buffers and cockpit caches. */
export function createNativeDisplayRaceRenderer(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,raw:number[],objects:TrackObject[],planes:CollisionPlane[],pageOperation?:(op:OriginalEgaPageOperation)=>number){
 const {d,mode}=owner,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],a=WORLD_DISPLAY_LAYOUTS[mode].address,bp=0xeefe;
 let slots=Object.fromEntries(['skip','east','south','terrain','tile','detail'].map(key=>[key,Array(23).fill(0)])) as unknown as RenderTileSlots,opponentRow=0;
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 const pixels=()=>{const memory=owner.memory(),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 if(mode!=='ega')return originalPackedDisplayPixels(memory,mode);
  const page=v.getUint16(d+0x5638,true),descriptor=v.getUint16(0x209e0+0xc0b6+page*4,true),start=v.getUint16(0x209e0+descriptor,true);
  return owner.aperture.pixels(320,200,40,start);
 };
 return {pixels,render(live:Uint8Array,liveD=0x2d1a0){
  const memory=owner.memory(),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
  for(const offset of [0x8fc2,...(memory[d+0x8fc8+high]?[0x8fc9]:[])])for(let i=0;i<4;i++)if(memory[d+offset+high+i]!==live[liveD+offset+i])throw Error('Selected cars require freshly prepared display resources');
  if(memory[d+0x8fc8+high]!==live[liveD+0x8fc8])throw Error('Opponent selection requires freshly prepared display resources');
  transferNativeRaceRenderInputs(memory,d,mode,live,liveD,bp);
  const s=(at:number)=>v.getInt16(d+at+high,true),l=(at:number)=>v.getInt32(d+at+high,true),b=(at:number)=>memory[d+at+high];
  const camera=selectOriginalRaceCamera(memory,d,raw,objects,planes,a),world=[l(0x8c38),l(0x8c3c),l(0x8c40)];
  const rectangle=[0,1,2,3].map(i=>s(0x7fe6+i*2));
  const particles=Array.from({length:24},(_,i)=>({x:l(0x8ae6+i*4),y:l(0x8b46+i*4),z:l(0x8ba6+i*4),angleX:s(0x8db4+i*2),angleZ:s(0x8de4+i*2),heading:s(0x8e14+i*2),speed:s(0x8e44+i*2),verticalSpeed:s(0x8e74+i*2),style:b(0x8ee1+i),owner:b(0x8ef9+i)}));
  const drawWorld=()=>{
   resetOriginalWorldRegions(memory,d,mode);
   const result=renderOriginalWorldDisplay(memory,d,mode,owner.drawing,{angles:camera.angles,camera:camera.position,rectangle,carTile:[(world[0]>>16)&255,(29-(world[2]>>16))&255],slots,paint:memory[d+0x8b4+((s(0x8c26)||s(0xaa78))&15)],particles,opponentRetainedRow:opponentRow,visibility:{player:0,opponent:0},cache,recordPointer:0xc900},{leftOffset:0xd000,rightOffset:0xd400});
   slots=result.scene.slots;opponentRow=result.scene.cars.opponent.row;
  };
  if(mode==='ega'&&memory[d+a(0xaa46)])drawOriginalAlternatingEgaRaceLayers(memory,d,owner.drawing,bp,drawWorld,program=>{
   let step=program.next();while(!step.done){const op=step.value;if(op.kind==='port-read'&&!pageOperation)throw Error('EGA retrace reads require the presentation clock');step=program.next(pageOperation?.(op)??0);}
  });
  else drawOriginalFullRedrawDisplayRaceLayers(memory,d,mode,owner.drawing,bp,{offset:mode==='cga'?0x6880:mode==='tandy'?0x63f0:0x9a42,segment:0x209e},drawWorld);
  // Consume the simulation's redraw request; EGA retains its second pass in
  // its own memory. The digital-gauge caller byte follows the original host.
  live[liveD+0x9ab6]=0;live[liveD+0x31e9]=memory[d+0x31e9];
  return pixels();
 }};
}
