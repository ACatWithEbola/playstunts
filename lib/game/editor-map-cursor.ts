/** Original 0x1cc3c..0x1ce2d map selection calculation (before label/UI updates). */
export function editorMapCursor(track:number[],cursor:number[],origin:number[],size:number[]){
 const [column,row]=cursor,index=(29-row)*30+column;
 let tile=track[index];
 if(tile===253)tile=track[index+29];
 else if(tile===254)tile=track[index+30];
 else if(tile===255)tile=track[index-1];
 return {x:((column-origin[0])*16+8)&65535,y:((row-origin[1])*16+4)&65535,width:(size[0]*16)&255,height:(size[1]*16)&255,tile};
}
