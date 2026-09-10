export interface EditorRouteSelectionState {selection:number;key:number;mode:number;selected:number;savedPiece:number;cursor:number[];revision:number;change:number}
/** Original 1d37e..1d3fe route-error highlighting. Any real key or a switch to
 * palette mode advances immediately to the last route cell before restoring
 * the piece held before validation. */
export function advanceEditorRouteSelection(before:EditorRouteSelectionState,columns:number[],rows:number[],track:number[],count=columns.length){
 if(!before.selection)return {...before,cursor:[...before.cursor]};
 let selection=before.key===1&&before.mode===0?before.selection:count-1;
 const cursor=[columns[selection],rows[selection]];
 if(cursor.some(v=>v===undefined))throw Error('Original route highlight requires retained route-array memory at this index');
 let selected=track[(29-cursor[1])*30+cursor[0]];selection=(selection+1)&65535;
 if((selection<<16>>16)>=count){selected=before.savedPiece;selection=0;}
 return {...before,cursor,selected,selection,revision:1,change:1};
}
