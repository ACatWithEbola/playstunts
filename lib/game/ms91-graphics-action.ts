import {ms91GraphicsOptions,type Ms91GraphicsSettings,type Ms91GraphicsRequest} from './ms91-graphics-options.ts';
export type Ms91GraphicsEffect=Ms91GraphicsRequest|{type:'save'|'pause-audio'|'resume-audio'|'restore'};
/** Native graphics action lifecycle. Settings are configured for the next
 * race; this dispatcher does not mutate active or recorded session metadata. */
export function* ms91GraphicsAction(settings:Ms91GraphicsSettings):Generator<Ms91GraphicsEffect,void,number>{
 yield {type:'save'};
 yield {type:'pause-audio'};
 const menu=ms91GraphicsOptions(settings);let step=menu.next();
 while(!step.done){const reply=yield step.value;step=menu.next(reply);}
 yield {type:'resume-audio'};
 yield {type:'restore'};
}
