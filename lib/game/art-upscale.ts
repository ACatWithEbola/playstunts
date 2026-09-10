/** Conservative Scale2x reconstruction, applied twice. Only existing indexed
 * colors are selected; source art stays unchanged and both axes scale equally. */
export function createOriginalArtUpscaler(width:number,height:number){
 const intermediate=new Uint8Array(width*height*4),output=new Uint8Array(width*height*16);
 function twice(source:Uint8Array,w:number,h:number,target:Uint8Array){
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const e=source[y*w+x],b=source[Math.max(0,y-1)*w+x],d=source[y*w+Math.max(0,x-1)],f=source[y*w+Math.min(w-1,x+1)],g=source[Math.min(h-1,y+1)*w+x];
   const at=y*4*w+x*2;
   if(b!==g&&d!==f){target[at]=d===b?d:e;target[at+1]=b===f?f:e;target[at+2*w]=d===g?d:e;target[at+2*w+1]=g===f?f:e;}
   else{target[at]=e;target[at+1]=e;target[at+2*w]=e;target[at+2*w+1]=e;}
  }
 }
 return {width:width*4,height:height*4,upscale(source:Uint8Array){if(source.length<width*height)throw Error('Incomplete original artwork');twice(source,width,height,intermediate);twice(intermediate,width*2,height*2,output);return output;}};
}
