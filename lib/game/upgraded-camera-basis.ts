import type {Vector} from '../physics/math.ts';
/** Continuous presentation rotation in the original Z/X/Y convention.
 * Keep fractional interpolated angles out of the integer simulation math. */
export function upgradedCameraBasis([z,x,y]:Vector){
 const angle=Math.PI/512,cz=Math.cos(z*angle),sz=Math.sin(z*angle),cx=Math.cos(x*angle),sx=Math.sin(x*angle),cy=Math.cos(y*angle),sy=Math.sin(y*angle);
 // Rows of Rz * Rx * Ry are columns of its inverse, matching the native camera.
 return {
  forward:[-cx*sy,sx,cx*cy] as Vector,
  up:[sz*cy+cz*sx*sy,cz*cx,sz*sy-cz*sx*cy] as Vector,
 };
}
