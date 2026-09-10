/** Supplied show_dialog input iteration 1a0d3..1a220. Hover is the original
 * rectangle hit-test result. Disabled values are the optional original word
 * table (zero enables). Two-choice shortcuts are precomputed lowercase codes.
 */
export function originalDialogInput(input:{count:number;selected:number;hover:number;key:number;disabled?:ReadonlyArray<number>|null;shortcuts?:readonly [number,number]}){
 let {selected,key}=input;const {count,hover,disabled,shortcuts}=input;
 if(hover!==-1&&!disabled?.[hover])selected=hover;
 if(count===2&&key!==0&&shortcuts){
  const lower=key>=65&&key<=90?key+32:key;
  if(lower===shortcuts[0]){selected=0;key=13;}else if(lower===shortcuts[1]){selected=1;key=13;}
 }
 if(key===27)return {selected:-1,done:true};
 if(key===13||key===32)return {selected,done:true};
 if(key===0x4800||key===0x4b00){
  while(selected!==0){selected--;if(!disabled?.[selected])break;}
 }else if(key===0x4d00||key===0x5000){
  while(selected+1<count){selected++;if(!disabled?.[selected])break;}
 }
 return {selected,done:false};
}
