import {originalCirclePlan} from './original-circle-plan.ts';
import {originalLargeEllipseContour} from './original-large-ellipse-contour.ts';
import {originalPolygonEdgePlan} from './original-polygon-edge-plan.ts';
import {prepareOriginalLine} from './prepare-original-line.ts';
import {originalForwardPolygonEdge} from './original-forward-polygon-edge.ts';
import {originalBackwardPolygonEdge} from './original-backward-polygon-edge.ts';
/** The original large-circle path temporarily releases780h stack bytes.
 * Its nested polygon's left edges87/88 overlap the saved DI/SI words.
 * Preserve their source-visible effect rather than assuming callee preservation. */
export function originalCircleRegisterEffect(memory:Uint8Array,d:number,x:number,y:number,diameter:number,colour:number,rectangle:readonly number[],si:number,di:number){
 const plan=originalCirclePlan(memory,d,x,y,diameter,colour,rectangle);if(plan.type!=='ellipse')return {si:si&65535,di:di&65535};
 let rows={left:Array(480).fill(0) as number[],right:Array(480).fill(0) as number[]},record=new Uint8Array(28);rows.left[87]=di<<16>>16;rows.left[88]=si<<16>>16;
 for(const event of originalPolygonEdgePlan(originalLargeEllipseContour(plan.points),rectangle,colour))if(event.type==='edge'){
  const [x0,y0,x1,y1]=event.coordinates;record=prepareOriginalLine(x0,y0,x1,y1,rectangle,record).record;
  rows=event.side==='forward'?originalForwardPolygonEdge(record,rectangle,rows,event.clipped):originalBackwardPolygonEdge(record,rectangle,rows,event.clipped,false);
 }
 return {si:rows.left[88]&65535,di:rows.left[87]&65535};
}
