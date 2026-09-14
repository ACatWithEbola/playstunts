/** Package the image-generated Tropical panorama into the original four-section envelope.
 * The candidate remains review-only until it is explicitly connected to the game.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'app/work/backgrounds');
const generatedName='tropical-upgraded-v1-generated-master.png';
const generatedPath=path.join(out,generatedName);
const panoramaArt=JSON.parse(await fs.readFile(path.join(root,'public/game/menu-panorama-art.json'),'utf8'));
const resources=panoramaArt.find(entry=>entry.source==='TROPICAL.PVS').resources;
const palette=JSON.parse(await fs.readFile(path.join(root,'public/game/track-materials.json'),'utf8')).palette;
const names=['scen','sce2','sce3','sce4'];
const sourceWidth=1024,sourceHeight=256,scale=4,width=sourceWidth*scale,height=sourceHeight*scale,horizon=136,sourceBase=376;
const skyIndex=117,screenSkyIndex=116,groundIndex=108;

const colour=index=>palette.slice(index*3,index*3+3);
const put=(buffer,at,rgb,alpha=255)=>{buffer[at]=rgb[0];buffer[at+1]=rgb[1];buffer[at+2]=rgb[2];buffer[at+3]=alpha;};

// Rebuild the same stitched reference shown by the gallery. The method was
// checked against the established Alpine reference with zero decoded-pixel differences.
const originalRgba=Buffer.alloc(sourceWidth*sourceHeight*4);
for(let y=0;y<sourceHeight;y++)for(let x=0;x<sourceWidth;x++)put(originalRgba,(y*sourceWidth+x)*4,colour(y<horizon?screenSkyIndex:groundIndex));
const layout=[];
let offset=0;
const skyline=new Uint16Array(sourceWidth);
for(const name of names){
 const bytes=resources[name],sectionWidth=bytes[0]|bytes[1]<<8,sectionHeight=bytes[2]|bytes[3]<<8,top=horizon-sectionHeight;
 for(let x=0;x<sectionWidth;x++){
  let y=0;while(y<sectionHeight&&bytes[16+y*sectionWidth+x]===skyIndex)y++;
  skyline[offset+x]=top+y;
 }
 for(let y=0;y<sectionHeight;y++)for(let x=0;x<sectionWidth;x++)put(originalRgba,((top+y)*sourceWidth+offset+x)*4,colour(bytes[16+y*sectionWidth+x]));
 layout.push({name,offset,width:sectionWidth,height:sectionHeight,top});offset+=sectionWidth;
}
if(offset!==sourceWidth)throw Error('Tropical resource sections do not form the expected 1,024-pixel wrap.');
await sharp(originalRgba,{raw:{width:sourceWidth,height:sourceHeight,channels:4}}).png().toFile(path.join(out,'tropical-original-panorama.png'));

const generated=await sharp(generatedPath).removeAlpha().raw().toBuffer({resolveWithObject:true});
const source=generated.data,generatedWidth=generated.info.width,generatedHeight=generated.info.height;
if(sourceBase>=generatedHeight)throw Error('Generated Tropical master is shorter than its recorded horizon.');
const isSky=(r,g,b)=>b>100&&b>r+18&&g>r+18;
const generatedTops=new Uint16Array(generatedWidth);
for(let x=0;x<generatedWidth;x++){
 let y=0;while(y<sourceBase){const at=(y*generatedWidth+x)*3;if(!isSky(source[at],source[at+1],source[at+2]))break;y++;}
 generatedTops[x]=y;
}

const sampleColour=(x,y)=>{
 const x0=Math.max(0,Math.min(generatedWidth-1,Math.floor(x))),x1=Math.min(generatedWidth-1,x0+1),fx=x-x0;
 const atColumn=(column,row)=>{
  const clamped=Math.max(generatedTops[column],Math.min(generatedHeight-1,row));
  const y0=Math.floor(clamped),y1=Math.min(generatedHeight-1,y0+1),fy=clamped-y0,a=(y0*generatedWidth+column)*3,b=(y1*generatedWidth+column)*3;
  return [0,1,2].map(channel=>source[a+channel]*(1-fy)+source[b+channel]*fy);
 };
 const a=atColumn(x0,y),b=atColumn(x1,y);return a.map((value,index)=>Math.round(value*(1-fx)+b[index]*fx));
};
const generatedTop=x=>{
 const left=Math.max(0,Math.min(generatedWidth-1,Math.floor(x))),right=Math.min(generatedWidth-1,left+1),fraction=x-left;
 return generatedTops[left]+(generatedTops[right]-generatedTops[left])*fraction;
};

// Interpolate the original one-pixel skyline only for sub-pixel coverage.
// Interior placement and the four resource footprints remain unchanged.
const smoothSkyline=x=>{
 const sourceX=(x+.5)/scale-.5,left=Math.floor(sourceX),fraction=sourceX-left;
 const a=skyline[(left+sourceWidth)%sourceWidth],b=skyline[(left+1+sourceWidth)%sourceWidth];
 return (a+(b-a)*fraction)*scale;
};
const rgba=Buffer.alloc(width*height*4),preview=Buffer.alloc(width*height*4),sky=colour(screenSkyIndex),ground=colour(groundIndex);
for(let x=0;x<width;x++){
 const top=smoothSkyline(x),generatedX=Math.max(0,Math.min(generatedWidth-1,(x+.5)*generatedWidth/width-.5));
 const textureTop=generatedTop(generatedX),targetDepth=Math.max(1,horizon*scale-top);
 for(let y=0;y<height;y++){
  const at=(y*width+x)*4,backdrop=y<horizon*scale?sky:ground;put(preview,at,backdrop);
  if(y>=horizon*scale)continue;
  const coverage=Math.max(0,Math.min(1,y+1-top));if(!coverage)continue;
  const generatedY=textureTop+Math.max(0,Math.min(1,(y+.5-top)/targetDepth))*(sourceBase-textureTop);
  const rgb=sampleColour(generatedX,generatedY),alpha=Math.round(coverage*255);put(rgba,at,rgb,alpha);
  const blend=rgb.map((value,index)=>Math.round(value*coverage+backdrop[index]*(1-coverage)));put(preview,at,blend);
 }
}

const panoramaName='tropical-upgraded-background-game-v1-candidate.png';
const previewName='tropical-upgraded-background-v1-candidate-preview.png';
await sharp(rgba,{raw:{width,height,channels:4}}).png().toFile(path.join(out,panoramaName));
await sharp(preview,{raw:{width,height,channels:4}}).png().toFile(path.join(out,previewName));
const sectionDir=path.join(out,'tropical-upgraded-sections-v1-candidate');await fs.mkdir(sectionDir,{recursive:true});
const sections=[];
for(const section of layout){
 const filename=`TROPICAL-${section.name.toUpperCase()}-V1-CANDIDATE.png`,filePath=path.join(sectionDir,filename);
 await sharp(rgba,{raw:{width,height,channels:4}}).extract({left:section.offset*scale,top:section.top*scale,width:section.width*scale,height:section.height*scale}).png().toFile(filePath);
 const bytes=await fs.readFile(filePath);
 sections.push({...section,filename:path.relative(out,filePath),pixelWidth:section.width*scale,pixelHeight:section.height*scale,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
const alphaValues=new Set(),metrics={opaqueAboveSkyline:0,opaqueBelowHorizon:0,transparentColumns:0,antialiasedPixels:0};
for(let x=0;x<width;x++){
 let found=false;const top=smoothSkyline(x);
 for(let y=0;y<height;y++){
  const alpha=rgba[(y*width+x)*4+3];alphaValues.add(alpha);if(alpha)found=true;
  if(alpha&&y+1<top)metrics.opaqueAboveSkyline++;
  if(alpha&&y>=horizon*scale)metrics.opaqueBelowHorizon++;
  if(alpha>0&&alpha<255)metrics.antialiasedPixels++;
 }
 if(!found)metrics.transparentColumns++;
}
const report={
 candidate:'tropical-v1',mode:'Built-in image generation edit followed by deterministic original-envelope packaging',
 generatedMaster:{filename:generatedName,width:generatedWidth,height:generatedHeight},
 original:{filename:'tropical-original-panorama.png',width:sourceWidth,height:sourceHeight,source:'TROPICAL.PVS'},
 panorama:{filename:panoramaName,width,height,alphaValues:[...alphaValues].sort((a,b)=>a-b),skyTransparent:true,groundTransparent:true},
 preview:{filename:previewName,width,height,sky,ground},sourceHorizon:horizon,outputHorizon:horizon*scale,sourceTextureBase:sourceBase,
 textureMapping:{sourceTextureBase:sourceBase,perColumnVerticalFit:true},validation:metrics,sections,
 limitations:['The original outer skyline, wrap order, horizon and section footprints are retained; internal low-poly surface shading remains interpretive.','The generated master is not a native 4096 x 1024 image, so deterministic packaging maps it into the exact game envelope.','This candidate is displayed for review only and is not imported by the game renderer.'],
};
await fs.writeFile(path.join(out,'tropical-v1-candidate-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
