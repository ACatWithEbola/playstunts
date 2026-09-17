import type {Vector} from '../physics/math.ts';

/** The enhanced panorama is cylindrical artwork: project its horizon with the
 * source pitch and heading, then apply the source roll to the completed image.
 * Original cameras retain their source eye height. The optional chase camera
 * treats the panorama as infinitely distant, so climbing cannot translate it. */
export function upgradedBackgroundView([roll,pitch,heading]:Vector){return {angles:[0,pitch,heading] as Vector,rotation:roll===0?0:-roll*Math.PI/512};}
export function upgradedBackgroundHeight(chase:boolean,_cameraMode:number,liveHeight:number){return chase?0:liveHeight;}
