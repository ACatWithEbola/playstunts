const NATIVE_WIDTH=320,NATIVE_HEIGHT=200,PANORAMA_WIDTH=1024;
const PANORAMA_SECTIONS=[{offset:0,width:320,height:14},{offset:320,width:192,height:26},{offset:512,width:320,height:16},{offset:832,width:192,height:30}] as const;

/** Locate the same flat ground edge produced by the original panorama pass. */
export function enhancedPanoramaHorizon(pixels:Uint8Array,ground:number,width=NATIVE_WIDTH,height=NATIVE_HEIGHT){
 const x=Math.floor(width/2);let y=height-1;
 if(pixels[y*width+x]!==ground)return height;
 while(y>=0&&pixels[y*width+x]===ground)y--;
 return y+1;
}

/** Original DF2A positions the first of four panorama sections at this offset. */
export function enhancedPanoramaLeft(heading:number){return ((heading+512)&1023)-1024;}

type EnhancedPanoramaOptions={width:number;height:number;heading:number;horizon:number;rotation:number;sky:string;ground:string};

/** A complete high-resolution 1024-unit wraparound panorama. */
export function createEnhancedPanoramaBackground(source:string,sourceHorizon:number){
 const image=new Image();image.decoding='async';image.src=source;
 const surface=document.createElement('canvas'),drawing=surface.getContext('2d')!;
 let prepared='';
 return {
  draw(target:CanvasRenderingContext2D,options:EnhancedPanoramaOptions){
   if(!image.complete||!image.naturalWidth)return false;
   const {width,height,heading,horizon,rotation,sky,ground}=options,sx=width/NATIVE_WIDTH,sy=height/NATIVE_HEIGHT;
   const side=Math.ceil(Math.hypot(width,height)/16)*16,padX=(side-width)/2,padY=(side-height)/2;
   const key=[side,width,height,heading,horizon,sky,ground].join('/');
   if(key!==prepared){
    if(surface.width!==side||surface.height!==side){surface.width=side;surface.height=side;}
    drawing.setTransform(1,0,0,1,0,0);drawing.clearRect(0,0,side,side);drawing.fillStyle=sky;drawing.fillRect(0,0,side,side);
    const horizonY=padY+horizon*sy;drawing.fillStyle=ground;drawing.fillRect(0,horizonY,side,side-horizonY);
    drawing.imageSmoothingEnabled=true;drawing.imageSmoothingQuality='high';
    const base=enhancedPanoramaLeft(heading),nativeLeft=-padX/sx-PANORAMA_WIDTH,nativeRight=(side-padX)/sx+PANORAMA_WIDTH;
    for(let cycle=Math.floor((nativeLeft-base)/PANORAMA_WIDTH)*PANORAMA_WIDTH;base+cycle<nativeRight;cycle+=PANORAMA_WIDTH)drawing.drawImage(image,padX+(base+cycle)*sx,padY+(horizon-sourceHorizon)*sy,PANORAMA_WIDTH*sx,256*sy);
    prepared=key;
   }
   target.save();target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';target.translate(width/2,height/2);target.rotate(rotation);target.drawImage(surface,-side/2,-side/2);target.restore();
   return true;
  },
  close(){prepared='';image.src='';surface.width=surface.height=1;},
 };
}

/** High-resolution Alpine artwork using the original heading, horizon and roll. */
export function createEnhancedAlpineBackground(sources:readonly string[]){
 const sections=PANORAMA_SECTIONS.map((layout,index)=>{const image=new Image();image.decoding='async';image.src=sources[index]??'';return {...layout,image};});
 const surface=document.createElement('canvas'),drawing=surface.getContext('2d')!;
 let prepared='';
 return {
  draw(target:CanvasRenderingContext2D,options:EnhancedPanoramaOptions){
   if(sections.some(({image})=>!image.complete||!image.naturalWidth))return false;
   const {width,height,heading,horizon,rotation,sky,ground}=options,sx=width/NATIVE_WIDTH,sy=height/NATIVE_HEIGHT;
   const side=Math.ceil(Math.hypot(width,height)/16)*16,padX=(side-width)/2,padY=(side-height)/2;
   const key=[side,width,height,heading,horizon,sky,ground].join('/');
   if(key!==prepared){
    if(surface.width!==side||surface.height!==side){surface.width=side;surface.height=side;}
    drawing.setTransform(1,0,0,1,0,0);drawing.clearRect(0,0,side,side);drawing.fillStyle=sky;drawing.fillRect(0,0,side,side);
    const horizonY=padY+horizon*sy;drawing.fillStyle=ground;drawing.fillRect(0,horizonY,side,side-horizonY);
    drawing.imageSmoothingEnabled=true;drawing.imageSmoothingQuality='high';
    const base=enhancedPanoramaLeft(heading),nativeLeft=-padX/sx-PANORAMA_WIDTH,nativeRight=(side-padX)/sx+PANORAMA_WIDTH;
    for(let cycle=Math.floor((nativeLeft-base)/PANORAMA_WIDTH)*PANORAMA_WIDTH;base+cycle<nativeRight;cycle+=PANORAMA_WIDTH)for(const section of sections)drawing.drawImage(section.image,padX+(base+cycle+section.offset)*sx,padY+(horizon-section.height)*sy,section.width*sx,section.height*sy);
    prepared=key;
   }
   target.save();target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';target.translate(width/2,height/2);target.rotate(rotation);target.drawImage(surface,-side/2,-side/2);target.restore();
   return true;
  },
  close(){prepared='';sections.forEach(({image})=>{image.src='';});surface.width=surface.height=1;},
 };
}
