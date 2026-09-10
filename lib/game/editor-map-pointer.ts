/** Original map-region branch 0x1d1b2..0x1d26c; caller performs hit testing first. */
export function editorMapPointer(x:number,y:number,page:number,multiTile:number,before:{cursor:number[];origin:number[];mode:number;key:number}){
 let column=Math.trunc(((x-8)<<16>>16)/16)&255,row=Math.trunc(((y-4)<<16>>16)/16)&255;
 if(page){if(row===10&&(multiTile&1))row--;if(column===11&&(multiTile&2))column--;}
 const cursor=[(column+before.origin[0])&255,(row+before.origin[1])&255];
 let key=before.key&65535;
 if(before.mode!==0||cursor[0]!==before.cursor[0]||cursor[1]!==before.cursor[1])key=1;
 if(key===32)key=13;
 return {cursor,mode:0,key};
}
