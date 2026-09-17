const D=0x2d1a0;

/** The original ordered raster is needed only while a real crash fragment is
 * still moving. Crash flags persist after the debris has finished, and the
 * shared particle slots can retain irrelevant data; neither should replace
 * the upgraded world (and its shadow pass) for the rest of a replay. */
export function upgradedHasActiveCrashFragments(memory:Uint8Array,d=D){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(let index=0;index<24;index++){
  if(!view.getUint16(d+0x8e44+index*2,true))continue;
  const owner=memory[d+0x8ef9+index];
  if(owner!==0&&owner!==1)continue;
  const style=memory[d+0x8ee1+index]-(owner===0?4:8);
  if(style>=0&&style<4)return true;
 }
 return false;
}

/** Crash state 1 remains a visible car in the original renderer, so it must
 * keep its upgraded shadow. State 2 is the original water/omitted-car state. */
export function upgradedCarCastsShadow(opponent:boolean,opponentEnabled:boolean,crash:number){
 return (!opponent||opponentEnabled)&&crash!==2;
}
