export interface EditorValidationState {cursor:number[];mode:number;selectedTile:number;previousTile:number;selection:number;dirty:number}
/** Original editor 0x1d4c6..0x1d52d, after displaying validation status. */
export function applyEditorValidationResult(before:EditorValidationState,error:number,location:number[],columns:number[],rows:number[],track:number[]):EditorValidationState{
 if(error<=1)return {...before,cursor:[...before.cursor]};
 if(!columns.length)return {...before,cursor:[...location],mode:0};
 const cursor=[columns[0],rows[0]];
 return {...before,cursor,mode:0,previousTile:before.selectedTile,selectedTile:track[(29-cursor[1])*30+cursor[0]],selection:1,dirty:1};
}
