export interface OriginalCarMenuState {selected:number;car:number;carCount:number;paint:number;transmission:number;ready:boolean;renderPhase:number;idleExpired:number}
/** Supplied4d24..4d73/4ea8..50a9. Escape activates the current button;
 * inactivity forces Done but cannot leave before the car has rendered. */
export function advanceOriginalCarMenu(before:OriginalCarMenuState,key:number,hover=-1){
 const state={...before};let action:'menu'|'done'|'transmission'='menu';hover=hover<<24>>24;key&=65535;
 if(hover!==-1)state.selected=hover;
 if(state.idleExpired){state.selected=0;key=13;}
 if(key===0x4800){if(state.selected!==0)state.selected--;}
 else if(key===0x5000){if(state.selected<4)state.selected++;}
 else if(key===13||key===27||key===32){
  switch(state.selected){
   case 0:if(state.ready)action='done';break;
   case 1:state.car=(state.car+1)&255;if(state.car===state.carCount)state.car=0;break;
   case 2:state.car=(state.car-1)&255;if(state.car&128)state.car=(state.carCount-1)&255;break;
   case 3:state.transmission^=1;action='transmission';break;
   case 4:state.paint=(state.paint+1)&255;state.renderPhase=3;break;
  }
 }
 return {state,action};
}
