import * as THREE from 'three';
import {CAR_STUDY_MATERIALS} from './car-study-materials.ts';
import type {Shape} from './types.ts';

/** Original painter flag2 attaches details to the preceding base polygon.
 * Rounded lamp vertices can lie inside that panel; preserve their positions
 * and projected outline, but test their fragment depth at the host surface. */
export function originalCarLampParentPlane(shape:Shape,primitiveIndex:number):THREE.Plane|undefined{
 if(!(shape.primitives[primitiveIndex]?.flags&2))return;
 let parent=primitiveIndex-1;
 while(parent>=0&&(shape.primitives[parent].flags&2))parent--;
 const primitive=shape.primitives[parent];
 if(!primitive||primitive.type<3||primitive.type>10)return;
 const points=primitive.indices.map(index=>new THREE.Vector3(...shape.vertices[index]).multiplyScalar(1/400));
 const normal=new THREE.Vector3();
 for(let i=1;i<points.length-1;i++)normal.add(new THREE.Vector3().subVectors(points[i],points[0]).cross(new THREE.Vector3().subVectors(points[i+1],points[0])));
 if(normal.lengthSq()<1e-14)return;
 return new THREE.Plane().setFromNormalAndCoplanarPoint(normal.normalize(),points[0]);
}

function installLampParentDepth(material:THREE.MeshBasicMaterial,plane:THREE.Plane){
 const compile=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 const point=plane.coplanarPoint(new THREE.Vector3());
 material.onBeforeCompile=(shader,renderer)=>{
  compile(shader,renderer);
  shader.uniforms.originalLampHostNormal={value:plane.normal};
  shader.uniforms.originalLampHostPoint={value:point};
  const varyings='varying vec3 vLampViewPosition; varying vec4 vLampHostPlane;\n';
  shader.vertexShader='uniform vec3 originalLampHostNormal; uniform vec3 originalLampHostPoint;\n'+varyings+shader.vertexShader;
  shader.fragmentShader=varyings+shader.fragmentShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vLampViewPosition=mvPosition.xyz;
   vec3 lampHostNormal=normalize(normalMatrix*originalLampHostNormal);
   vec3 lampHostPoint=(modelViewMatrix*vec4(originalLampHostPoint,1.0)).xyz;
   vLampHostPlane=vec4(lampHostNormal,dot(lampHostNormal,lampHostPoint));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <logdepthbuf_fragment>',`#include <logdepthbuf_fragment>
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
   float lampRayDenominator=dot(vLampHostPlane.xyz,vLampViewPosition);
   if(abs(lampRayDenominator)>0.000001){
    float lampHostRayScale=vLampHostPlane.w/lampRayDenominator;
    if(lampHostRayScale>0.0){
     float lampHostDepth=log2(max(0.000001,1.0-vLampViewPosition.z*lampHostRayScale))*logDepthBufFC*0.5;
     gl_FragDepth=min(gl_FragDepth,lampHostDepth-0.000002);
    }
   }
#endif`);
 };
 material.customProgramCacheKey=()=>key+'/original-lamp-host-depth-v2';
}

/** Keep the authored display-space chroma. Study lighting still supplies
 * diffuse shading and view-dependent specular intensity, but neither colored
 * fill nor channel-by-channel ACES can bleach or rotate the palette hue. */
