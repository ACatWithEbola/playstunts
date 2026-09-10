export interface CockpitGaugeGeometry {center:[number,number];points:[number,number][];precedingPoints?:[number,number][]}
/** Original 0x15192-0x151ea line requests, in instrument-panel coordinates. */
export function cockpitGaugeLine(g:CockpitGaugeGeometry,index:number,color:number,originalData?:Uint8Array,base=0xa598){
 const point=originalData?[originalData[(base+index*2)&65535],originalData[(base+index*2+1)&65535]]:index<0?g.precedingPoints?.[g.precedingPoints.length+index]:g.points[index];
 if(!point)throw Error('Original gauge index is outside the extracted table');
 return [...g.center,...point,color];
}
export function cockpitNeedleLines(speed:CockpitGaugeGeometry,rpm:CockpitGaugeGeometry,speedIndex:number,rpmIndex:number,color:number,originalData?:Uint8Array){
 return [cockpitGaugeLine(speed,speedIndex,color,originalData,0xa598),cockpitGaugeLine(rpm,rpmIndex,color,originalData,0xa66e)];
}
