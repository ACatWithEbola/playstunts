/** Map held keyboard activators to the button bits consumed by the original
 * replay scrub loop. Space follows the left-button path; Enter follows right. */
export function replayKeyboardHoldButtons(space:boolean,enter:boolean){
 return (space?32:0)|(enter?16:0);
}
