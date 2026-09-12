import * as THREE from 'three';

/** Display-world direction (the race scene mirrors source Z), independent of
 * the car heading and camera. The 55-degree elevation keeps the projection
 * readable without producing the very long shadows of a low Sun. */
// Parallel sunlight from the forward/right side of the initial road heading.
// The Sun's ~149.6 million km distance is represented by this world-fixed
// direction, not by a nearby point light or an enormous scene object.
// Its ~0.53-degree angular diameter would give <0.25 world units of penumbra
// at 25 units of car/road separation; this retro pass retains a hard edge.
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
// One continuous world-space value-noise field avoids tile seams and remains
// fixed while the camera moves. The narrow brightness range echoes adjacent
// greens in the original palette without turning the surface into modern
// high-frequency photographic grass.
export const RETRO_GRASS_VARIATION = {scale:768,min:.94,max:1.05} as const;
const CAR_SHADOW_SIZE = 512;
const SCENERY_SHADOW_SIZE = 1024;
const DISTANT_SCENERY_SHADOW_SIZE = 768;
// Two world units per texel keeps nearby wheels, posts and roof lines intact.
// Distant scenery still receives face shading; its ground shadow is too small
// to read reliably at the game's output resolution.
const SCENERY_SHADOW_EXTENT = 2048;
// A second, lower-resolution range follows the camera view. At the native
// output resolution, distant silhouettes need much less map detail than nearby
// posts and wheels, so this extends visibility without sacrificing the close
// 2-world-unit texel scale or allocating another full-size map.
const DISTANT_SCENERY_SHADOW_EXTENT = 45056;
const DISTANT_SCENERY_SHADOW_DEPTH = 32768;
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

export function retroFaceShade(normal: THREE.Vector3) {
 const light = normal.clone().normalize().dot(RETRO_FACE_LIGHT);
 return light > BRIGHT_FACE ? 1.1 : light > MID_FACE ? 1 : .76;
}

export function retroDistanceStrength(distance:number){
 const normalized=THREE.MathUtils.clamp((distance-RETRO_DISTANCE_COLOUR.start)/(RETRO_DISTANCE_COLOUR.end-RETRO_DISTANCE_COLOUR.start),0,1);
 return normalized*normalized*(3-2*normalized)*RETRO_DISTANCE_COLOUR.strength;
}

function retroGrassHash(x:number,z:number){
 const fract=(value:number)=>value-Math.floor(value);
 let px=fract(x*.1031),py=fract(z*.1031),pz=fract(x*.1031);
 const dot=px*(py+33.33)+py*(pz+33.33)+pz*(px+33.33);
 px+=dot;py+=dot;pz+=dot;
 return fract((px+py)*pz);
}

export function retroGrassVariationAt(x:number,z:number){
 const px=x/RETRO_GRASS_VARIATION.scale,pz=z/RETRO_GRASS_VARIATION.scale;
 const ix=Math.floor(px),iz=Math.floor(pz),fx=px-ix,fz=pz-iz;
 const ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
 const a=retroGrassHash(ix,iz),b=retroGrassHash(ix+1,iz),c=retroGrassHash(ix,iz+1),d=retroGrassHash(ix+1,iz+1);
 const noise=(a+(b-a)*ux)*(1-uz)+(c+(d-c)*ux)*uz;
 return RETRO_GRASS_VARIATION.min+(RETRO_GRASS_VARIATION.max-RETRO_GRASS_VARIATION.min)*noise;
}

/** A tight, fixed-scale light view follows each car. Shadow pixels stay small
 * during high jumps; the receiving mesh determines the height and slope. */
export function placeRetroShadowCamera(camera: THREE.OrthographicCamera, center: THREE.Vector3, extent: number, mapSize=CAR_SHADOW_SIZE, depth=16384) {
 camera.left = camera.bottom = -extent / 2;
 camera.right = camera.top = extent / 2;
 camera.near = 1;
 camera.far = depth;
 camera.position.copy(center).addScaledVector(RETRO_SUN, depth/2);
 camera.up.set(0,1,0);
 camera.lookAt(center);
 camera.updateMatrixWorld(true);
 // Stabilize the projection in light-space texels as the car moves.
 const lightCenter = center.clone().applyMatrix4(camera.matrixWorldInverse);
 const worldOrigin = new THREE.Vector3().applyMatrix4(camera.matrixWorldInverse);
 const texel = extent / mapSize;
 const dx = Math.round(worldOrigin.x / texel) * texel - worldOrigin.x;
 const dy = Math.round(worldOrigin.y / texel) * texel - worldOrigin.y;
 camera.left += dx + lightCenter.x; camera.right += dx + lightCenter.x;
 camera.bottom += dy + lightCenter.y; camera.top += dy + lightCenter.y;
 camera.updateProjectionMatrix();
 return shadowBiasMatrix.clone().multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
}

