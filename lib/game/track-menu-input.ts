/** Supplied3c29..3c9f. Escape exits directly; idle selects Done. */
export function advanceOriginalTrackMenu(selected:number,key:number,hover=-1,idleExpired=0){
 hover=hover<<24>>24;key&=65535;if(hover!==-1)selected=hover;if(idleExpired&255){selected=2;key=13;}
 let action:'menu'|'load'|'edit'|'done'='menu';
 if(key===0x4b00){if(selected!==0)selected--;}
 else if(key===0x4d00){if(selected<2)selected++;}
 else if(key===13||key===32||key===27){if(key===27)selected=-1;action=selected===0?'load':selected===1?'edit':'done';}
 return {selected,action};
}
