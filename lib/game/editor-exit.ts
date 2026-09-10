/** Original Done gate at 0x1d926; active is the editor loop flag. */
export function requestEditorExit(modified:number,active:number){
 return (modified&255)?{command:'prompt',active}:{command:'exit',active:0};
}
/** Original 0x1d95d..0x1d96a after the changed-track dialog. */
export function resolveEditorExit(choice:number,active:number){
 return (choice&65535)===0?{command:'save',active}:{command:'exit',active:0};
}
/** Original save-loop tail 0x1d914..0x1d922. Saving does not clear active. */
export function editorSaveLoopTail(status:number,inputCaptured:number,active:number){
 return (status&255)===0?{command:'retry',inputCaptured,active}:{command:'finish',inputCaptured:0,active};
}
