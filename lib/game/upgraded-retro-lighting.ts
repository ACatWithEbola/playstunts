import * as THREE from 'three';

export type RetroSceneryCaster=THREE.Group|{
 source:THREE.Group;
 caster:THREE.Group;
 receiver:THREE.Group;
 patterned?:boolean;
};
type NormalizedRetroSceneryCaster={source:THREE.Group;caster:THREE.Group;receiver?:THREE.Group;patterned?:boolean};

/** Display-world direction (the race scene mirrors source Z), independent of
 * the car heading and camera. At 55 degrees the low Indy silhouette extends
 * beyond the body in native-resolution helicopter views, including grass
 * suspension travel; a 70-degree sun hid most of it beneath the car. */
// Parallel sunlight from the forward/right side of the initial road heading.
// The Sun's ~149.6 million km distance is represented by this world-fixed
// direction, not by a nearby point light or an enormous scene object.
// Shadow coverage is antialiased and softly filtered for the upgraded view.
// The filter is an artistic real-time approximation, not a solar penumbra simulation.
const SUN_ELEVATION = THREE.MathUtils.degToRad(55);
const SUN_AZIMUTH = THREE.MathUtils.degToRad(-45);
export const RETRO_SUN = new THREE.Vector3(
 Math.cos(SUN_ELEVATION) * Math.cos(SUN_AZIMUTH),
 Math.sin(SUN_ELEVATION),
 Math.cos(SUN_ELEVATION) * Math.sin(SUN_AZIMUTH),
).normalize();
// Face lighting shares the physical Sun direction. Thresholds retain the base
// colour on horizontal ground while raised geometry gains readable planes.
const RETRO_FACE_LIGHT = RETRO_SUN;
const BRIGHT_FACE = .95, MID_FACE = .78;
// The distance pass begins beyond the near driving scene and approaches one
// restrained blend at the far side of the 30x30-tile world. Palette entry 112
// is the original game's pale cyan, so the added depth stays within its own
// colour language instead of introducing modern grey fog.
export const RETRO_DISTANCE_COLOUR = {
 start: 5*1024,
 end: 22*1024,
 strength: .25,
 tint: [216/255,252/255,252/255] as const,
};
const retroDistanceTint=new THREE.Color().setRGB(...RETRO_DISTANCE_COLOUR.tint,THREE.SRGBColorSpace);
const CAR_SHADOW_SIZE = 512;
const SCENERY_SHADOW_SIZE = 1536;
const DISTANT_SCENERY_SHADOW_SIZE = 1024;
export const UPGRADED_SHADOW_AMBIENT = .48;
// Four world units per texel retain nearby building/tree silhouettes while
// giving the detailed cascade a two-tile radius. The previous one-tile-wide
// map did not reach visible scenery until the car was almost beside it.
const SCENERY_SHADOW_EXTENT = 4096;
// The second cascade follows the camera-facing part of the track instead of
// spending most of its pixels on the complete 30x30 map behind the driver.
// Twenty-four world units per texel are still below a native display pixel at
// the far end of this range and keep visible shadows present out to the horizon.
const DISTANT_SCENERY_SHADOW_EXTENT = 24576;
const DISTANT_SCENERY_SHADOW_DEPTH = 32768;
const SCENERY_CASCADE_FEATHER_TEXELS = 24;
const CAR_SHADOWS = 2;
const SCENERY_SHADOW = 2;
const DISTANT_SCENERY_SHADOW = 3;
// Only receivers use the silhouette maps, so no self-shadow acne offset is
// needed. Keep the tolerance below one map texel to retain tire contact.
const SHADOW_DEPTH_BIAS = .125 / 16383;
const DISTANT_SHADOW_DEPTH_BIAS = .125 / (DISTANT_SCENERY_SHADOW_DEPTH-1);
// The receiver pass stores the first surface reached after the car. Allow a
// few display units for depth variation across a nearest-filtered texel while
// still keeping vertically separated bridge decks and ground distinct.
const CAR_RECEIVER_TOLERANCE = 4 / 16383;
// Track tiles can overlap their terrain underlay by a few source units. A
// wider scenery-only tolerance keeps one silhouette continuous across those
// harmless layers while remaining far below a bridge deck's 450-unit gap.
const SCENERY_RECEIVER_TOLERANCE = 32 / 16383;
const DISTANT_SCENERY_RECEIVER_TOLERANCE = 32 / (DISTANT_SCENERY_SHADOW_DEPTH-1);
const shadowBiasMatrix = new THREE.Matrix4().set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1);

// Screen-space line meshes contain reusable carrier triangles, not physical
// car/world surfaces. Source seam fillers are presentation-only as well.
const presentationOnlyShadowGeometry=(node:THREE.Object3D)=>!!(node.userData.originalEdgeVisibility||node.userData.originalCarLine||node.userData.originalPresentationSeam||('isLineSegments2' in node&&node.isLineSegments2));

