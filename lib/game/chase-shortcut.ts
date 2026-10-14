/** Plain V belongs to original-game text input, including replay filenames. */
export function isChaseToggle(event:{code:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;shiftKey:boolean;repeat:boolean}){
 return event.code==='KeyV'&&event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey&&!event.repeat;
}
