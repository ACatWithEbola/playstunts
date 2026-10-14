import {addMs91Rectangle,orderMs91Rectangles,type Ms91Rectangle} from './ms91-rectangle-list.ts';
/** Compose original MS91 18e7a selection/union/clipping and indexed ordering.
 * Screen-space input is detached from the emulated memory layout. The display
 * adapter supplies the original horizontal alignment and bit mask. */
export function buildMs91RepaintPlan(flags:readonly number[],current:readonly Ms91Rectangle[],retained:readonly Ms91Rectangle[],clip:Ms91Rectangle,alignment=1,mask=-alignment){
 if(flags.length!==current.length||flags.length!==retained.length)throw Error('Repaint rectangle banks must have equal lengths');
 const rectangles:Ms91Rectangle[]=[];
 for(let i=0;i<flags.length;i++){
  const first=(flags[i]&1)&&current[i][1]>current[i][0]?current[i]:undefined;
  const second=(flags[i]&2)&&retained[i][1]>retained[i][0]?retained[i]:undefined;
  if(!first&&!second)continue;
  const selected=first&&second?[Math.min(first[0],second[0]),Math.max(first[1],second[1]),Math.min(first[2],second[2]),Math.max(first[3],second[3])] as Ms91Rectangle:[...(first||second)!] as Ms91Rectangle;
  // Original union aligns before clipping; list insertion aligns again after
  // clipping. These are distinct when a clip edge is not display-aligned.
  if(first&&second&&alignment!==1)selected[1]=(((selected[1]+alignment-1)&mask)<<16)>>16;
  if(selected[1]<selected[0]||clip[1]<=selected[0]||selected[1]<=clip[0]||selected[2]>=clip[3]||selected[3]<=clip[2])continue;
  selected[0]=Math.max(selected[0],clip[0]);selected[1]=Math.min(selected[1],clip[1]);selected[2]=Math.max(selected[2],clip[2]);selected[3]=Math.min(selected[3],clip[3]);
  addMs91Rectangle(rectangles,selected,alignment,mask);
 }
 const order=orderMs91Rectangles(rectangles);
 return {rectangles,order,presentation:rectangles.length?order.map(i=>rectangles[i]):[[0,320,clip[2],clip[3]] as Ms91Rectangle]};
}
