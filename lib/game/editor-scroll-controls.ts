import {editorScrollbarRelease} from './editor-scrollbar-interaction.ts';
import {editorScrollResult} from './editor-scroll-result.ts';
export interface EditorScrollState {cursor:number[];origin:number[];paletteCursor:number[];page:number;mode:number;key:number}
/** Original caller arguments at 0x1d061,0x1d11d,0x1d17f. */
export const editorScrollControls=[
 {x:9,y:181,width:192,height:5,visible:12,total:30,vertical:false},
 {x:202,y:4,width:5,height:176,visible:11,total:30,vertical:true},
 {x:221,y:133,width:95,height:5,visible:1,total:10,vertical:false},
] as const;
/** Complete a held scrollbar interaction after the caller's hit/button gate. */
export function releaseEditorScrollControl(state:EditorScrollState,region:0|1|2,initial:number[],release:number[]):EditorScrollState{
 const control=editorScrollControls[region],axis=control.vertical?1:0,offset=control.vertical?control.y:control.x;
 const value=region===2?state.page-1:state.origin[region];
 const next=editorScrollbarRelease(control.width,control.height,value,control.visible,control.total,initial[axis]-offset,release[axis]-offset);
 if(region===2)return {...state,page:(next+1)&255,mode:1,paletteCursor:[state.paletteCursor[0],6],key:1};
 return {...state,...editorScrollResult(state.cursor,state.origin,region,next),mode:0};
}
