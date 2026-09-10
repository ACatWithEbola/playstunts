export interface OriginalOptionSettings {mouse:boolean;joystick:boolean;graphics:number}
export type OriginalOptionAction='keyboard'|'mouse'|'music'|'sound'|'graphics'|'exit-dos';
export type OriginalOptionEffect={type:'save'|'restore'|'pause-audio'|'resume-audio'|'toggle-music'|'toggle-sound'|'exit'}|
 {type:'dialog';resource:string;mode:2|4;selected:number;border:number};
/** Supplied 1c092..1c315. Audio/backup/dialog/exit operations stay with the host.
 * A real exit does not return; the generator's continuation mirrors the source
 * if an embedding host deliberately returns from the exit callback.
 */
export function* originalOptionAction(action:OriginalOptionAction,settings:OriginalOptionSettings):Generator<OriginalOptionEffect,void,number>{
 yield {type:'save'};
 if(action==='music'||action==='sound'){
  const enabled=yield {type:action==='music'?'toggle-music':'toggle-sound'};
  yield {type:'dialog',resource:action==='music'?(enabled?'emon':'emof'):(enabled?'eson':'esof'),mode:4,selected:0,border:4};
 }else{
  yield {type:'pause-audio'};
  if(action==='mouse')settings.mouse=true;
  const answer=yield {type:'dialog',resource:action==='keyboard'?'ekey':action==='mouse'?'emou':action==='graphics'?'emrl':'edos',mode:action==='graphics'||action==='exit-dos'?2:4,selected:action==='graphics'?settings.graphics:0,border:action==='graphics'?1:4};
  if(action==='keyboard'){settings.mouse=false;settings.joystick=false;}
  if(action==='graphics'&&(answer&255)!==255)settings.graphics=answer&255;
  if(action==='exit-dos'&&(answer&65535)===1)yield {type:'exit'};
  yield {type:'resume-audio'};
 }
 yield {type:'restore'};
}
