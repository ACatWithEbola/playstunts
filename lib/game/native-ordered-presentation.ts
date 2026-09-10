import {backgroundCamera,createNativeBackground} from './native-background.ts';
import type {Vector} from '../physics/math.ts';
import type {OriginalRasterCall} from './drain-primitive-queue.ts';
import {createOriginalOrderedWebGL} from './original-ordered-webgl.ts';
import type {createNativeOriginalRenderer} from './native-original-renderer.ts';

/** Source visibility and painter order, presented at the canvas resolution.
 * The original background keeps its pixels and display proportions. Live
 * simulation memory is never modified, and no draw history is retained.
 */
export function createNativeOrderedPresentation(
 renderer:ReturnType<typeof createNativeOriginalRenderer>,
 resources:Uint8Array,
 palette:readonly number[],
 canvas:HTMLCanvasElement,
 sharedContext?:WebGL2RenderingContext,
){
 const raster=createOriginalOrderedWebGL(canvas,resources,palette,undefined,sharedContext);
 const background=createNativeBackground(resources);
 const calls:OriginalRasterCall[]=[];
 let lastMemory:Uint8Array|undefined,lastWidth=0,lastHeight=0;
 let cameraMemory:Uint8Array|undefined,cameraKey='';
 return {
  draw(memory:Uint8Array){
   const {width,height}=canvas;
   if(!sharedContext&&memory===lastMemory&&width===lastWidth&&height===lastHeight)return false;
   calls.length=0;
   try{
    const pixels=renderer.render(memory,undefined,call=>calls.push(call));
    raster.begin(pixels);
    for(const call of calls)raster.draw(call);
   }finally{calls.length=0;}
   lastMemory=memory;lastWidth=width;lastHeight=height;
   return true;
  },
  /** Modern camera with source visibility/order and fractional polygon positions. */
  drawCamera(memory:Uint8Array,frame:{position:Vector;target:Vector;up:Vector},aspect:number,fov:number,viewMode:0|2=2){
   const key=[...frame.position,...frame.target,...frame.up,aspect,fov,viewMode,canvas.width,canvas.height].join(',');
   // A shared THREE context does not preserve the drawing buffer after
   // composition. Even an unchanged frame must be drawn again there.
   if(!sharedContext&&memory===cameraMemory&&key===cameraKey)return false;
   const camera=backgroundCamera(frame.position,frame.target,frame.up);
   const backdrop=background.render(camera.angles,camera.height,aspect,fov);
   const scale=100/Math.tan(fov*Math.PI/360),width=backdrop.width;
   calls.length=0;
   try{
    renderer.render(memory,undefined,call=>calls.push(call),{
     position:[frame.position[0],frame.position[1],-frame.position[2]].map(Math.round) as Vector,
     mode:viewMode,angles:camera.angles,width,projection:[Math.round(width/2),100,Math.round(scale*1.2),Math.round(scale)],
    },true);
    raster.begin(backdrop.pixels,width,200,[0,width,0,200]);
    for(const call of calls)raster.draw(call,true);
   }finally{calls.length=0;}
   lastMemory=undefined;cameraMemory=memory;cameraKey=key;
   return true;
  },
  invalidate(){lastMemory=undefined;cameraMemory=undefined;},
  dispose(){lastMemory=undefined;cameraMemory=undefined;calls.length=0;raster.dispose();},
 };
}
