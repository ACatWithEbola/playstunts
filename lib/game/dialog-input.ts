/** Supplied show_dialog input iteration 1a0d3..1a220. Hover is the original
 * rectangle hit-test result. Disabled values are the optional original word
 * table (zero enables). Two-choice shortcuts are precomputed lowercase codes.
 */
export function originalDialogInput(input:{count:number;selected:number;hover:number;key:number;disabled?:ReadonlyArray<number>|null;shortcuts?:readonly [number,number];physicsEngine?:import('../physics/engine-version.ts').PhysicsEngineVersion}){
 let {selected,key}=input;const {count,hover,disabled,shortcuts}=input;
 if(hover!==-1&&!disabled?.[hover])selected=hover;
 if(count===2&&key!==0&&shortcuts){
  const lower=key>=65&&key<=90?key+32:key;
  if(lower===shortcuts[0]){selected=0;key=13;}else if(lower===shortcuts[1]){selected=1;key=13;}
 }
 if(key===27)return {selected:-1,done:true};
 if(key===13||key===32)return {selected,done:true};
 if(input.physicsEngine==='ms-1991'&&count>0&&[0x4800,0x4b00,0x4d00,0x5000].includes(key)){
  const direction=key===0x4800||key===0x4b00?-1:1;
  // Original MS91 wraps and skips disabled entries. Bound a malformed
  // all-disabled table so the asynchronous browser caller cannot hang.
  const before=selected;
  for(let n=0;n<count;n++){
   selected=(selected+direction+count)%count;
   if(!disabled?.[selected])return {selected,done:false};
  }
  return {selected:before,done:false};
 }
 if(key===0x4800||key===0x4b00){
  while(selected!==0){selected--;if(!disabled?.[selected])break;}
 }else if(key===0x4d00||key===0x5000){
  while(selected+1<count){selected++;if(!disabled?.[selected])break;}
 }
 return {selected,done:false};
}
