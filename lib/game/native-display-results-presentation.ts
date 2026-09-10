import type {NativeRaceResultsHost,NativeRaceResultsState,NativeRaceResultsPresentation} from './native-race-results.ts';
import type {prepareNativeDisplayResultsResources} from './native-display-results-resources.ts';
import {drawOriginalRaceResultPanelDisplay} from './race-result-panel-display.ts';
import {drawOriginalHighScoreTableDisplay} from './high-score-table-display.ts';
import {drawOriginalEvaluationPortraitDisplay} from './evaluation-portrait-display.ts';
import {drawOriginalEvaluationPanelDisplay} from './evaluation-panel-display.ts';
import {drawOriginalMenuButtonDisplay} from './menu-button-display.ts';
import {drawOriginalOutlinedFontDisplay} from './font-outline-display.ts';
import {measureOriginalFont} from './font-raster.ts';
import {continueNativeEvaluation} from './native-evaluation-continue.ts';
import {enterNativeDisplayHighScore} from './native-display-high-score-entry.ts';
import {runNativeDisplayEndMenu} from './native-display-end-menu.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
/** Display implementation for the shared original results lifecycle. */
export function createNativeDisplayResultsPresentation(resources:Awaited<ReturnType<typeof prepareNativeDisplayResultsResources>>,host:NativeRaceResultsHost,state:NativeRaceResultsState):NativeRaceResultsPresentation{
 const {owner}=resources,{d,mode,drawing}=owner,scratch=0xe800,word=(at:number)=>{const m=owner.memory();return m[d+at]|(m[d+at+1]<<8);},normal=()=>{restoreOriginalDisplayWindow(owner.memory(),d,mode);new DataView(owner.memory().buffer).setUint16(d+0x4dd2,resources.normalFontSegment,true);};
 let evaluation:Awaited<ReturnType<typeof resources.evaluation>>|undefined,frames:Record<string,number[]>|undefined;
 const sprite=(bytes:ReadonlyArray<number>)=>{const key=frames&&Object.keys(frames).find(key=>frames![key]===bytes);if(!key||!evaluation)throw Error('Original evaluation frame is not loaded');return evaluation.frame(key);};
 const button=(label:ReadonlyArray<number>|null,x:number,y:number,width:number,height:number)=>{normal();drawOriginalMenuButtonDisplay(owner.memory(),d,drawing,label,x,y,width,height,word(0x4eb4),word(0x4eb6),word(0x4eb8),0,scratch);};
 const scores=()=>{normal();drawOriginalHighScoreTableDisplay(owner.memory(),d,mode,drawing,host.resources,state.trackName,Array.from(state.scores.file),state.scores.order,state.scores.selected,resources.smallFontSegment,scratch);};
 return {
  panel(){normal();return drawOriginalRaceResultPanelDisplay(owner.memory(),d,mode,drawing,host.resources,state.panel,scratch);},
  async prepareEvaluation(opponent,mode,art){evaluation=await resources.evaluation(opponent,mode==='win');frames=art;},
  portrait(first,current){normal();drawOriginalEvaluationPortraitDisplay(owner.memory(),d,mode,drawing,sprite(first),sprite(current));},
  clearTop(){button(null,0,0,320,100);},scores,
  evaluation(first,current,fragments,colour){normal();new DataView(owner.memory().buffer).setUint16(resources.smallFontSegment*16,(colour===4?word(0x4ec2):colour)&(mode==='cga'?3:15),true);drawOriginalEvaluationPanelDisplay(owner.memory(),d,mode,drawing,sprite(first),sprite(current),fragments,resources.smallFontSegment,scratch);},
  async continueEvaluation(animate){const key=await continueNativeEvaluation({...host,animate,onOutline:state.evaluationOutline,drawing:{button(){button(host.resources.ebct,129,175,70,21);},outline(colour){normal();const pattern=word(colour===14?0x4e90:0x4e8e);drawing.rectangle(128,174,72,1,pattern);drawing.rectangle(128,197,72,1,pattern);drawing.rectangle(128,174,1,24,pattern);drawing.rectangle(199,174,1,24,pattern);}}});normal();drawing.rectangle(8,174,304,24,word(0x4eb8),false);return key;},
  async enterScore(candidate,message){normal();await enterNativeDisplayHighScore(owner,{...host,drawTable:scores,async save(bytes){await host.files.writeScores(bytes);}},state.scores,candidate,message,4);},
  unavailable(){normal();const text=String.fromCharCode(...host.resources.ehna).split('\0')[0],font=resources.normalFontSegment*16,x=Math.trunc((320-measureOriginalFont(owner.memory().subarray(font,font+65536),Array.from(text,c=>c.charCodeAt(0))))/2);drawOriginalOutlinedFontDisplay(owner.memory(),d,mode,drawing,text,x,50,word(0x4e8a),0,scratch);},
  endMenu(menu,flags){normal();return runNativeDisplayEndMenu(owner,menu,flags,scratch);}
 };
}
