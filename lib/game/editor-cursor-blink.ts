/** Original 0x1cf67..0x1cff5. Tick accumulation occurs afterwards in the caller. */
export function editorCursorBlink(ticks:number,mode:number,phase:number){
 ticks&=65535;phase&=65535;
 if(((ticks<<16)>>16)<=15)return {ticks,phase,action:null};
 return {ticks:0,phase:phase^1,action:(mode&255)?'outline':phase?'restore':'cursor'};
}
