export function isFpsToggle(event:{code:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;shiftKey:boolean;repeat:boolean}){
 return event.code==='KeyF'&&event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey&&!event.repeat;
}
