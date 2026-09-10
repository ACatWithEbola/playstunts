/** Presentation-only world selection: no source tile-distance cutoff. */
export function upgradedWorldDetail(level:number,hasReducedModel:boolean,scenery:boolean){
 if(level!==0&&scenery)return -1;
 return level>=2&&hasReducedModel?1:0;
}
/** Original cloud bearings and shapes on a distant, camera-centred sky.
 * Fixed bearings remove source screen-space repositioning; following camera
 * translation removes parallax without preventing natural angular movement.
 */
export function distantCloudPlacement(bearing:number,camera:readonly number[]){
 const heading=bearing*Math.PI/512,scale=6,radius=15000*scale;
 return {position:[camera[0]+Math.sin(heading)*radius,camera[1]+2790*scale,camera[2]+Math.cos(heading)*radius] as [number,number,number],heading,scale};
}
