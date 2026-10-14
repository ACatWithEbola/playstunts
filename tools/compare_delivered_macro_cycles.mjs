/** Complete channel-message identity/timing, not synth voice-state approval. */
import assert from 'node:assert/strict';
export function compareMacroCycles(messages,anchors,lag){
 assert.ok(Number.isSafeInteger(lag)&&lag>=1);
 assert.ok(anchors.length>=2*lag+1,'Need every phase compared at least once');
 assert.ok(anchors.every((v,i)=>Number.isSafeInteger(v)&&v>=0&&(!i||v>anchors[i-1])));
 const cycles=anchors.slice(0,-1).map((start,i)=>messages.filter(e=>e.frame>=start&&e.frame<anchors[i+1]&&e.status>=0x80&&e.status<0xf0));
 const comparisons=[];
 for(let i=lag;i<cycles.length;i++){
  const prior=cycles[i-lag],current=cycles[i];
  const same=prior.length===current.length&&prior.every((e,j)=>e.status===current[j].status&&JSON.stringify(e.data)===JSON.stringify(current[j].data));
  const differences=same?prior.map((e,j)=>(current[j].frame-anchors[i])-(e.frame-anchors[i-lag])):[];
  comparisons.push({fromCycle:i-lag,toCycle:i,messages:current.length,identitiesMatch:same,maxRelativeFrameDifference:same?Math.max(0,...differences.map(Math.abs)):null});
 }
 return {lag,comparisons,allChannelMessagesMatch:comparisons.every(c=>c.identitiesMatch),maximumFrameDifference:comparisons.every(c=>c.identitiesMatch)?Math.max(...comparisons.map(c=>c.maxRelativeFrameDifference)):null,synthStateOrAudibleLoopVerified:false};
}
