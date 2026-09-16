import type {Vector} from '../physics/math.ts';

/** The enhanced panorama is cylindrical artwork: project its horizon with the
 * source pitch and heading, then apply the source roll to the completed image.
 * This keeps the upgraded sky present on banked roads without clamping pitch,
 * holding camera height, or adding any independent background motion. */
export function upgradedBackgroundView([roll,pitch,heading]:Vector){return {angles:[0,pitch,heading] as Vector,rotation:roll===0?0:-roll*Math.PI/512};}
export function upgradedBackgroundHeight(_chase:boolean,_cameraMode:number,liveHeight:number){return liveHeight;}
