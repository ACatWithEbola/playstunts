/** Original 20ad8..20b01 uses the game counter at DS407e, not the faster
 * opening/input counter. Preserve its separate unsigned high/low comparisons.
 */
export function* originalDialogDelay(duration=8):Generator<{type:'game-counter'},void,number>{
 const target=((yield {type:'game-counter'})+duration)>>>0;
 for(;;){const now=(yield {type:'game-counter'})>>>0;if((now>>>16)>=(target>>>16)&&(now&65535)>=(target&65535))return;}
}
