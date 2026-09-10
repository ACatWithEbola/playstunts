import {drawOriginalHorizonBackground} from './horizon-background.ts';
import {drawEditorClippedRaster} from './editor-clipped-raster.ts';
export type OriginalPanoramaImage={width:number;height:number;pixels:ArrayLike<number>};
/** Original DF2A background with its clipped 259F0 image copy and rectangle fills.
 * Target is the original 320 by 200 indexed framebuffer; artwork is unmodified.
 */
export function renderOriginalHorizonBackground(target:Uint8Array,memory:Uint8Array,d:number,rectangle:readonly number[],heading:number,horizon:number,imageAt:(offset:number,segment:number)=>OriginalPanoramaImage,width=320){
 let clip={left:0,right:width,top:0,bottom:200};
 drawOriginalHorizonBackground(memory,d,rectangle,heading,horizon,({address,args})=>{
  if(address===0x250b3){const [left,right,top,bottom]=args.map(n=>(n<<16)>>16);clip={left,right,top,bottom};}
  else if(address===0x250f4){for(let y=clip.top;y<clip.bottom;y++)target.fill(args[0]&255,y*width+clip.left,y*width+clip.right);}
  else drawEditorClippedRaster(target,width,imageAt(args[0],args[1]),args[2],args[3],'copy',clip);
 });
}
