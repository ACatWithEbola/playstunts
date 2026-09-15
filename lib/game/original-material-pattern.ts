import * as THREE from 'three';
export interface OriginalMaterialPatterns {patterns?:readonly number[];masks?:readonly number[];baseColors?:readonly number[];palette:readonly number[]}

// These are genuinely open scenery surfaces rather than paint dithers. Their
// source masks describe fences, nets and perforated stunt structures, so a
// fixed screen-space mask makes distant holes look just as large as nearby
// ones. Four source-world units per mask pixel preserves the near-field scale
// while allowing the perspective projection to reduce it with distance.
const PERSPECTIVE_OPEN_PATTERN_MATERIALS=new Set([22,23,24,34,94]);
const OPEN_PATTERN_WORLD_PIXEL=4;

function maskCoverage(mask:number){
 let count=0;
 for(let bit=0;bit<16;bit++)count+=(mask>>bit)&1;
 return count/16;
}

export function readOriginalMaterialPatterns(memory:Uint8Array,d=0x2d1a0){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),table=(at:number)=>Array.from({length:129},(_,i)=>v.getUint16(d+((v.getUint16(d+at,true)+i*2)&65535),true));
 return {patterns:table(0xa32e),masks:table(0xa3a2),baseColors:table(0x9fe8)};
}
/** Original 8x2 stipple, including genuinely open mask pixels.
 * Open scenery masks are anchored to their source surface and therefore obey
 * perspective. Paint dithers retain the original screen-aligned presentation.
 * Discarded pixels write neither color nor depth, so objects behind stay visible. */
export function applyOriginalMaterialPattern(material:THREE.MeshBasicMaterial,geometry:THREE.BufferGeometry,materials:readonly number[],source:OriginalMaterialPatterns){
 if(!source.patterns||!source.masks||!source.baseColors)return;
 const pattern:number[]=[],base:number[]=[];
 for(const id of materials){const mask=source.masks[id]??0;pattern.push(source.patterns[id]??0,mask,Number(PERSPECTIVE_OPEN_PATTERN_MATERIALS.has(id)),maskCoverage(mask));const index=(source.baseColors[id]??0)*3,c=new THREE.Color((source.palette[index]<<16)|(source.palette[index+1]<<8)|source.palette[index+2]);base.push(c.r,c.g,c.b);}
 geometry.setAttribute('originalPattern',new THREE.Float32BufferAttribute(pattern,4));geometry.setAttribute('originalBaseColor',new THREE.Float32BufferAttribute(base,3));
 const normal=geometry.getAttribute('normal');
 geometry.setAttribute('originalPatternNormal',normal??new THREE.Float32BufferAttribute(new Float32Array(materials.length*3),3));
 const compile=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material),beforeRender=material.onBeforeRender.bind(material),size=new THREE.Vector2();
 material.onBeforeRender=(renderer,scene,camera,geometry,object,group)=>{
  beforeRender(renderer,scene,camera,geometry,object,group);
  renderer.getDrawingBufferSize(size);
 };
 material.onBeforeCompile=(shader,renderer)=>{compile(shader,renderer);shader.uniforms.originalResolution={value:size};
  shader.vertexShader='attribute vec4 originalPattern; attribute vec3 originalBaseColor; attribute vec3 originalPatternNormal; varying vec4 vOriginalPattern; varying vec3 vOriginalBaseColor; varying vec3 vOriginalSurfacePosition; varying vec3 vOriginalSurfaceNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvOriginalPattern=originalPattern;vOriginalBaseColor=originalBaseColor;vOriginalSurfacePosition=position;vOriginalSurfaceNormal=originalPatternNormal;');
  shader.fragmentShader='uniform vec2 originalResolution; varying vec4 vOriginalPattern; varying vec3 vOriginalBaseColor; varying vec3 vOriginalSurfacePosition; varying vec3 vOriginalSurfaceNormal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(vOriginalPattern.x>0.5){
    vec2 pixel;
    bool unresolved=false;
    if(vOriginalPattern.z>0.5){
     vec3 normalMagnitude=abs(vOriginalSurfaceNormal);
     vec2 surface=normalMagnitude.x>normalMagnitude.y&&normalMagnitude.x>normalMagnitude.z?vOriginalSurfacePosition.zy:(normalMagnitude.y>normalMagnitude.z?vOriginalSurfacePosition.xz:vOriginalSurfacePosition.xy);
     vec2 projected=surface/${OPEN_PATTERN_WORLD_PIXEL.toFixed(1)};
     vec2 footprint=fwidth(projected);
     unresolved=max(footprint.x,footprint.y)>0.75;
     pixel=floor(projected);
    }else{
     pixel=floor(vec2(gl_FragCoord.x,originalResolution.y-gl_FragCoord.y)*vec2(320.0,200.0)/originalResolution);
    }
    float bits=mod(pixel.y,2.0)<0.5?floor(vOriginalPattern.y/256.0):mod(vOriginalPattern.y,256.0);
    bool ink=mod(floor(bits/pow(2.0,7.0-mod(pixel.x,8.0))),2.0)>0.5;
    if(unresolved){
     vec2 farPixel=mod(floor(gl_FragCoord.xy),2.0);
     float rank=farPixel.x+2.0*farPixel.y;
     ink=rank<floor(vOriginalPattern.w*4.0+0.5);
    }
    if(vOriginalPattern.x<1.5){if(!ink)discard;}else if(!ink){diffuseColor.rgb=vOriginalBaseColor;}
   }`);
 };
 const previousKey=key();material.customProgramCacheKey=()=>previousKey+'/original-stipple-v2';
}
