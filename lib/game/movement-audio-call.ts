/** Original 8938..8968: replay-only movement and race exit suppress AA92.
 * Any nonzero low byte of the selected-car word uses the opponent's handle. */
export function originalMovementAudioCall(mode:number,exiting:number,selected:number,flags:number,handles:readonly number[],active:number){
 if((mode&255)===2||(exiting&255)!==0)return null;
 return {flags:flags&255,handle:handles[(selected&255)?1:0]&65535,active:(active&255)!==0};
}
