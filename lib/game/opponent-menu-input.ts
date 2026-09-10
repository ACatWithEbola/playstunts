export interface OriginalOpponentMenuState {selected:number;configuration:number[]}
/** Supplied54e7..56a3. Escape activates the selected button, just like
 * Enter/Space. Left/right clamp; Car is skipped when racing alone. */
export function advanceOriginalOpponentMenu(before:OriginalOpponentMenuState,key:number,hover=-1){
 let selected=before.selected;const configuration=before.configuration.slice();let action:'menu'|'car'|'done'='menu';
 if(configuration.length!==24)throw Error('Original menu requires the24-byte game configuration');
 const opponent=configuration[6];hover=hover<<24>>24;
 if(hover!==-1&&(opponent!==0||hover!==3))selected=hover;
 key&=65535;
 if(key===0x4b00){if(selected!==0)selected--;if(!opponent&&selected===3)selected--;}
 else if(key===0x4d00){if(selected<4)selected++;if(!opponent&&selected===3)selected++;}
 else if(key===13||key===27||key===32){
  if(selected===0){configuration[6]=(opponent-1)&255;if((configuration[6]<<24>>24)<1)configuration[6]=6;}
  else if(selected===1){configuration[6]=(opponent+1)&255;if(configuration[6]===7)configuration[6]=1;}
  else if(selected===2)configuration[6]=0;
  else if(selected===3){if(opponent)action='car';}
  else if(selected===4){
   if(!opponent)configuration[7]=255;
   else if(configuration[7]===255){configuration.splice(7,4,...configuration.slice(0,4));configuration[11]=(configuration[4]&1)^1;configuration[12]=0;}
   action='done';
  }
 }
 return {state:{selected,configuration},action};
}
