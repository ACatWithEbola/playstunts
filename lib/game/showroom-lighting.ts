import {MathUtils,Vector3} from 'three';

/** Keep the racing shadow design, but illuminate the static showroom from a
 * lower elevation so the silhouette extends visibly beyond the parked car. */
const elevation=MathUtils.degToRad(35),azimuth=MathUtils.degToRad(-45);
export const SHOWROOM_SUN=new Vector3(Math.cos(elevation)*Math.cos(azimuth),Math.sin(elevation),Math.cos(elevation)*Math.sin(azimuth)).normalize();
export const SHOWROOM_SHADOW_WORLD_SCALE=1/20;
