import {editorPaletteTile} from './editor-palette.ts';
import {editorPieceSelection} from './editor-piece-selection.ts';
/** Original 0x1d548..0x1d5d7, after the palette cursor has resolved markers. */
export function selectEditorPiece(pages:number[][],objects:{multiTile:number}[],page:number,paletteCursor:number[],cursor:number[],origin:number[],dirty:number){
 const selected=editorPaletteTile(pages,page,paletteCursor[1],paletteCursor[0]);
 return {selected,...editorPieceSelection(cursor,origin,page,page?objects[selected].multiTile:0,dirty)};
}
