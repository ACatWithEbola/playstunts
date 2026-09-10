import {originalDialogInput} from './dialog-input.ts';
import type {originalDialogContent} from './dialog-content.ts';
export type OriginalDialogContent=ReturnType<typeof originalDialogContent>;
export type OriginalDialogSessionEffect={type:'draw';selected:number}|{type:'input'}|{type:'release'}|{type:'delay';ticks:8};
export type OriginalDialogSessionReply={key:number;hover:number}|undefined;
/** Original show_dialog lifecycle after layout/backup has succeeded. The caller
 * saves/restores the background and supplies original input/hit-test results.
 * Timing and button-release waits yield so the native host remains responsive.
 */
export function* originalDialogSession(content:OriginalDialogContent,mode:number,selected=0,disabled?:ReadonlyArray<number>,shortcuts?:readonly [number,number]):Generator<OriginalDialogSessionEffect,number,OriginalDialogSessionReply>{
 yield {type:'draw',selected:mode===2?selected:-1};
 if(mode===0)return 0;
 if(mode===3)return content.fields.length;
 if(mode===4){yield {type:'delay',ticks:8};return 1;}
 if(mode===1){for(;;){const input=yield {type:'input'};if(input?.key){yield {type:'release'};return input.key===27?0:1;}}}
 if(mode!==2)return 1;
 yield {type:'release'};
 // The original derives these from resource strings; callers bind them using
 // the same bytes rather than user-facing translated labels.
 for(;;){
  const input=yield {type:'input'};if(!input)continue;
  const result=originalDialogInput({count:content.choices.length,selected,hover:input.hover,key:input.key,disabled,shortcuts});
  if(result.done){yield {type:'release'};return result.selected;}
  if(result.selected!==selected){selected=result.selected;yield {type:'draw',selected};}
 }
}