export function retroFaceShade(normal: THREE.Vector3) {
 const light = normal.clone().normalize().dot(RETRO_FACE_LIGHT);
 return light > BRIGHT_FACE ? 1.1 : light > MID_FACE ? 1 : .76;
}

export function retroDistanceStrength(distance:number){
 const normalized=THREE.MathUtils.clamp((distance-RETRO_DISTANCE_COLOUR.start)/(RETRO_DISTANCE_COLOUR.end-RETRO_DISTANCE_COLOUR.start),0,1);
 return normalized*normalized*(3-2*normalized)*RETRO_DISTANCE_COLOUR.strength;
}

/** A tight, fixed-scale light view follows each car. Shadow pixels stay small
 * during high jumps; the receiving mesh determines the height and slope. */
export function placeRetroShadowCamera(camera: THREE.OrthographicCamera, center: THREE.Vector3, extent: number, mapSize=CAR_SHADOW_SIZE, depth=16384, sunDirection=RETRO_SUN, near=1) {
 camera.left = camera.bottom = -extent / 2;
 camera.right = camera.top = extent / 2;
 camera.near = near;
 camera.far = depth;
 camera.position.copy(center).addScaledVector(sunDirection, depth/2);
 camera.up.set(0,1,0);
 camera.lookAt(center);
 camera.updateMatrixWorld(true);
 // Stabilize the projection in light-space texels as the car moves.
 const lightCenter = center.clone().applyMatrix4(camera.matrixWorldInverse);
 const worldOrigin = new THREE.Vector3().applyMatrix4(camera.matrixWorldInverse);
 const texel = extent / mapSize;
 const dx = Math.round(worldOrigin.x / texel) * texel - worldOrigin.x;
 const dy = Math.round(worldOrigin.y / texel) * texel - worldOrigin.y;
 // Projection subtracts the orthographic bounds centre. Apply the snap in
 // the opposite direction so a fixed world point remains on a fixed shadow
 // texel while the car-centred light view moves. Adding this delta doubled
 // within-texel motion and then snapped the map backwards at each boundary.
 camera.left += lightCenter.x - dx; camera.right += lightCenter.x - dx;
 camera.bottom += lightCenter.y - dy; camera.top += lightCenter.y - dy;
 camera.updateProjectionMatrix();
 return shadowBiasMatrix.clone().multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
}

type Shadow = {
 target: THREE.WebGLRenderTarget;
 receiverTarget: THREE.WebGLRenderTarget;
 coverageTarget: THREE.WebGLRenderTarget;
 filterTarget: THREE.WebGLRenderTarget;
 scene: THREE.Scene;
 camera: THREE.OrthographicCamera;
 matrix: {value: THREE.Matrix4};
 texel: {value: THREE.Vector2};
 active: {value: number};
 proxies: {source: THREE.Mesh; mesh: THREE.Mesh}[];
 proxyBySource: WeakMap<THREE.Mesh,THREE.Mesh>;
 source?: THREE.Group;
 renderedRevision?: number;
 renderedCenter?: THREE.Vector3;
};

/** This layer is installed only by the upgraded race renderer. It composes
 * with original palette/stipple/depth shaders; it never changes game memory. */
