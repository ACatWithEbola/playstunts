import {applyEditorNewChoice} from './editor-new-choice.ts';
/** Original 0x1d6f4..0x1d700 after accepted preset application. */
export function editorNewState(revision:number){return {name:'',revision:(revision+1)&255,modified:1};}
export function newEditorTerrain(state:{name:string;revision:number;modified:number;track:number[];terrain:number[]},choice:number,presets:{terrain:number[]}[]){
 const result=applyEditorNewChoice(state.track,state.terrain,choice,presets);
 return {...state,...result,...(result.applied?editorNewState(state.revision):{})};
}
