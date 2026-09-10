import {drawOriginalMenuButton} from './menu-button-raster.ts';
import {drawOriginalOutlinedFont} from './font-outline.ts';
import {measureOriginalFont} from './font-raster.ts';
import {originalRaceResultLines,type OriginalRaceResultTimes} from './race-result-lines.ts';
import {originalRaceResultStatistics,type OriginalRaceResultStatistics} from './race-result-statistics.ts';
export type OriginalRaceResultPanelState=OriginalRaceResultTimes&Omit<OriginalRaceResultStatistics,'opponentSelected'|'outcome'|'y'>;
/** Original595c..5ef5 results background and seven possible statistic rows. */
export function drawOriginalRaceResultPanel(pixels:Uint8Array,font:Uint8Array,resources:Record<string,ReadonlyArray<number>>,state:OriginalRaceResultPanelState){
 drawOriginalMenuButton(pixels,font,null,0,0,320,100,15,8,7,0);drawOriginalMenuButton(pixels,font,null,0,101,320,99,15,8,7,0);
 const times=originalRaceResultLines(state,resources),statistics=originalRaceResultStatistics({...state,outcome:times.outcome,y:107+times.lines.length*10},resources),rows=Array.from({length:256},(_,i)=>(i*320)&65535);
 for(const line of [...times.lines,...statistics.lines]){const x=Math.trunc((320-measureOriginalFont(font,Array.from(line.text,c=>c.charCodeAt(0))))/2);drawOriginalOutlinedFont(pixels,font,line.text,x,line.y,15,0,rows);}
 return {outcome:times.outcome,evaluationAvailable:statistics.evaluationAvailable};
}
