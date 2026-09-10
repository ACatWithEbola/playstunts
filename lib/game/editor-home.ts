/** Original map-mode origin action, 0x1dbb4..0x1dbdd. */
export function editorHome(cursor:number[],origin:number[]){
 const target=cursor[0]===origin[0]&&cursor[1]===origin[1]?[0,0]:[...origin];
 return {cursor:[...target],origin:target};
}
