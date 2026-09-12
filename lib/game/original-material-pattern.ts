import * as THREE from 'three';
export interface OriginalMaterialPatterns {patterns?:readonly number[];masks?:readonly number[];baseColors?:readonly number[];palette:readonly number[]}
export function readOriginalMaterialPatterns(memory:Uint8Array,d=0x2d1a0){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),table=(at:number)=>Array.from({length:129},(_,i)=>v.getUint16(d+((v.getUint16(d+at,true)+i*2)&65535),true));
 return {patterns:table(0xa32e),masks:table(0xa3a2),baseColors:table(0x9fe8)};
}
/** Screen-aligned original 8x2 stipple, including genuinely open mask pixels.
 * Discarded pixels write neither color nor depth, so objects behind stay visible. */
export function applyOriginalMaterialPattern(material:THREE.MeshBasicMaterial,geometry:THREE.BufferGeometry,materials:readonly number[],source:OriginalMaterialPatterns){
 if(!source.patterns||!source.masks||!source.baseColors)return;
 const pattern:number[]=[],base:number[]=[];
 for(const id of materials){pattern.push(source.patterns[id]??0,source.masks[id]??0);const index=(source.baseColors[id]??0)*3,c=new THREE.Color((source.palette[index]<<16)|(source.palette[index+1]<<8)|source.palette[index+2]);base.push(c.r,c.g,c.b);}
 geometry.setAttribute('originalPattern',new THREE.Float32BufferAttribute(pattern,2));geometry.setAttribute('originalBaseColor',new THREE.Float32BufferAttribute(base,3));
 const compile=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material),beforeRender=material.onBeforeRender.bind(material),size=new THREE.Vector2();
 material.onBeforeRender=(renderer,scene,camera,geometry,object,group)=>{
  beforeRender(renderer,scene,camera,geometry,object,group);
  renderer.getDrawingBufferSize(size);
 };
 material.onBeforeCompile=(shader,renderer)=>{compile(shader,renderer);shader.uniforms.originalResolution={value:size};
  shader.vertexShader='attribute vec2 originalPattern; attribute vec3 originalBaseColor; varying vec2 vOriginalPattern; varying vec3 vOriginalBaseColor;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvOriginalPattern=originalPattern;vOriginalBaseColor=originalBaseColor;');
  shader.fragmentShader='uniform vec2 originalResolution; varying vec2 vOriginalPattern; varying vec3 vOriginalBaseColor;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(vOriginalPattern.x>0.5){
    vec2 pixel=floor(vec2(gl_FragCoord.x,originalResolution.y-gl_FragCoord.y)*vec2(320.0,200.0)/originalResolution);
    float bits=mod(pixel.y,2.0)<0.5?floor(vOriginalPattern.y/256.0):mod(vOriginalPattern.y,256.0);
    bool ink=mod(floor(bits/pow(2.0,7.0-mod(pixel.x,8.0))),2.0)>0.5;
    if(vOriginalPattern.x<1.5){if(!ink)discard;}else if(!ink){diffuseColor.rgb=vOriginalBaseColor;}
   }`);
 };
 const previousKey=key();material.customProgramCacheKey=()=>previousKey+'/original-stipple-v1';
}
