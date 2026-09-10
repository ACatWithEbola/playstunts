/** Fixed unchained A000 planar aperture; raster/BIOS/CRTC timing is external.
 * Latch logic adapted from MAME pc_vga.cpp/.h (BSD-3-Clause), checked against
 * the original C++ bodies. See public/licenses/ega-planar-BSD-3-Clause.txt. */
export interface EgaPlanarSeed {planes:Uint8Array[];latches:Uint8Array;mapMask:number;graphics:Uint8Array;sequencerIndex?:number;graphicsIndex?:number}
export function createEgaPlanarMemory(seed:EgaPlanarSeed){
 if(seed.planes.length!==4||seed.planes.some(p=>p.length!==65536)||seed.latches.length!==4||seed.graphics.length!==9)throw Error('Incomplete EGA planar memory state');
 const planes=seed.planes.map(p=>p.slice()),latches=seed.latches.slice(),graphics=seed.graphics.slice();let mapMask=seed.mapMask&15,sequencerIndex=seed.sequencerIndex??2,graphicsIndex=seed.graphicsIndex??0;
 const rotate=(value:number)=>{const shift=graphics[3]&7;return ((value>>>shift)|(value<<(8-shift)))&255;};
 const combine=(data:number,plane:number,mask:number)=>{
  const latch=latches[plane];switch((graphics[3]>>>3)&3){
   case 0:return ((data&mask)|(latch&~mask))&255;
   case 1:return ((data|~mask)&latch)&255;
   case 2:return ((data&mask)|latch)&255;
   default:return ((data&mask)^latch)&255;
  }
 };
 const readByte=(offset:number)=>{
  offset&=65535;for(let plane=0;plane<4;plane++)latches[plane]=planes[plane][offset];
  if(!(graphics[5]&8))return latches[graphics[4]&3];
  let value=0;const care=graphics[7]&15,target=graphics[2]&care;
  for(let bit=0;bit<8;bit++){let colour=0;for(let plane=0;plane<4;plane++)if(latches[plane]&(1<<bit))colour|=1<<plane;if((colour&care)===target)value|=1<<bit;}
  return value;
 };
 const writeByte=(offset:number,value:number)=>{
  offset&=65535;value&=255;const mode=graphics[5]&3,mask=graphics[8];
  if(mode===3)throw Error('Write mode3 belongs to VGA, outside this EGA aperture');
  for(let plane=0;plane<4;plane++)if(mapMask&(1<<plane)){
   if(mode===1)planes[plane][offset]=latches[plane];
   else if(mode===2)planes[plane][offset]=combine(value&(1<<plane)?255:0,plane,mask);
   else planes[plane][offset]=combine(graphics[1]&(1<<plane)?(graphics[0]&(1<<plane)?mask:0):rotate(value),plane,mask);
  }
 };
 const writePort=(port:number,value:number)=>{
  value&=255;
  if(port===0x3c4)sequencerIndex=value;
  else if(port===0x3c5){if(sequencerIndex!==2)throw Error('Only the sequencer plane mask belongs to this aperture');mapMask=value&15;}
  else if(port===0x3ce)graphicsIndex=value;
  else if(port===0x3cf){if(graphicsIndex>8)throw Error('Unknown EGA graphics register');graphics[graphicsIndex]=value;}
  else throw Error('Unsupported EGA aperture port');
 };
 return {readByte,writeByte,writePort,writeWord(port:number,value:number){writePort(port,value&255);writePort(port+1,(value>>>8)&255);},
  snapshot(){return {planes:planes.map(p=>p.slice()),latches:latches.slice(),mapMask,graphics:graphics.slice(),sequencerIndex,graphicsIndex};},
  pixels(width:number,height:number,stride:number,start=0){
   if(![width,height,stride,start].every(Number.isInteger)||width<0||height<0||stride<Math.ceil(width/8))throw Error('Invalid EGA scanout extent');
   const output=new Uint8Array(width*height);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){const at=(start+y*stride+(x>>>3))&65535,mask=128>>>(x&7);let value=0;for(let plane=0;plane<4;plane++)if(planes[plane][at]&mask)value|=1<<plane;output[y*width+x]=value;}
   return output;
  },
 };
}
