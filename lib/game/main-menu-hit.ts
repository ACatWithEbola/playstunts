/** SDMSEL rectangles verified in supplied executable snapshot at 0x2d3d6.
 * Boundaries are inclusive, as in mouse_multi_hittest. First matching item wins.
 * Order: drive, car, opponent, track, options.
 */
export const originalMainMenuBounds = [
 [105,119,208,197], [66,77,107,120], [5,114,67,170],
 [190,76,253,122], [255,116,312,166],
] as const;
export function originalMainMenuHit(x:number,y:number,mouseEnabled=true):number {
 if(!mouseEnabled)return -1;
 return originalMainMenuBounds.findIndex(([left,top,right,bottom])=>x>=left&&x<=right&&y>=top&&y<=bottom);
}
