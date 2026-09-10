export interface OriginalEndMenuState {selected:number;evaluationAvailable:number;evaluationStatus:number;showEvaluation:number}
/** Supplied6af8..6c0c. Escape is ignored here. The optional first button
 * revisits evaluation/high scores; the remaining buttons return0/1/2. */
export function advanceOriginalEndMenu(before:OriginalEndMenuState,key:number){
 const state={...before,selected:before.selected&255,evaluationStatus:before.evaluationStatus&255};key&=65535;
 let action:'wait'|'review'|'return'='wait',result:number|undefined;
 const signed=()=>state.selected<<24>>24;
 if(key===13||key===32){if(state.selected===0){state.evaluationStatus=state.showEvaluation?0:2;action='review';}else{result=signed()-1;action='return';}}
 else if(key===0x4b00){if(state.evaluationAvailable&&state.evaluationStatus!==255?state.selected!==0:signed()>1)state.selected=(state.selected-1)&255;}
 else if(key===0x4d00){if(signed()<3)state.selected=(state.selected+1)&255;}
 return {state,action,result};
}
