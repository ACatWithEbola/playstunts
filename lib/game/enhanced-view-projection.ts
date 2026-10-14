/** Chase renders the whole320x200 view with a centered optical axis. Native
 * cockpit projection changes with dashboard visibility and must not leak into
 * the independently positioned enhanced chase camera. */
export function enhancedViewProjection(source:ReadonlyArray<number>,chaseFov?:number):[number,number,number,number]{
 if(chaseFov===undefined)return [source[0],source[1],source[2],source[3]];
 const fy=100/Math.tan(chaseFov*Math.PI/360);
 return [160,100,fy*1.2,fy];
}
