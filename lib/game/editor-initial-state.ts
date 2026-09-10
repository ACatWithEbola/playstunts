/** Fields explicitly initialized by original editor 0x1c661..0x1c6bf. */
export function editorInitialState(location:number[]){
 return {cursor:[...location],origin:[0,0],paletteCursor:[0,7],page:1,selected:0,mode:0,lastColumn:255,revision:1,change:1,redraw:1,selection:0};
}
