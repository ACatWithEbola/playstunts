/** Schedule against one clock sample. Re-reading wall time inside the loop can
 * make an expensive audio renderer chase a moving deadline indefinitely.
 */
export function audioBufferBatch(next:number,now:number,duration:number,submit:(start:number)=>void){
 if(!Number.isFinite(duration)||duration<=0)throw Error('Invalid audio buffer duration');
 const deadline=now+0.09;
 next=Math.max(next,now+0.015);
 while(next<deadline){submit(next);next+=duration;}
 return next;
}
