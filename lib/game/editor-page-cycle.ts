/** Original More Tracks control, 0x1d5da..0x1d5f4. */
export function cycleEditorPage(page:number){return {page:page>=10?1:page+1,redraw:1};}