type Shadow = {
 target: THREE.WebGLRenderTarget;
 receiverTarget: THREE.WebGLRenderTarget;
 scene: THREE.Scene;
 camera: THREE.OrthographicCamera;
 matrix: {value: THREE.Matrix4};
 texel: {value: THREE.Vector2};
 active: {value: number};
 proxies: {source: THREE.Mesh; mesh: THREE.Mesh}[];
 proxyBySource: WeakMap<THREE.Mesh,THREE.Mesh>;
 source?: THREE.Group;
};

/** This layer is installed only by the upgraded race renderer. It composes
 * with original palette/stipple/depth shaders; it never changes game memory. */
export function createUpgradedRetroLighting() {
 // RGB stores depth and alpha explicitly identifies a rasterized caster.
 // Uncovered pixels must never be treated as the shadow-camera footprint.
 const depthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBDepthPacking, side: THREE.DoubleSide, blending: THREE.NoBlending, toneMapped: false});
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
   }`);
 };
 patternedDepthMaterial.customProgramCacheKey=()=>depthMaterial.customProgramCacheKey()+'/original-caster-pattern-v1';
 const casterMaterial=(mesh:THREE.Mesh)=>mesh.geometry.hasAttribute('originalPattern')?patternedDepthMaterial:depthMaterial;
 const makeShadow=(size:number):Shadow=>({
  target: new THREE.WebGLRenderTarget(size, size, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false}),
  receiverTarget: new THREE.WebGLRenderTarget(size, size, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false}),
 scene: new THREE.Scene(), camera: new THREE.OrthographicCamera(),
  matrix: {value: new THREE.Matrix4()}, texel:{value:new THREE.Vector2(1/size,1/size)}, active: {value: 0}, proxies: [], proxyBySource:new WeakMap(),
 });
 const shadows: Shadow[] = [makeShadow(CAR_SHADOW_SIZE),makeShadow(CAR_SHADOW_SIZE),makeShadow(SCENERY_SHADOW_SIZE),makeShadow(DISTANT_SCENERY_SHADOW_SIZE)];
 const receiverMaterials=shadows.map((shadow,index)=>new THREE.ShaderMaterial({
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
    gl_FragColor = vec4(packDepthToRGB(p.z), 1.0);
   }`,
  side:THREE.DoubleSide,blending:THREE.NoBlending,depthTest:true,depthWrite:true,toneMapped:false,
 }));
 const installed = new WeakSet<THREE.Material>();
 const normalizedFaces = new WeakSet<THREE.BufferGeometry>();

 function apply(group: THREE.Object3D, receiveCarShadows = true, receiveSceneryShadows = receiveCarShadows) {
  group.traverse(node => {
   if (!(node instanceof THREE.Mesh)) return;
   const geometry = node.geometry;
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
     shader.uniforms.retroSun = {value: RETRO_FACE_LIGHT};
     shader.uniforms.retroDistanceTint = {value: retroDistanceTint};
     shadows.forEach((shadow,i) => {
      shader.uniforms['retroShadowMatrix'+i] = shadow.matrix;
      shader.uniforms['retroShadowMap'+i] = {value: shadow.target.texture};
      shader.uniforms['retroShadowReceiverMap'+i] = {value: shadow.receiverTarget.texture};
      shader.uniforms['retroShadowActive'+i] = shadow.active;
      shader.uniforms['retroShadowTexel'+i] = shadow.texel;
     });
     shader.vertexShader = `varying vec3 vRetroNormal; varying vec3 vRetroWorld; varying float vRetroViewDistance;
      ${shader.vertexShader}`;
     shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vRetroNormal = normalize(mat3(modelMatrix) * normal);
      vRetroWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vRetroViewDistance = length((modelViewMatrix * vec4(transformed, 1.0)).xyz);`);
     shader.fragmentShader = `uniform vec3 retroSun; uniform vec3 retroDistanceTint; varying vec3 vRetroNormal; varying vec3 vRetroWorld; varying float vRetroViewDistance;
      uniform mat4 retroShadowMatrix0; uniform sampler2D retroShadowMap0; uniform sampler2D retroShadowReceiverMap0; uniform float retroShadowActive0; uniform vec2 retroShadowTexel0;
      uniform mat4 retroShadowMatrix1; uniform sampler2D retroShadowMap1; uniform sampler2D retroShadowReceiverMap1; uniform float retroShadowActive1; uniform vec2 retroShadowTexel1;
      uniform mat4 retroShadowMatrix2; uniform sampler2D retroShadowMap2; uniform sampler2D retroShadowReceiverMap2; uniform float retroShadowActive2; uniform vec2 retroShadowTexel2;
      uniform mat4 retroShadowMatrix3; uniform sampler2D retroShadowMap3; uniform sampler2D retroShadowReceiverMap3; uniform float retroShadowActive3; uniform vec2 retroShadowTexel3;
      #include <packing>
      bool retroShadowInside(mat4 matrix, float enabled) {
       if (enabled < .5) return false;
       vec3 p = (matrix * vec4(vRetroWorld,1.0)).xyz;
       return p.x > 0.0 && p.x < 1.0 && p.y > 0.0 && p.y < 1.0 && p.z > 0.0 && p.z < 1.0;
      }
      float retroCasterHit(sampler2D map, vec2 uv, float receiverDepth, float depthBias) {
       vec4 caster = texture2D(map,uv);
       if (caster.a < .5) return 0.0;
       float depth = unpackRGBToDepth(caster.rgb);
       return receiverDepth > depth + depthBias ? 1.0 : 0.0;
      }
      float retroShadow(sampler2D map, sampler2D receiverMap, mat4 matrix, vec2 texel, float enabled, float depthBias, float receiverTolerance) {
       if (enabled < .5) return 0.0;
       vec3 p = (matrix * vec4(vRetroWorld,1.0)).xyz;
       if (p.x <= 0.0 || p.x >= 1.0 || p.y <= 0.0 || p.y >= 1.0 || p.z <= 0.0 || p.z >= 1.0) return 0.0;
       vec4 receiver = texture2D(receiverMap,p.xy);
       if (receiver.a < .5) return 0.0;
       float receiverDepth = unpackRGBToDepth(receiver.rgb);
       if (abs(p.z - receiverDepth) > receiverTolerance) return 0.0;
       // Four nearest-filtered taps make a single map-texel transition. The
       // interior remains solid and the edge stays crisp at native resolution.
       return .25 * (
        retroCasterHit(map,p.xy+texel*vec2(-.5,-.5),p.z,depthBias) +
        retroCasterHit(map,p.xy+texel*vec2( .5,-.5),p.z,depthBias) +
        retroCasterHit(map,p.xy+texel*vec2(-.5, .5),p.z,depthBias) +
       retroCasterHit(map,p.xy+texel*vec2( .5, .5),p.z,depthBias));
      }
      ${node.userData.retroGrassVariation===true?`float retroGrassHash(vec2 p) {
       vec3 q=fract(vec3(p.xyx)*0.1031);
       q+=dot(q,q.yzx+33.33);
       return fract((q.x+q.y)*q.z);
      }
      float retroGrassNoise(vec2 p) {
       vec2 cell=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
       return mix(mix(retroGrassHash(cell),retroGrassHash(cell+vec2(1.0,0.0)),f.x),mix(retroGrassHash(cell+vec2(0.0,1.0)),retroGrassHash(cell+vec2(1.0,1.0)),f.x),f.y);
      }`:''}
      ${shader.fragmentShader}`;
     // Apply after the stipple's second colour has been selected too.
     shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 retroNormal = normalize(vRetroNormal);
      ${node.userData.originalBodyFace ? '' : 'if (retroNormal.y < -.4) retroNormal = -retroNormal;'}
      float retroLight = dot(retroNormal, retroSun);
      float retroShade = retroLight > ${BRIGHT_FACE} ? 1.1 : retroLight > ${MID_FACE} ? 1.0 : .76;
      ${node.userData.retroGrassVariation===true?`float retroGrassShade = mix(${RETRO_GRASS_VARIATION.min.toFixed(3)},${RETRO_GRASS_VARIATION.max.toFixed(3)},retroGrassNoise(vRetroWorld.xz/${RETRO_GRASS_VARIATION.scale.toFixed(1)}));
      outgoingLight *= retroGrassShade;`:''}
      outgoingLight *= retroShade;
      float retroShadowAmount = 0.0;
      ${receiveCarShadows ? `retroShadowAmount = max(retroShadowAmount,max(
       retroShadow(retroShadowMap0,retroShadowReceiverMap0,retroShadowMatrix0,retroShadowTexel0,retroShadowActive0,${SHADOW_DEPTH_BIAS.toFixed(12)},${CAR_RECEIVER_TOLERANCE.toFixed(12)}),
       retroShadow(retroShadowMap1,retroShadowReceiverMap1,retroShadowMatrix1,retroShadowTexel1,retroShadowActive1,${SHADOW_DEPTH_BIAS.toFixed(12)},${CAR_RECEIVER_TOLERANCE.toFixed(12)})));` : ''}
      ${receiveSceneryShadows ? `retroShadowAmount = max(retroShadowAmount,retroShadowInside(retroShadowMatrix2,retroShadowActive2)
       ? retroShadow(retroShadowMap2,retroShadowReceiverMap2,retroShadowMatrix2,retroShadowTexel2,retroShadowActive2,${SHADOW_DEPTH_BIAS.toFixed(12)},${SCENERY_RECEIVER_TOLERANCE.toFixed(12)})
       : retroShadow(retroShadowMap3,retroShadowReceiverMap3,retroShadowMatrix3,retroShadowTexel3,retroShadowActive3,${DISTANT_SHADOW_DEPTH_BIAS.toFixed(12)},${DISTANT_SCENERY_RECEIVER_TOLERANCE.toFixed(12)}));` : ''}
      outgoingLight = mix(outgoingLight,vec3(.02),retroShadowAmount);
      ${node.userData.retroDistanceColour===false?'':`float retroDistanceAmount = smoothstep(${RETRO_DISTANCE_COLOUR.start.toFixed(1)},${RETRO_DISTANCE_COLOUR.end.toFixed(1)},vRetroViewDistance)*${RETRO_DISTANCE_COLOUR.strength.toFixed(3)};
      outgoingLight = mix(outgoingLight,retroDistanceTint,retroDistanceAmount);`}
      #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => key + '/retro-light-v14/' + Number(receiveCarShadows) + '/' + Number(receiveSceneryShadows) + '/' + Number(!!node.userData.originalBodyFace) + '/' + Number(node.userData.retroDistanceColour!==false) + '/' + Number(node.userData.retroGrassVariation===true);
    material.needsUpdate = true;
   }
  });
 }

 function drawReceiver(renderer:THREE.WebGLRenderer,shadow:Shadow,index:number,receiverScene:THREE.Scene,hidden:(THREE.Group|undefined)[]){
  const visibility=hidden.map(group=>group?.visible),override=receiverScene.overrideMaterial;
  try {
   hidden.forEach(group=>{if(group)group.visible=false;});
   receiverScene.overrideMaterial=receiverMaterials[index];
   renderer.setRenderTarget(shadow.receiverTarget);
   renderer.render(receiverScene,shadow.camera);
  } finally {
   receiverScene.overrideMaterial=override;
   hidden.forEach((group,i)=>{if(group)group.visible=visibility[i]!;});
  }
 }

 function drawShadows(renderer: THREE.WebGLRenderer, cars: (THREE.Group | undefined)[], receiverScene: THREE.Scene, sceneryCasters:THREE.Group[]=[], sceneryCenter?:THREE.Vector3, sceneryWorldCenter?:THREE.Vector3) {
  const oldTarget = renderer.getRenderTarget(), clearColor = renderer.getClearColor(new THREE.Color()), clearAlpha = renderer.getClearAlpha();
  const oldAutoClear = renderer.autoClear;
  try {
   renderer.autoClear = true;
   renderer.setClearColor(0x000000,0);
   receiverScene.updateMatrixWorld(true);
   shadows.slice(0,CAR_SHADOWS).forEach((shadow,i) => {
    // The same original visibility gate controls the car and all of its
    // shadow contributions. In cockpit view only a visible opponent casts.
    const source = cars[i]?.visible ? cars[i] : undefined; shadow.active.value = source ? 1 : 0;
    if (!source) return;
    if (shadow.source !== source) {
     shadow.scene.clear(); shadow.proxies = []; shadow.source = source;
     source.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      // The map shares the animated wheel/body geometry, but owns transforms.
      const mesh = new THREE.Mesh(node.geometry, casterMaterial(node));
      mesh.matrixAutoUpdate = false; shadow.scene.add(mesh);
      shadow.proxies.push({source: node, mesh});
     });
    }
    source.updateWorldMatrix(true,true);
    for (const proxy of shadow.proxies) proxy.mesh.matrix.copy(proxy.source.matrixWorld);
    const bounds = new THREE.Box3().setFromObject(source), center = bounds.getCenter(new THREE.Vector3());
    const extent = Math.max(128, Math.ceil(bounds.getSize(new THREE.Vector3()).length()/64)*64);
    shadow.matrix.value.copy(placeRetroShadowCamera(shadow.camera,center,extent));
    renderer.setRenderTarget(shadow.target);
    renderer.render(shadow.scene,shadow.camera);
    // A caster map alone shadows every surface farther down the same sun ray.
    // Depth-peel the first actual world surface behind the car so a bridge deck
    // receives the shadow while lower terrain beneath it remains untouched.
    drawReceiver(renderer,shadow,i,receiverScene,cars);
   });
   const syncScenery=(shadow:Shadow)=>{
    shadow.proxies.forEach(proxy=>{proxy.mesh.visible=false;});
    let visible=0;
    for(const group of sceneryCasters)group.traverseVisible(node=>{
     if(!(node instanceof THREE.Mesh))return;
     let mesh=shadow.proxyBySource.get(node);
     if(!mesh){mesh=new THREE.Mesh(node.geometry,casterMaterial(node));mesh.matrixAutoUpdate=false;shadow.scene.add(mesh);shadow.proxyBySource.set(node,mesh);shadow.proxies.push({source:node,mesh});}
     mesh.visible=true;mesh.matrix.copy(node.matrixWorld);visible++;
    });
    shadow.active.value=sceneryCenter&&visible?1:0;
    return visible;
   };
   const drawScenery=(shadow:Shadow,index:number,center:THREE.Vector3,extent:number,size:number,depth=16384)=>{
    shadow.matrix.value.copy(placeRetroShadowCamera(shadow.camera,center,extent,size,depth));
    renderer.setRenderTarget(shadow.target);
    renderer.render(shadow.scene,shadow.camera);
    // Hiding only the registered raised/volumetric objects lets their common
    // silhouette land on roads and terrain without treating the caster's own
    // back faces as the receiving surface.
    drawReceiver(renderer,shadow,index,receiverScene,sceneryCasters);
   };
   const scenery=shadows[SCENERY_SHADOW];
   syncScenery(scenery);
   if(scenery.active.value)drawScenery(scenery,SCENERY_SHADOW,sceneryCenter!,SCENERY_SHADOW_EXTENT,SCENERY_SHADOW_SIZE);
   const distant=shadows[DISTANT_SCENERY_SHADOW];
   syncScenery(distant);
   if(distant.active.value){
    drawScenery(distant,DISTANT_SCENERY_SHADOW,sceneryWorldCenter??sceneryCenter!,DISTANT_SCENERY_SHADOW_EXTENT,DISTANT_SCENERY_SHADOW_SIZE,DISTANT_SCENERY_SHADOW_DEPTH);
   }
  } finally {
   renderer.setRenderTarget(oldTarget);
   renderer.setClearColor(clearColor,clearAlpha);
   renderer.autoClear = oldAutoClear;
  }
 }
 return {apply, drawShadows, dispose() {shadows.forEach(shadow => {shadow.target.dispose();shadow.receiverTarget.dispose();});receiverMaterials.forEach(material=>material.dispose());depthMaterial.dispose();patternedDepthMaterial.dispose();}};
}