function installOriginalCarChroma(material:THREE.MeshStandardMaterial,polishedPaint=false){
 const compile=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  compile(shader,renderer);
  // x: coloured reflection strength, y: coloured lift ceiling, z: the small
  // neutral clear-coat glint which makes the paint read as newly polished.
  shader.uniforms.originalCarPolish={value:new THREE.Vector3(polishedPaint?.95:.18,polishedPaint?.68:.18,polishedPaint?.40:0)};
  shader.fragmentShader='uniform vec3 originalCarPolish;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>','');
  shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`
   vec3 carPaletteDisplay=linearToOutputTexel(vec4(diffuseColor.rgb,1.0)).rgb;
   float carPaletteValue=max(max(carPaletteDisplay.r,carPaletteDisplay.g),carPaletteDisplay.b);
   vec3 carLuminance=vec3(0.2126,0.7152,0.0722);
   float carDiffuseIntensity=dot(totalDiffuse,carLuminance)/max(dot(diffuseColor.rgb,carLuminance),0.00001);
   float carShadeGain=clamp(pow(max(carDiffuseIntensity,0.0)*0.75,0.45),0.52,1.10);
   float carSpecularSignal=max(0.0,dot(totalSpecular,carLuminance));
   float carSpecularLift=clamp(carSpecularSignal*originalCarPolish.x,0.0,originalCarPolish.y);
   float carShadedValue=min(1.0,carPaletteValue*carShadeGain+carSpecularLift);
   // Scale all output channels together; avoid independent channel clipping.
   vec3 carPaint=carPaletteValue>0.00001
    ?carPaletteDisplay*(carShadedValue/carPaletteValue)
    :vec3(min(0.16,carSpecularLift));
   // A narrow neutral reflection sits over the coloured paint like clear coat.
   // Two camera-space studio strips keep it visible as the car turns, while
   // the source panels and their intentionally flat normals remain unchanged.
   vec3 carStudioReflection=reflect(-geometryViewDir,geometryNormal);
   float carStudioStripA=pow(max(0.0,dot(carStudioReflection,normalize(vec3(0.00,1.00,0.05)))),18.0);
   float carStudioStripB=pow(max(0.0,dot(carStudioReflection,normalize(vec3(-0.70,0.65,0.30)))),28.0);
   float carFresnel=pow(1.0-clamp(dot(geometryNormal,geometryViewDir),0.0,1.0),3.0);
   float carClearcoatSignal=max(max(smoothstep(0.02,0.20,carSpecularSignal),smoothstep(0.12,0.58,carFresnel)),max(carStudioStripA,carStudioStripB));
   float carClearcoat=carClearcoatSignal*originalCarPolish.z;
   float carPaintValue=max(max(carPaint.r,carPaint.g),carPaint.b);
   float carClearcoatCap=min(1.0-carPaintValue,carPaintValue*0.65);
   gl_FragColor.rgb=carPaint+vec3(min(carClearcoat,carClearcoatCap));`);
 };
 material.customProgramCacheKey=()=>key+'/original-car-chroma-v1';
}

/** A source polygon is one authored panel, even when its rounded vertices
 * are not perfectly planar. Give its triangulated fragments one lighting
 * normal through the shader, leaving every geometry attribute untouched. */
function installOriginalPanelNormal(material:THREE.MeshStandardMaterial,shape:Shape,primitiveIndex:number){
 const primitive=shape.primitives[primitiveIndex];
 if(!primitive||primitive.type<3||primitive.type>10)return;
 const points=primitive.indices.map(index=>new THREE.Vector3(...shape.vertices[index])),normal=new THREE.Vector3();
 for(let i=1;i<points.length-1;i++)normal.add(new THREE.Vector3().subVectors(points[i],points[0]).cross(new THREE.Vector3().subVectors(points[i+1],points[0])));
 if(normal.lengthSq()<1e-12)return;
 normal.normalize();
 const compile=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  compile(shader,renderer);
  shader.uniforms.originalCarPanelNormal={value:normal};
  shader.vertexShader='uniform vec3 originalCarPanelNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=originalCarPanelNormal; // one original panel normal');
 };
 material.customProgramCacheKey=()=>key+'/original-panel-normal-v4';
}

const groundContactPanels=new WeakMap<Shape,Set<number>>();

/** Identify upward-facing body panels authored at the road-tire contact plane.
 * The full-detail Countach has two such lower-chassis fills. They belong to the
 * car and remain available when airborne, but a ground receiver must win an
 * equal-depth test while the tyres are planted. */
