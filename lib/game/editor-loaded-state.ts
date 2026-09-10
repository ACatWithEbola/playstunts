/** Original post-load/validation branch 0x1d7cc..0x1d7e4. */
export function editorLoadedState(location:number[],revision:number){return {cursor:[...location],mode:0,modified:0,revision:(revision+1)&255};}
