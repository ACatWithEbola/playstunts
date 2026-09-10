/** Original 0x1d09f..0x1d0ba; ordering matters when route selection synthesizes key 1. */
export function editorInputTail(key:number,selection:number,lastColumn:number){
 key&=65535;lastColumn&=255;
 if(key===1)lastColumn=255;
 if(key===0&&(selection&65535)!==0)key=1;
 return {key,lastColumn};
}