export function isOriginalGroundContactPanel(shape:Shape,primitiveIndex:number){
 let panels=groundContactPanels.get(shape);
 if(!panels){
  panels=new Set<number>();
  const wheels=shape.primitives.filter(primitive=>primitive.type===12).map(primitive=>{
   const a=new THREE.Vector3(...shape.vertices[primitive.indices[0]]),rim=new THREE.Vector3(...shape.vertices[primitive.indices[1]]),b=new THREE.Vector3(...shape.vertices[primitive.indices[3]]);
   const axis=b.clone().sub(a),radius=rim.distanceTo(a),radialY=radius*Math.sqrt(Math.max(0,1-(axis.y/axis.length())**2));
   return {x:(a.x+b.x)/800,bottom:((a.y+b.y)/2-radialY)/400};
  });
  if(wheels.length){
   const maxLateral=Math.max(...wheels.map(wheel=>Math.abs(wheel.x)));
   const contact=Math.min(...wheels.filter(wheel=>Math.abs(wheel.x)>=maxLateral*.75).map(wheel=>wheel.bottom));
   shape.primitives.forEach((primitive,index)=>{
    if(primitive.type<3||primitive.type>10||primitive.indices.length<3)return;
    const points=primitive.indices.map(vertex=>new THREE.Vector3(...shape.vertices[vertex]).multiplyScalar(1/400));
    const normal=new THREE.Vector3().crossVectors(points[1].clone().sub(points[0]),points[2].clone().sub(points[0])).normalize();
    const heights=points.map(point=>point.y);
    if(normal.y>.9&&Math.max(...heights)-Math.min(...heights)<1e-9&&Math.max(...heights)<=contact+1e-9)panels!.add(index);
   });
  }
  groundContactPanels.set(shape,panels);
 }
 return panels.has(primitiveIndex);
}

/** Source lamp lenses, not paint or windows. The spatial check disambiguates
 * shared palette IDs from trim/decals; the Indy driver's white helmet is a
 * sphere, not a lamp. Some coarse source models intentionally omit lamps. */
export function isOriginalCarLamp(shape:Shape,primitiveIndex:number):boolean{
 const primitive=shape.primitives[primitiveIndex];
 if(!primitive||primitive.type<3||primitive.type>10)return false;
 const ids=primitive.materials,id=ids[0];
 if([14,15,45,46].includes(id))return true;
 const front=Math.max(...shape.vertices.map(vertex=>vertex[2]));
 const atFront=primitive.indices.every(index=>shape.vertices[index][2]>front*.6);
 if(!atFront)return false;
 if(ids.every(material=>material===id)&&id>=121&&id<=126)return true;
 // Ferrari's grey inner headlamp lenses and the Corvette's source-grey
 // headlights / yellow side indicators keep their authored palette colors.
 return (id===7&&!!(primitive.flags&2))||(ids.includes(15)&&ids.every(material=>material===77||material===15))||(ids.includes(14)&&ids.every(material=>material===61||material===14));
}

/** Replace materials only: no geometry attributes, topology, transforms or
 * child objects are changed. Source paint and attached-detail shader hooks
 * survive the transition from unlit to study-style physical materials. */
