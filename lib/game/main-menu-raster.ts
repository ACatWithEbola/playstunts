import {originalMainMenuBounds} from './main-menu-hit.ts';
/** Supplied menu flash draws an inclusive one-pixel rectangle at27ff0. */
export function drawOriginalMainMenuSelection(target:Uint8Array,selected:number,color:number){
 const [left,top,right,bottom]=originalMainMenuBounds[selected];
 for(let x=left;x<=right;x++){target[top*320+x]=color;target[bottom*320+x]=color;}
 for(let y=top;y<=bottom;y++){target[y*320+left]=color;target[y*320+right]=color;}
}

/** Keep the indexed screen behind browser menu presentation current, so
 * subsequent source dialogs inherit the main menu rather than a prior submenu. */
export function restoreOriginalMainMenuPixels(target:Uint8Array,art:Uint8Array,outline?:readonly [number,number]){
 if(art.length<64016||target.length<64000)throw Error('Original main menu bitmap is incomplete');
 target.set(art.subarray(16,64016));
 if(outline)drawOriginalMainMenuSelection(target,outline[0],outline[1]);
}
