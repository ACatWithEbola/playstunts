/** Signed screen-space rectangle: left, right, top, bottom. */
export type Ms91Rectangle=[number,number,number,number];
const inside=(a:Ms91Rectangle,b:Ms91Rectangle)=>a[1]<=b[1]&&a[0]>=b[0]&&a[2]>=b[2]&&a[3]<=b[3];
const overlaps=(a:Ms91Rectangle,b:Ms91Rectangle)=>a[1]>b[0]&&b[1]>a[0]&&a[2]<b[3]&&a[3]>b[2];
const adjacent=(a:Ms91Rectangle,b:Ms91Rectangle)=>((a[3]===b[2]||a[2]===b[3])&&a[0]===b[0]&&a[1]===b[1])||((a[1]===b[0]||b[1]===a[0])&&a[2]===b[2]&&a[3]===b[3]);
/** Original MS91 18a98 insertion, with horizontal display alignment. Mutates
 * only the provided working list; callers must supply an already merged list.
 * Preserve original removal/iteration order, even when removal skips a slot. */
export function addMs91Rectangle(list:Ms91Rectangle[],incoming:Ms91Rectangle,alignment=1,mask=-alignment){
 const rect:Ms91Rectangle=[...incoming];
 if(alignment!==1)rect[1]=(((rect[1]+alignment-1)&mask)<<16)>>16;
 for(let i=0;i<list.length;i++){
  const old=list[i];if(!overlaps(rect,old))continue;
  if(inside(rect,old))return;
  if(inside(old,rect)){list.splice(i,1);continue;}
  const merged:Ms91Rectangle=[...old];let upper:Ms91Rectangle|undefined,lower:Ms91Rectangle|undefined;
  if(old[2]>=rect[2]){if(rect[2]<old[2])upper=[rect[0],rect[1],rect[2],old[2]];}
  else{upper=[old[0],old[1],old[2],rect[2]];merged[2]=rect[2];}
  if(old[3]<=rect[3]){if(rect[3]>old[3])lower=[rect[0],rect[1],old[3],rect[3]];}
  else{lower=[old[0],old[1],rect[3],old[3]];merged[3]=rect[3];}
  merged[0]=Math.min(rect[0],old[0]);merged[1]=Math.max(rect[1],old[1]);list.splice(i,1);
  if(upper)addMs91Rectangle(list,upper,alignment,mask);addMs91Rectangle(list,merged,alignment,mask);if(lower)addMs91Rectangle(list,lower,alignment,mask);return;
 }
 for(let i=0;i<list.length;i++)if(adjacent(list[i],rect)){
  const old=list[i],merged:Ms91Rectangle=[Math.min(old[0],rect[0]),Math.max(old[1],rect[1]),Math.min(old[2],rect[2]),Math.max(old[3],rect[3])];
  list.splice(i,1);addMs91Rectangle(list,merged,alignment,mask);return;
 }
 list.push(rect);
}
/** Original indexed gap-sort, not JavaScript's stable sort. Negation wraps to
 * signed16 bits, including the -32768 corner case. Empty input still writes0. */
export function orderMs91Rectangles(list:readonly Ms91Rectangle[]):number[]{
 if(list.length<=1)return [0];
 const keys=list.map(rect=>(-rect[2]<<16)>>16),order=list.map((_,i)=>i);
 for(let gap=list.length>>1;gap>0;gap>>=1)for(let counter=gap;counter<list.length;counter++){
  for(let i=counter-gap;i>=0&&keys[i+gap]>keys[i];i-=gap){
   [keys[i],keys[i+gap]]=[keys[i+gap],keys[i]];[order[i],order[i+gap]]=[order[i+gap],order[i]];
  }
 }
 return order;
}
