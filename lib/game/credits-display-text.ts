/** Original 2F62..3532 credits text placement and driver-owned colours. */
export const originalCreditsTextLayout = [
 ['ecre',120,0,0x4e98,0x4e9a],
 ['gds0',60,12,0x4e94,0x4e96],
 ['gds1',104,20,0x4e94,0x4e96],
 ['edes',20,32,0x4e9c,0x4e9e],
 ['gdon',20,44,0x4e94,0x4e96],
 ['gkev',20,52,0x4e94,0x4e96],
 ['gbra',20,60,0x4e94,0x4e96],
 ['grob',20,68,0x4e94,0x4e96],
 ['gsta',20,76,0x4e94,0x4e96],
 ['emus',20,92,0x4ea8,0x4eaa],
 ['gmsy',20,104,0x4e94,0x4e96],
 ['gkri',20,112,0x4e94,0x4e96],
 ['gbri',20,120,0x4e94,0x4e96],
 ['epro',172,32,0x4ea0,0x4ea2],
 ['gkev',172,44,0x4e94,0x4e96],
 ['eopr',172,56,0x4ea0,0x4ea2],
 ['gbra',172,64,0x4e94,0x4e96],
 ['gric',172,72,0x4e94,0x4e96],
 ['eart',172,84,0x4ea4,0x4ea6],
 ['gmsm',172,96,0x4e94,0x4e96],
 ['gdav',172,104,0x4e94,0x4e96],
 ['gnic',172,112,0x4e94,0x4e96],
 ['gkev',172,120,0x4e94,0x4e96],
 ] as const;
export function drawOriginalCreditsDisplayText(memory:Uint8Array,d:number,host:{shadowText(text:number,x:number,y:number,colour:number,shadow:number):unknown},resources:Record<string,ReadonlyArray<number>>,scratch:number){
 const word=(at:number)=>memory[d+at]|memory[d+at+1]<<8;
 for(const [key,x,y,colour,shadow] of originalCreditsTextLayout){const bytes=resources[key];if(!bytes)throw Error('Original credits text is missing: '+key);const end=bytes.indexOf(0),text=end<0?bytes:bytes.slice(0,end);memory.set(text,d+scratch);memory[d+scratch+text.length]=0;host.shadowText(scratch,x,y,word(colour),word(shadow));}
}
