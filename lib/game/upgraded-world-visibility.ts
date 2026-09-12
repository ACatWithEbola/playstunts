/** Presentation-only world selection: no source tile-distance cutoff. */
export function upgradedWorldDetail(level:number,hasReducedModel:boolean,scenery:boolean,tile:readonly number[],carTile:readonly number[]){
 // Supplied C47E..C743 retains scenery sharing either coordinate with the car.
 if(level!==0&&scenery&&tile[0]!==carTile[0]&&tile[1]!==carTile[1])return -1;
 return level>=2&&hasReducedModel?1:0;
}
/** Original cloud bearings and shapes on a distant, camera-centred sky.
 * Fixed bearings remove source screen-space repositioning; following camera
 * horizontal translation removes parallax without preventing natural angular movement.
 */
export function distantCloudPlacement(bearing:number,camera:readonly number[]){
 const heading=bearing*Math.PI/512,scale=6,radius=15000*scale;
 // Original C315..C3EF uses 2790-cameraHeight. Scale that relative
 // elevation along with cloud geometry/distance, then restore the origin.
 return {position:[camera[0]+Math.sin(heading)*radius,camera[1]+(2790-camera[1])*scale,camera[2]+Math.cos(heading)*radius] as [number,number,number],heading,scale};
}
