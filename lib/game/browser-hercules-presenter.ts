import {originalHerculesDisplayPixels} from './hercules-display-pixels.ts';
/** Scan out the selected native owner's live RAM; never rebuild monochrome
 * pixels from a flattened CGA picture (which would lose the third bank). */
export function createBrowserHerculesPresenter(canvas:HTMLCanvasElement){
 const surface=document.createElement('canvas');surface.width=640;surface.height=300;
 const raster=surface.getContext('2d')!,context=canvas.getContext('2d')!,image=raster.createImageData(640,300);
 return (owner:{memory():Uint8Array;d:number})=>{
  const memory=owner.memory(),frame=originalHerculesDisplayPixels(memory,memory.subarray(owner.d+0x405e,owner.d+0x406a),0x8a);
  if(frame.width!==640||frame.height!==300)throw Error('Unexpected Stunts Hercules display geometry');
  for(let i=0;i<frame.pixels.length;i++){const value=frame.pixels[i]*255;image.data[i*4]=value;image.data[i*4+1]=value;image.data[i*4+2]=value;image.data[i*4+3]=255;}
  raster.putImageData(image,0,0);context.setTransform(1,0,0,1,0,0);context.imageSmoothingEnabled=false;context.drawImage(surface,0,0,canvas.width,canvas.height);
 };
}