export function applyUpgradedCarMaterials(model:THREE.Group,shape:Shape){
 model.traverse(node=>{
  if(!(node instanceof THREE.Mesh)||node.userData.originalCarLine)return;
  const primitive=shape.primitives[node.userData.originalPrimitive],source=primitive?.materials[0];
  const groundContact=isOriginalGroundContactPanel(shape,node.userData.originalPrimitive);
  if(isOriginalCarLamp(shape,node.userData.originalPrimitive)){
   // Keep the original unlit lens, including source stipple/depth hooks.
   // It must not turn black under directional lighting or ACES tone mapping.
   node.userData.originalCarLamp=true;
   // The source renderer substitutes material 45 with material 46 normally
   // and material 47 while this car's braking byte is active. The car models
   // use that placeholder only for their authored rear brake-light faces.
   if(source===45)node.userData.originalCarBrakeLight=true;
   const plane=originalCarLampParentPlane(shape,node.userData.originalPrimitive);
   if(plane)for(const material of Array.isArray(node.material)?node.material:[node.material])if(material instanceof THREE.MeshBasicMaterial)installLampParentDepth(material,plane);
   return;
  }
  const glass=source===0||source===38||source===44;
  const profile=node.userData.originalWheelPart==='tire'?CAR_STUDY_MATERIALS.tire:node.userData.originalWheelPart==='hub'?CAR_STUDY_MATERIALS.hub:glass?CAR_STUDY_MATERIALS.glass:CAR_STUDY_MATERIALS.body;
  const replace=(old:THREE.Material)=>{
   if(!(old instanceof THREE.MeshBasicMaterial))return old;
   const material=new THREE.MeshStandardMaterial({color:old.color,...profile,side:old.side,flatShading:false,toneMapped:false,vertexColors:old.vertexColors,transparent:old.transparent,opacity:old.opacity,depthTest:old.depthTest,depthWrite:old.depthWrite,polygonOffset:old.polygonOffset,polygonOffsetFactor:old.polygonOffsetFactor,polygonOffsetUnits:old.polygonOffsetUnits});
   material.onBeforeCompile=old.onBeforeCompile.bind(old);material.onBeforeRender=old.onBeforeRender.bind(old);
   const sourceKey=old.customProgramCacheKey();material.customProgramCacheKey=()=>sourceKey+'/study-car-material-v1';
   installOriginalCarChroma(material,profile===CAR_STUDY_MATERIALS.body);
   if(node.userData.originalBodyFace)installOriginalPanelNormal(material,shape,node.userData.originalPrimitive);
   if(groundContact)node.userData.originalGroundContactPanel=true;
   return material;
  };
  node.material=Array.isArray(node.material)?node.material.map(replace):replace(node.material);
 });
}

/** The detailed Countach contains two paint-coloured lower-chassis fills at
 * exactly the tyre contact plane. The original depth ordering lets the road
 * cover them while the car is planted, but keeps them available when the car
 * is airborne or rolled over. Mirror that rule explicitly: logarithmic depth
 * buffers cannot resolve two independently transformed coplanar surfaces
 * reliably at every camera angle. */
export function setUpgradedCarGroundContactPanels(model:THREE.Group,grounded:boolean){
 const visible=!grounded;
 if(model.userData.originalGroundContactPanelsVisible===visible)return;
 model.userData.originalGroundContactPanelsVisible=visible;
 model.traverse(node=>{
  if(node instanceof THREE.Mesh&&node.userData.originalGroundContactPanel)node.visible=visible;
 });
}

/** Apply the source's live material-45 substitution without rebuilding or
 * modifying any car geometry. Captured race memory supplies the braking byte,
 * so driving, opponents and replay seeks all select the correct frame state. */
export function setUpgradedCarBrakeLights(model:THREE.Group,braking:boolean,materials:{indices:readonly number[];palette:readonly number[]}){
 const state=braking?1:0;
 if(model.userData.originalCarBrakeLightState===state)return;
 model.userData.originalCarBrakeLightState=state;
 const sourceMaterial=braking?47:46,index=materials.indices[sourceMaterial],at=index*3;
 model.traverse(node=>{
  if(!(node instanceof THREE.Mesh)||!node.userData.originalCarBrakeLight)return;
  for(const material of Array.isArray(node.material)?node.material:[node.material])if(material instanceof THREE.MeshBasicMaterial){
   material.color.setRGB(materials.palette[at]/255,materials.palette[at+1]/255,materials.palette[at+2]/255,THREE.SRGBColorSpace);
  }
 });
}

/** The study's sky fill, warm key and cool rim; key direction uses the shared
 * world Sun, while BasicMaterial scenery is unaffected by lights. */
export function addUpgradedCarStudyLights(scene:THREE.Scene,sunDirection:THREE.Vector3){
 const hemisphere=new THREE.HemisphereLight(0xcfe6ff,0x3f4548,2.5);
 const sun=new THREE.DirectionalLight(0xfff2d2,4);sun.position.copy(sunDirection);
 const rim=new THREE.DirectionalLight(0x80baff,2);rim.position.set(-4,3,-4);
 scene.add(hemisphere,sun,rim);
 return {hemisphere,sun,rim};
}