export function createUpgradedRetroLighting(options:{sunDirection?:THREE.Vector3;worldScale?:number}={}) {
 const sunDirection=(options.sunDirection??RETRO_SUN).clone().normalize(),worldScale=options.worldScale??1;
 if(!Number.isFinite(worldScale)||worldScale<=0)throw Error('Shadow world scale must be positive');
 // RGB stores depth and alpha explicitly identifies a rasterized caster.
 // Uncovered pixels must never be treated as the shadow-camera footprint.
 const depthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBDepthPacking, side: THREE.DoubleSide, blending: THREE.NoBlending, toneMapped: false});
 // The completed car borrows downward-facing rollover floors from car1.
 // Those coarse floors can extend outside car0's detailed outline. Forcing
 // their back faces to cast from above creates a detached rectangular lip
 // that switches on/off as its height crosses the grass receiver. Preserve
 // authored car sidedness: these floors still cast when exposed in a roll.
 const carDepthMaterial=depthMaterial.clone();carDepthMaterial.side=THREE.FrontSide;
 // Some original models use pattern 1 as genuine open space. The windmill's
 // rotating blade variants are built from alternating solid and fully open
 // wedges; a plain depth material would fill those openings into a disk.
 const patternedDepthMaterial = depthMaterial.clone(),patternResolution=new THREE.Vector2(1,1);
 patternedDepthMaterial.onBeforeRender=renderer=>{const target=renderer.getRenderTarget();if(target)patternResolution.set(target.width,target.height);else renderer.getDrawingBufferSize(patternResolution);};
 patternedDepthMaterial.onBeforeCompile=shader=>{
  shader.uniforms.originalShadowResolution={value:patternResolution};
  shader.vertexShader='attribute vec2 originalPattern; varying vec2 vOriginalShadowPattern;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvOriginalShadowPattern=originalPattern;');
  shader.fragmentShader='uniform vec2 originalShadowResolution; varying vec2 vOriginalShadowPattern;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
   if(vOriginalShadowPattern.x>.5&&vOriginalShadowPattern.x<1.5){
    vec2 pixel=floor(vec2(gl_FragCoord.x,originalShadowResolution.y-gl_FragCoord.y));
    float bits=mod(pixel.y,2.0)<0.5?floor(vOriginalShadowPattern.y/256.0):mod(vOriginalShadowPattern.y,256.0);
    bool ink=mod(floor(bits/pow(2.0,7.0-mod(pixel.x,8.0))),2.0)>0.5;
    if(!ink)discard;
   }`).replace('gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );','gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), vOriginalShadowPattern.x>.5&&vOriginalShadowPattern.x<1.5 ? .75 : 1.0 );');
 };
 patternedDepthMaterial.customProgramCacheKey=()=>depthMaterial.customProgramCacheKey()+'/original-caster-pattern-v2';
 const casterMaterial=(mesh:THREE.Mesh,patterned=mesh.userData.retroPatternedShadow===true)=>patterned&&mesh.geometry.hasAttribute('originalPattern')?patternedDepthMaterial:depthMaterial;
 const makeShadow=(size:number):Shadow=>{
  const scene=new THREE.Scene();
  // Proxy matrices are copied directly from their world-space sources. Avoid
  // walking every proxy again before each of the shadow renderer's passes.
  scene.matrixWorldAutoUpdate=false;
  return {
  target: new THREE.WebGLRenderTarget(size, size, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false}),
  receiverTarget: new THREE.WebGLRenderTarget(size, size, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false}),
  // RG holds solid/aperture coverage; BA holds their weighted receiver depth.
  // Depth is centred about .5 to retain sub-unit half-float precision near
  // the shadow camera's centre. Filtering never interpolates packed RGB depth.
  // The receiver pass writes filtered-shadow coverage here directly. Its
  // depth buffer keeps the first receiving surface, exactly as the former
  // intermediate packed-depth target did.
  coverageTarget:new THREE.WebGLRenderTarget(size,size,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true,generateMipmaps:false}),
  filterTarget:new THREE.WebGLRenderTarget(size,size,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,generateMipmaps:false}),
 scene, camera: new THREE.OrthographicCamera(),
  matrix: {value: new THREE.Matrix4()}, texel:{value:new THREE.Vector2(1/size,1/size)}, active: {value: 0}, proxies: [], proxyBySource:new WeakMap(),
  };
 };
 const shadows: Shadow[] = [makeShadow(CAR_SHADOW_SIZE),makeShadow(CAR_SHADOW_SIZE),makeShadow(SCENERY_SHADOW_SIZE),makeShadow(DISTANT_SCENERY_SHADOW_SIZE)];
 const sceneryShadows=[shadows[SCENERY_SHADOW],shadows[DISTANT_SCENERY_SHADOW]];
 const filteredCoverage={value:true};
 const filterScene=new THREE.Scene(),filterCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const fullscreenVertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
 const filterMaterial=new THREE.ShaderMaterial({
  uniforms:{coverageMap:{value:null},direction:{value:new THREE.Vector2()}},vertexShader:fullscreenVertex,
  fragmentShader:`uniform sampler2D coverageMap;uniform vec2 direction;varying vec2 vUv;
   void main(){
    vec4 centre=texture2D(coverageMap,vUv);
    // Separable Gaussian, nine effective taps in five bilinear reads. Apply
    // broad softness only to solid silhouettes; aperture masks keep their
    // original openings with just linear edge antialiasing on display.
    vec4 blurred=centre*.2270270270;
    blurred+=(texture2D(coverageMap,vUv+direction*1.3846153846)+texture2D(coverageMap,vUv-direction*1.3846153846))*.3162162162;
    blurred+=(texture2D(coverageMap,vUv+direction*3.2307692308)+texture2D(coverageMap,vUv-direction*3.2307692308))*.0702702703;
    gl_FragColor=vec4(blurred.r,centre.g,blurred.b,centre.a);
   }`,depthTest:false,depthWrite:false,blending:THREE.NoBlending,toneMapped:false,
 });
 const filterQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),filterMaterial);filterQuad.frustumCulled=false;filterScene.add(filterQuad);
 function filterCoverage(renderer:THREE.WebGLRenderer,shadow:Shadow){
  if(!filteredCoverage.value)return;
  filterQuad.material=filterMaterial;filterMaterial.uniforms.coverageMap.value=shadow.coverageTarget.texture;
  filterMaterial.uniforms.direction.value.set(.65/shadow.target.width,0);renderer.setRenderTarget(shadow.filterTarget);renderer.render(filterScene,filterCamera);
  filterMaterial.uniforms.coverageMap.value=shadow.filterTarget.texture;
  filterMaterial.uniforms.direction.value.set(0,.65/shadow.target.height);renderer.setRenderTarget(shadow.coverageTarget);renderer.render(filterScene,filterCamera);
 }
 const makeReceiverMaterial=(shadow:Shadow,index:number,directCoverage=false)=>new THREE.ShaderMaterial({
  uniforms:{retroCasterMap:{value:shadow.target.texture},retroShadowMatrix:shadow.matrix},
  vertexShader:`varying vec3 vRetroWorld;
   void main() {
    vRetroWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vRetroWorld, 1.0);
   }`,
  fragmentShader:`uniform sampler2D retroCasterMap; uniform mat4 retroShadowMatrix;
   varying vec3 vRetroWorld;
   #include <packing>
   void main() {
    vec3 p = (retroShadowMatrix * vec4(vRetroWorld, 1.0)).xyz;
    if (p.x <= 0.0 || p.x >= 1.0 || p.y <= 0.0 || p.y >= 1.0 || p.z <= 0.0 || p.z >= 1.0) discard;
    vec4 caster = texture2D(retroCasterMap, p.xy);
    if (caster.a < .5) discard;
    float casterDepth = unpackRGBToDepth(caster.rgb);
    if (p.z <= casterDepth + ${(index===DISTANT_SCENERY_SHADOW?DISTANT_SHADOW_DEPTH_BIAS:SHADOW_DEPTH_BIAS).toFixed(12)}) discard;
    ${directCoverage?`float receiverDepth=unpackRGBToDepth(packDepthToRGB(p.z));
    float depth=receiverDepth-.5;
    float solid=step(.9,caster.a),aperture=1.0-solid;
    gl_FragColor=vec4(solid,aperture,solid*depth,aperture*depth);`:'gl_FragColor = vec4(packDepthToRGB(p.z), 1.0);'}
   }`,
  side:THREE.DoubleSide,blending:THREE.NoBlending,depthTest:true,depthWrite:true,toneMapped:false,
 });
 const receiverMaterials=shadows.map((shadow,index)=>makeReceiverMaterial(shadow,index));
 const coverageReceiverMaterials=shadows.map((shadow,index)=>makeReceiverMaterial(shadow,index,true));
 const installed = new WeakSet<THREE.Material>();
 const normalizedFaces = new WeakSet<THREE.BufferGeometry>();
 let cachedScenerySource:RetroSceneryCaster[]|undefined,cachedSceneryEntries:NormalizedRetroSceneryCaster[]=[],cachedSceneryHidden:THREE.Group[]=[],cachedSceneryShown:THREE.Group[]=[],cachedSceneryVisible=0,cachedSceneryRevision:number|undefined;

 function apply(group: THREE.Object3D, receiveCarShadows = true, receiveSceneryShadows = receiveCarShadows) {
  group.traverse(node => {
   if (!(node instanceof THREE.Mesh) || node.userData.originalEdgeVisibility || node.userData.originalCarLamp) return;
   if(!(Array.isArray(node.material)?node.material:[node.material]).some(material=>material instanceof THREE.MeshBasicMaterial))return;
   const geometry = node.geometry;
   const keepsWorldSurfaceColour=geometry.hasAttribute('originalRoadSurface')&&geometry.hasAttribute('originalTerrainSurface');
   const excludesSceneryCasterFaces=geometry.hasAttribute('originalSceneryCaster');
   if (!geometry.hasAttribute('normal')) geometry.computeVertexNormals();
   // A source car polygon may be warped. One normal for the complete source
   // polygon avoids a visible diagonal between its triangulated halves.
   if (node.userData.originalBodyFace && !normalizedFaces.has(geometry)) {
    const normal = geometry.getAttribute('normal'), face = new THREE.Vector3();
    for (let i=0; i<normal.count; i++) face.add(new THREE.Vector3().fromBufferAttribute(normal,i));
    face.normalize();
    for (let i=0; i<normal.count; i++) normal.setXYZ(i,face.x,face.y,face.z);
    normal.needsUpdate = true; normalizedFaces.add(geometry);
   }
   for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
    if (!(material instanceof THREE.MeshBasicMaterial) || installed.has(material)) continue;
    installed.add(material);
    const compile = material.onBeforeCompile.bind(material), key = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
     compile(shader, renderer);
     shader.uniforms.retroSun = {value: sunDirection};
     shader.uniforms.retroDistanceTint = {value: retroDistanceTint};
     shader.uniforms.retroFilteredCoverage=filteredCoverage;
     shadows.forEach((shadow,i) => {
      shader.uniforms['retroShadowMatrix'+i] = shadow.matrix;
      shader.uniforms['retroShadowMap'+i] = {value: shadow.target.texture};
      shader.uniforms['retroShadowReceiverMap'+i] = {value: shadow.receiverTarget.texture};
      shader.uniforms['retroCoverageMap'+i] = {value: shadow.coverageTarget.texture};
      shader.uniforms['retroShadowActive'+i] = shadow.active;
      shader.uniforms['retroShadowTexel'+i] = shadow.texel;
     });
     shader.vertexShader = `${excludesSceneryCasterFaces?'attribute float originalSceneryCaster; varying float vOriginalSceneryCaster; ':''}varying vec3 vRetroNormal; varying vec3 vRetroWorld; varying float vRetroViewDistance;
      ${shader.vertexShader}`;
     shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      ${excludesSceneryCasterFaces?'vOriginalSceneryCaster = originalSceneryCaster;':''}
      vRetroNormal = normalize(mat3(modelMatrix) * normal);
      vRetroWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vRetroViewDistance = length((modelViewMatrix * vec4(transformed, 1.0)).xyz);`);
     shader.fragmentShader = `${excludesSceneryCasterFaces?'varying float vOriginalSceneryCaster; ':''}uniform vec3 retroSun; uniform vec3 retroDistanceTint; varying vec3 vRetroNormal; varying vec3 vRetroWorld; varying float vRetroViewDistance;
      uniform mat4 retroShadowMatrix0; uniform sampler2D retroShadowMap0; uniform sampler2D retroShadowReceiverMap0; uniform float retroShadowActive0; uniform vec2 retroShadowTexel0;
      uniform mat4 retroShadowMatrix1; uniform sampler2D retroShadowMap1; uniform sampler2D retroShadowReceiverMap1; uniform float retroShadowActive1; uniform vec2 retroShadowTexel1;
      uniform mat4 retroShadowMatrix2; uniform sampler2D retroShadowMap2; uniform sampler2D retroShadowReceiverMap2; uniform float retroShadowActive2; uniform vec2 retroShadowTexel2;
      uniform mat4 retroShadowMatrix3; uniform sampler2D retroShadowMap3; uniform sampler2D retroShadowReceiverMap3; uniform float retroShadowActive3; uniform vec2 retroShadowTexel3;
      #include <packing>
      uniform sampler2D retroCoverageMap0;uniform sampler2D retroCoverageMap1;uniform sampler2D retroCoverageMap2;uniform sampler2D retroCoverageMap3;
      uniform bool retroFilteredCoverage;
      float retroSceneryCascadeWeight(mat4 matrix,vec2 texel,float enabled){
       if(enabled<.5)return 0.0;
       vec3 p=(matrix*vec4(vRetroWorld,1.0)).xyz;
       if(p.z<=0.0||p.z>=1.0)return 0.0;
       float edge=min(min(p.x,1.0-p.x),min(p.y,1.0-p.y));
       return smoothstep(0.0,max(texel.x,texel.y)*${SCENERY_CASCADE_FEATHER_TEXELS.toFixed(1)},edge);
      }
      float retroFallbackTap(sampler2D casterMap,sampler2D receiverMap,vec2 uv,float fragmentDepth,float tolerance){
       vec4 caster=texture2D(casterMap,uv),receiver=texture2D(receiverMap,uv);
       if(caster.a<.5||receiver.a<.5)return 0.0;
       float depth=unpackRGBToDepth(receiver.rgb);
       return abs(fragmentDepth-depth)<=tolerance&&depth>unpackRGBToDepth(caster.rgb)?1.0:0.0;
      }
      float retroShadow(sampler2D coverageMap,sampler2D casterMap,sampler2D receiverMap,mat4 matrix,vec2 texel,float enabled,float receiverTolerance) {
       if (enabled < .5) return 0.0;
       vec3 p = (matrix * vec4(vRetroWorld,1.0)).xyz;
       if (p.x <= 0.0 || p.x >= 1.0 || p.y <= 0.0 || p.y >= 1.0 || p.z <= 0.0 || p.z >= 1.0) return 0.0;
       if(!retroFilteredCoverage){
        vec2 grid=p.xy/texel-.5,blend=fract(grid),base=(floor(grid)+.5)*texel;
        return mix(mix(retroFallbackTap(casterMap,receiverMap,base,p.z,receiverTolerance),retroFallbackTap(casterMap,receiverMap,base+vec2(texel.x,0.0),p.z,receiverTolerance),blend.x),mix(retroFallbackTap(casterMap,receiverMap,base+vec2(0.0,texel.y),p.z,receiverTolerance),retroFallbackTap(casterMap,receiverMap,base+texel,p.z,receiverTolerance),blend.x),blend.y);
       }
       vec4 coverage=texture2D(coverageMap,p.xy);
       float solid=coverage.r,aperture=coverage.g;
       // Divide weighted depth by coverage so the soft edge stays on its
       // receiving surface rather than leaking through an elevated deck.
       if(solid>.0001&&abs(p.z-.5-coverage.b/solid)>receiverTolerance)solid=0.0;
       if(aperture>.0001&&abs(p.z-.5-coverage.a/aperture)>receiverTolerance)aperture=0.0;
       return clamp(max(solid,aperture),0.0,1.0);
      }
      ${shader.fragmentShader}`;
     // Apply after the stipple's second colour has been selected too.
     shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 retroNormal = normalize(vRetroNormal);
      ${node.userData.originalBodyFace ? '' : 'if (retroNormal.y < -.4) retroNormal = -retroNormal;'}
      float retroLight = dot(retroNormal, retroSun);
      float retroSourceSurface = ${keepsWorldSurfaceColour?'max(vOriginalRoadSurface,vOriginalTerrainSurface)':'0.0'};
      float retroShade = retroSourceSurface > .5 ? 1.0 : (retroLight > ${BRIGHT_FACE} ? 1.1 : retroLight > ${MID_FACE} ? 1.0 : .76);
      outgoingLight *= retroShade;
      float retroShadowAmount = 0.0;
      ${receiveCarShadows ? `retroShadowAmount = max(retroShadowAmount,max(
       retroShadow(retroCoverageMap0,retroShadowMap0,retroShadowReceiverMap0,retroShadowMatrix0,retroShadowTexel0,retroShadowActive0,${CAR_RECEIVER_TOLERANCE.toFixed(12)}),
       retroShadow(retroCoverageMap1,retroShadowMap1,retroShadowReceiverMap1,retroShadowMatrix1,retroShadowTexel1,retroShadowActive1,${CAR_RECEIVER_TOLERANCE.toFixed(12)})));` : ''}
      ${receiveSceneryShadows ? `// Prefer the detailed cascade in its interior, but feather it to the
       // distant result before reaching the orthographic map edge. The map
       // boundary therefore cannot become a diagonal or rectangular slab.
       float retroDetailedSceneryShadow=retroShadow(retroCoverageMap2,retroShadowMap2,retroShadowReceiverMap2,retroShadowMatrix2,retroShadowTexel2,retroShadowActive2,${SCENERY_RECEIVER_TOLERANCE.toFixed(12)});
       float retroDistantSceneryShadow=retroShadow(retroCoverageMap3,retroShadowMap3,retroShadowReceiverMap3,retroShadowMatrix3,retroShadowTexel3,retroShadowActive3,${DISTANT_SCENERY_RECEIVER_TOLERANCE.toFixed(12)});
       float retroDetailedSceneryWeight=retroSceneryCascadeWeight(retroShadowMatrix2,retroShadowTexel2,retroShadowActive2);
       float retroSceneryReceiver=${excludesSceneryCasterFaces?'1.0-step(.5,vOriginalSceneryCaster)':'1.0'};
       retroShadowAmount=max(retroShadowAmount,mix(retroDistantSceneryShadow,retroDetailedSceneryShadow,retroDetailedSceneryWeight)*retroSceneryReceiver);` : ''}
      outgoingLight *= 1.0-retroShadowAmount*${(1-UPGRADED_SHADOW_AMBIENT).toFixed(3)};
      ${node.userData.retroDistanceColour===false?'':`float retroDistanceAmount = smoothstep(${RETRO_DISTANCE_COLOUR.start.toFixed(1)},${RETRO_DISTANCE_COLOUR.end.toFixed(1)},vRetroViewDistance)*${RETRO_DISTANCE_COLOUR.strength.toFixed(3)}*(1.0-retroSourceSurface);
      outgoingLight = mix(outgoingLight,retroDistanceTint,retroDistanceAmount);`}
      #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => key + '/retro-light-v23/' + Number(receiveCarShadows) + '/' + Number(receiveSceneryShadows) + '/' + Number(!!node.userData.originalBodyFace) + '/' + Number(node.userData.retroDistanceColour!==false) + '/' + Number(keepsWorldSurfaceColour) + '/' + Number(excludesSceneryCasterFaces);
    material.needsUpdate = true;
   }
  });
 }

 function drawReceiver(renderer:THREE.WebGLRenderer,shadow:Shadow,index:number,receiverScene:THREE.Scene,hidden:(THREE.Group|undefined)[],shown:THREE.Group[]=[]){
  const visibleGroups:THREE.Group[]=[],override=receiverScene.overrideMaterial;
  try {
   hidden.forEach(group=>{if(group?.visible){visibleGroups.push(group);group.visible=false;}});
   shown.forEach(group=>receiverScene.add(group));
   receiverScene.overrideMaterial=filteredCoverage.value?coverageReceiverMaterials[index]:receiverMaterials[index];
   renderer.setRenderTarget(filteredCoverage.value?shadow.coverageTarget:shadow.receiverTarget);
   renderer.render(receiverScene,shadow.camera);
  } finally {
   receiverScene.overrideMaterial=override;
   shown.forEach(group=>receiverScene.remove(group));
   visibleGroups.forEach(group=>{group.visible=true;});
  }
 }

 function drawShadows(renderer: THREE.WebGLRenderer, cars: (THREE.Group | undefined)[], receiverScene: THREE.Scene, sceneryCasters:RetroSceneryCaster[]=[], sceneryCenter?:THREE.Vector3, sceneryWorldCenter?:THREE.Vector3, sceneryRevision?:number) {
  // WebGL2 half-float colour attachments are optional. Retain interpolated
  // depth comparisons on devices without the required render-target support.
  filteredCoverage.value=!renderer.extensions||renderer.extensions.has('EXT_color_buffer_float');
  const oldTarget = renderer.getRenderTarget(), clearColor = renderer.getClearColor(new THREE.Color()), clearAlpha = renderer.getClearAlpha();
  const oldAutoClear = renderer.autoClear,oldMatrixWorldAutoUpdate=receiverScene.matrixWorldAutoUpdate;
  const presentationHelpers:THREE.Object3D[]=[];
  try {
   renderer.autoClear = true;
   renderer.setClearColor(0x000000,0);
   receiverScene.updateMatrixWorld(true);
   // Compatibility lines are presentation geometry, not shadow surfaces.
   // Find and hide them once for the complete shadow batch instead of walking
   // the full scene again for every receiver pass.
   receiverScene.traverseVisible(node=>{if(presentationOnlyShadowGeometry(node))presentationHelpers.push(node);});
   presentationHelpers.forEach(node=>{node.visible=false;});
   // The matrices above are current for this displayed frame. All receiver
   // passes can reuse them; WebGLRenderer would otherwise recompute the whole
   // 30x30-tile scene before every shadow camera.
   receiverScene.matrixWorldAutoUpdate=false;
   for(let i=0;i<CAR_SHADOWS;i++){
    const shadow=shadows[i];
    // The same original visibility gate controls the car and all of its
    // shadow contributions. In cockpit view only a visible opponent casts.
    const source = cars[i]?.visible ? cars[i] : undefined; shadow.active.value = source ? 1 : 0;
    if (!source) continue;
    if (shadow.source !== source) {
     shadow.scene.clear(); shadow.proxies = []; shadow.source = source;
     source.traverse(node => {
      if (!(node instanceof THREE.Mesh) || presentationOnlyShadowGeometry(node)) return;
      // The map shares the animated wheel/body geometry, but owns transforms.
      const materials=Array.isArray(node.material)?node.material:[node.material];
      const mesh = new THREE.Mesh(node.geometry,materials.some(material=>material.side===THREE.DoubleSide)?casterMaterial(node):carDepthMaterial);
      mesh.matrixAutoUpdate = false; shadow.scene.add(mesh);
      shadow.proxies.push({source: node, mesh});
     });
    }
    source.updateWorldMatrix(true,true);
    for (const proxy of shadow.proxies){
     proxy.mesh.visible=proxy.source.visible;
     for(let parent=proxy.source.parent;parent&&parent!==source;parent=parent.parent)if(!parent.visible){proxy.mesh.visible=false;break;}
     proxy.mesh.matrix.copy(proxy.source.matrixWorld);proxy.mesh.matrixWorld.copy(proxy.source.matrixWorld);
    }
    const bounds = new THREE.Box3().setFromObject(source), center = bounds.getCenter(new THREE.Vector3());
    // Showroom coordinates are 1/20 racing-world units. Scale the complete
    // light volume so texel density, contact bias and receiver tolerance keep
    // the same proportions; the geometry and soft coverage filter are shared.
    const extent = Math.max(128*worldScale, Math.ceil(bounds.getSize(new THREE.Vector3()).length()/(64*worldScale))*64*worldScale);
    shadow.matrix.value.copy(placeRetroShadowCamera(shadow.camera,center,extent,CAR_SHADOW_SIZE,16384*worldScale,sunDirection,worldScale));
    renderer.setRenderTarget(shadow.target);
    renderer.render(shadow.scene,shadow.camera);
    // A caster map alone shadows every surface farther down the same sun ray.
    // Depth-peel the first actual world surface behind the car so a bridge deck
    // receives the shadow while lower terrain beneath it remains untouched.
    drawReceiver(renderer,shadow,i,receiverScene,cars);
    filterCoverage(renderer,shadow);
   }
   const scenerySourceChanged=cachedScenerySource!==sceneryCasters;
   if(scenerySourceChanged){
    cachedScenerySource=sceneryCasters;
    cachedSceneryEntries=sceneryCasters.map(entry=>entry instanceof THREE.Group?{source:entry,caster:entry,patterned:entry.userData.retroPatternedShadow===true}:entry);
    cachedSceneryHidden=cachedSceneryEntries.map(entry=>entry.source);
    cachedSceneryRevision=undefined;
    sceneryShadows.forEach(shadow=>{shadow.renderedRevision=undefined;shadow.renderedCenter=undefined;});
   }
   const sceneryEntries=cachedSceneryEntries;
   // Static track, sign and truck transforms change only with a new captured
   // native graphics frame. Browser refreshes between those frames still move
   // the shadow cameras with the interpolated car, but can reuse caster proxy
   // matrices and composite receiver placement exactly.
   if(sceneryRevision===undefined||cachedSceneryRevision!==sceneryRevision){
    sceneryShadows.forEach(shadow=>shadow.proxies.forEach(proxy=>{proxy.mesh.visible=false;}));
    cachedSceneryVisible=0;cachedSceneryShown=[];
    // Both cascades use the same caster geometry. Traverse and copy it once,
    // updating the two proxy scenes together.
    for(const entry of sceneryEntries){
     const group=entry.caster;
     if(group!==entry.source){
      group.matrixAutoUpdate=false;group.matrix.copy(entry.source.matrixWorld);group.visible=entry.source.visible;
      group.updateMatrixWorld(true);
     }
     group.traverseVisible(node=>{
      if(!(node instanceof THREE.Mesh)||presentationOnlyShadowGeometry(node))return;
      for(const shadow of sceneryShadows){
       let mesh=shadow.proxyBySource.get(node);
       if(!mesh){mesh=new THREE.Mesh(node.geometry,casterMaterial(node,entry.patterned===true));mesh.matrixAutoUpdate=false;shadow.scene.add(mesh);shadow.proxyBySource.set(node,mesh);shadow.proxies.push({source:node,mesh});}
       mesh.visible=true;mesh.matrix.copy(node.matrixWorld);mesh.matrixWorld.copy(node.matrixWorld);
      }
      cachedSceneryVisible++;
     });
     const receiver=entry.receiver;if(!receiver)continue;
     receiver.matrixAutoUpdate=false;receiver.matrix.copy(entry.source.matrixWorld);receiver.visible=entry.source.visible;
     receiver.updateMatrixWorld(true);if(entry.source.visible)cachedSceneryShown.push(receiver);
    }
    cachedSceneryRevision=sceneryRevision;
   }
   sceneryShadows.forEach(shadow=>{shadow.active.value=sceneryCenter&&cachedSceneryVisible?1:0;});
   const hidden=cachedSceneryHidden;
   const shown=cachedSceneryShown;
   const drawScenery=(shadow:Shadow,index:number,center:THREE.Vector3,extent:number,size:number,depth=16384)=>{
    // Scenery and its sunlight are fixed in world space. A cached orthographic
    // map remains exact while the requested centre stays comfortably inside
    // it; only its coverage boundary moves. Re-centre after one eighth of the
    // map width, or immediately when visible source geometry changes. This
    // removes the largest repeated GPU workload without lowering resolution,
    // changing filtering, or dropping any shadow-casting geometry.
    const threshold=extent/8;
    if(shadow.renderedRevision===sceneryRevision&&shadow.renderedCenter&&shadow.renderedCenter.distanceToSquared(center)<=threshold*threshold)return;
    shadow.matrix.value.copy(placeRetroShadowCamera(shadow.camera,center,extent,size,depth,sunDirection));
    renderer.setRenderTarget(shadow.target);
    renderer.render(shadow.scene,shadow.camera);
    // Hiding only the registered raised/volumetric objects lets their common
    // silhouette land on roads and terrain without treating the caster's own
    // back faces as the receiving surface.
    drawReceiver(renderer,shadow,index,receiverScene,hidden,shown);
    filterCoverage(renderer,shadow);
    shadow.renderedRevision=sceneryRevision;
    (shadow.renderedCenter??=new THREE.Vector3()).copy(center);
   };
   const scenery=shadows[SCENERY_SHADOW];
   if(scenery.active.value)drawScenery(scenery,SCENERY_SHADOW,sceneryCenter!,SCENERY_SHADOW_EXTENT,SCENERY_SHADOW_SIZE);
   const distant=shadows[DISTANT_SCENERY_SHADOW];
   if(distant.active.value){
    drawScenery(distant,DISTANT_SCENERY_SHADOW,sceneryWorldCenter??sceneryCenter!,DISTANT_SCENERY_SHADOW_EXTENT,DISTANT_SCENERY_SHADOW_SIZE,DISTANT_SCENERY_SHADOW_DEPTH);
   }
  } finally {
   receiverScene.matrixWorldAutoUpdate=oldMatrixWorldAutoUpdate;
   presentationHelpers.forEach(node=>{node.visible=true;});
   renderer.setRenderTarget(oldTarget);
   renderer.setClearColor(clearColor,clearAlpha);
   renderer.autoClear = oldAutoClear;
  }
 }
 return {apply, drawShadows, dispose() {shadows.forEach(shadow => {shadow.target.dispose();shadow.receiverTarget.dispose();shadow.coverageTarget.dispose();shadow.filterTarget.dispose();});receiverMaterials.forEach(material=>material.dispose());coverageReceiverMaterials.forEach(material=>material.dispose());depthMaterial.dispose();carDepthMaterial.dispose();patternedDepthMaterial.dispose();filterMaterial.dispose();filterQuad.geometry.dispose();}};
}
