import {drawOriginalOutlinedFontDisplay} from './font-outline-display.ts';
import {drawOriginalMenuButtonDisplay} from './menu-button-display.ts';
import {measureOriginalFont} from './font-raster.ts';
import {originalRaceResultLines} from './race-result-lines.ts';
import {originalRaceResultStatistics} from './race-result-statistics.ts';
import type {OriginalRaceResultPanelState} from './race-result-panel.ts';
import type {OriginalMenuButtonDisplayHost} from './menu-button-display.ts';
/** Original 595C..5EF5 through the selected display's patterns and font. */
export function drawOriginalRaceResultPanelDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalMenuButtonDisplayHost,resources:Record<string,ReadonlyArray<number>>,state:OriginalRaceResultPanelState,scratch:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true),font=word(0x4dd2)*16;
 for(const [y,height] of [[0,100],[101,99]])drawOriginalMenuButtonDisplay(memory,d,host,null,0,y,320,height,word(0x4eb4),word(0x4eb6),word(0x4eb8),0,scratch);
 const times=originalRaceResultLines(state,resources),statistics=originalRaceResultStatistics({...state,outcome:times.outcome,y:107+times.lines.length*10},resources);
 for(const line of [...times.lines,...statistics.lines]){
  const bytes=Array.from(line.text,c=>c.charCodeAt(0)),x=Math.trunc((320-measureOriginalFont(memory.subarray(font,font+65536),bytes))/2);
  drawOriginalOutlinedFontDisplay(memory,d,mode,host,line.text,x,line.y,word(0x4e8a),0,scratch);
 }
 return {outcome:times.outcome,evaluationAvailable:statistics.evaluationAvailable};
}
