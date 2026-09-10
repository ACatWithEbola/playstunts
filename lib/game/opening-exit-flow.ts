/** Main2C24..2C2B / 2D16..2D4E: Escape asks to exit; cancelling
 * restarts the opening. The confirmation comparison is a signed word. */
export function originalOpeningExitDecision(key:number,confirmation?:number|null){
 if((key&65535)!==27)return 'menu';
 if(confirmation===undefined||confirmation===null)return 'confirm';
 return (confirmation<<16>>16)>=1?'exit':'opening';
}
export const originalOpeningExitDialog={resource:'edos',mode:2,selected:1} as const;

/** F9B1..F9B5 / FA24: the animated logo returns a skip flag, not the key. */
export function originalAnimatedOpeningSkip(key:number){return (key&65535)?1:0;}
