export type OriginalPolygonPlanEvent={type:'line';coordinates:number[];color:number}|{type:'edge';coordinates:number[];clipped:boolean;side:'forward'|'backward'}|{type:'fill';start:number;count:number;color:number};
/** Original polygon bounds and edge traversal, 23782..23944. Edge generation
 * and pixel spans are separate stages; last top tie and first bottom tie matter.
 */
export function originalPolygonEdgePlan(points:readonly (readonly number[])[],rectangle:readonly number[],color:number):OriginalPolygonPlanEvent[]{
 if(!points.length)throw Error('Original polygon requires at least one point');
 const events:OriginalPolygonPlanEvent[]=[],signed=(n:number)=>(n<<16)>>16,p=points.map(v=>v.map(signed));
 if(p.length===1)return [{type:'line',coordinates:[...p[0],...p[0]],color}];
 let first=0,last=0,minX=p[0][0],maxX=minX,minY=p[0][1],maxY=minY;
 for(let i=1;i<p.length;i++){const [x,y]=p[i];if(y<=minY){minY=y;first=i;}if(y>maxY){maxY=y;last=i;}minX=Math.min(minX,x);maxX=Math.max(maxX,x);}
 const [left,right,top,bottom]=rectangle.map(signed),rightEdge=signed(right-1);
 if(maxX<left||minX>=rightEdge||maxY<top||minY>=bottom)return events;
 const clipped=maxX>rightEdge||minX<left||maxY>=bottom||minY<top;
 if(maxY===minY||maxX===minX)return [{type:'line',coordinates:[minX,minY,maxX,maxY],color}];
 for(const [direction,side] of [[1,'forward'],[-1,'backward']] as const){let current=first;do{const next=(current+direction+p.length)%p.length;if(p[next][1]>p[current][1])events.push({type:'edge',coordinates:[...p[current],...p[next]],clipped,side});current=next;}while(current!==last);}
 const start=Math.max(minY,top),end=Math.min(maxY,signed(bottom-1)),difference=signed(end-start);
 if(difference>0)events.push({type:'fill',start,count:(difference+1)&65535,color});
 return events;
}
