/** Original panorama/background globals in DF2A..E77F. */
const globals=new Set([0x7fe4,0x909e,0x9be2,0x9ae2,0x9ae8,0x9b2c,0x9b2e,0x9b30,0x9b32,0xa390,0xa392,0xa394,0xa396,0xa398,0xa39a,0xa39c,0xa39e]);
export const BACKGROUND_DISPLAY_LAYOUTS:Record<'mcga'|'cga'|'tandy'|'ega',(address:number)=>number>={mcga:n=>n,cga:n=>n+(globals.has(n)?0x5e0:0),tandy:n=>n+(globals.has(n)?0x620:0),ega:n=>n+(globals.has(n)?0x45c:0)};
