export interface OriginalEvaluationAnimation {phase:number;index:number;drawnIndex:number}
/** Supplied6505..6555 and6970..69bd. One advancement at most per poll,
 * even after a long delay; phase uses a signed16-bit comparison. Sequence
 * indexing is a signed byte, so retained context is supplied by the caller. */
export function advanceOriginalEvaluationAnimation(before:OriginalEvaluationAnimation,delta:number,readSequence:(index:number)=>number){
 let phase=(before.phase+delta)&65535,index=before.index&255,drawnIndex=before.drawnIndex&255;
 if((phase<<16>>16)>=30){phase=(phase-30)&65535;index=(index+1)&255;if((readSequence(index<<24>>24)&255)===0)index=0;}
 const changed=index!==drawnIndex;
 let resourceSuffix:number|undefined;
 if(changed){drawnIndex=index;resourceSuffix=(readSequence(index<<24>>24)+48)&255;}
 return {state:{phase,index,drawnIndex},changed,resourceSuffix};
}
