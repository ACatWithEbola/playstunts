import {applyEditorTerrainPreset} from './editor-terrain-preset.ts';
/** Original result gate 0x1d69f..0x1d6ad. */
export function editorNewChoiceApplies(choice:number){const byte=choice&255;return byte!==255&&byte!==5;}
/** Compose the verified gate and buffer operation for supplied dialog choices. */
export function applyEditorNewChoice(track:number[],terrain:number[],choice:number,presets:{terrain:number[]}[]){
 if(!editorNewChoiceApplies(choice))return {track:[...track],terrain:[...terrain],applied:false};
 const preset=presets[choice];if(!preset)throw Error('Terrain choice has no supplied original resource');
 return {...applyEditorTerrainPreset(track,preset.terrain),applied:true};
}
