import * as THREE from 'three';

const TILE_SIZE=1024,TRACK_CENTER=30*TILE_SIZE/2;
// Native camera/track coordinates are signed words, including the grass
// outside the authored 30x30 tiles. Keep the track's existing centre and add
// one tile beyond that domain for silhouettes crossing its outermost edge.
const HALF_EXTENT=TRACK_CENTER+0x8000+TILE_SIZE;

/** The sky's green fill is not a world-space shadow receiver. Continue the
 * same flat grass across the native off-track driving domain as well. */
export function createUpgradedRaceGround(){
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(HALF_EXTENT*2,HALF_EXTENT*2),new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false,depthWrite:false}));
 // Base grass must not occlude terrain whose depth is biased behind roads.
 // Its live palette colour stays free of distance tint or procedural changes.
 ground.renderOrder=-1;ground.userData.retroDistanceColour=false;
 ground.rotation.x=-Math.PI/2;ground.position.set(TRACK_CENTER,-1,TRACK_CENTER);
 return ground;
}
