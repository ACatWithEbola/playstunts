/** Supplied run_menu at 0x3820..0x38ad. Tables DS:022a / DS:0230;
 * unlike the older disassembly locator these clamp at the outer signs.
 */
export interface OriginalMenuState {selected:number;idleCounter:number;idleExpired:number}
export function advanceOriginalMenu(state:OriginalMenuState,delta:number,key:number,hit=-1){
 let selected=hit>=0&&hit<5?hit:state.selected;
 let idleCounter=(state.idleCounter+delta)&65535,idleExpired=state.idleExpired&255;
 const signed=idleCounter<32768?idleCounter:idleCounter-65536;
 if(signed>6000){idleCounter=0;idleExpired=(idleExpired+1)&255;}
 if(idleExpired){selected=0;key=13;}
 let result:number|undefined;
 if(key===27)result=-1;
 else if(key===13||key===32)result=selected;
 else if(key===0x4b00)selected=[1,2,2,0,3][selected];
 else if(key===0x4d00)selected=[3,0,1,4,4][selected];
 return {state:{selected,idleCounter,idleExpired},result};
}
