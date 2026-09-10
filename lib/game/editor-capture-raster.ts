/** Original 0x2658e: capture framebuffer rectangle and retain its restoration position. */
export function captureEditorRaster(source:Uint8Array,stride:number,width:number,height:number,x:number,y:number){
 if(![stride,width,height,x,y].every(Number.isInteger)||width<=0||height<=0||x<0||y<0||stride<=0||x+width>stride||(y+height-1)*stride+x+width>source.length)throw Error('Editor capture outside framebuffer');
 const pixels=new Uint8Array(width*height);
 for(let row=0;row<height;row++)pixels.set(source.subarray((y+row)*stride+x,(y+row)*stride+x+width),row*width);
 return {width,height,x,y,pixels};
}
