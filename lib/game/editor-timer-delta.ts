/** Original 0x245d0; editor caller 0x1cff5 uses AX (low delta word). */
export function editorTimerDelta(previous:number,current:number){return {delta:((current>>>0)-(previous>>>0))>>>0,nextPrevious:current>>>0};}
export function accumulateEditorTicks(ticks:number,delta:number){return (ticks+(delta&65535))&65535;}
