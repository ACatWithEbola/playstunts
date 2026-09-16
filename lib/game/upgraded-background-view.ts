import type {Vector} from '../physics/math.ts';

/** Background and world use one camera. Do not clamp pitch, hold a previous
 * height, or rotate a separately levelled panorama: those reinterpret source
 * framing. Native banked/vertical views retain their original raster branch. */
export function upgradedBackgroundView(angles:Vector){return {angles:[...angles] as Vector,rotation:0};}
export function upgradedBackgroundHeight(_chase:boolean,_cameraMode:number,liveHeight:number){return liveHeight;}
