import {originalResultMusic} from './native-music-score.ts';
import {drawOriginalRaceResultPanel,type OriginalRaceResultPanelState} from './race-result-panel.ts';
import {drawOriginalHighScoreTable} from './high-score-table.ts';
import {drawOriginalMenuButton} from './menu-button-raster.ts';
import {drawOriginalOutlinedFont} from './font-outline.ts';
import {measureOriginalFont} from './font-raster.ts';
import {drawOriginalEvaluationPanel} from './opponent-evaluation-panel.ts';
import {drawOriginalEvaluationPortrait} from './opponent-evaluation-portrait.ts';
import {advanceOriginalEvaluationAnimation} from './opponent-evaluation-animation.ts';
import {selectOriginalEvaluation,type OriginalEvaluationChoices} from './opponent-evaluation-selection.ts';
import {prepareNativeHighScores,type NativeHighScorePreparationHost} from './native-high-score-preparation.ts';
import {enterNativeHighScore,type NativeHighScoreState} from './native-high-score-runtime.ts';
import {showNativeRaceReview} from './native-race-review.ts';
import {continueNativeEvaluation} from './native-evaluation-continue.ts';
import {runNativeEndMenu,type NativeEndMenuHost} from './native-end-menu-runtime.ts';
import type {NativeDialogHost} from './native-dialog-runtime.ts';
import type {OriginalEndMenuState} from './end-menu-input.ts';
export interface NativeEvaluationResources {resources:Record<string,number[]>;art:Record<string,Record<string,number[]>>}
export interface NativeRaceResultsHost extends NativeDialogHost {
 playResultMusic?(name:'vict'|'over'):void;
 smallFont:Uint8Array;counter():number;
 files:NativeHighScorePreparationHost;
 evaluation(opponent:number):Promise<NativeEvaluationResources>;
 randomWord():number;randomByte():number;
 selectEvaluation?(state:NativeRaceResultsState,outcome:number):Promise<ReturnType<typeof selectOriginalEvaluation>>;
 prepareScores?(state:NativeRaceResultsState):Promise<{status:number;candidateTime:number}>;
}
export interface NativeRaceResultsState {
 panel:OriginalRaceResultPanelState;track:Uint8Array;trackName:string;trackPath:string;scores:NativeHighScoreState;
 choices:OriginalEvaluationChoices;raceCounter:number;retainedCandidateTime:number;
 carName:string;opponentCode:string;opponentCarCode:string;
 /** Retained foreground of FONTN. Selecting a font does not reset it. */
 smallFontColor?:number;
 /** Original caller SI retained until an evaluation-dismissal key replaces it. */
 retainedPromptSI?:number;
 /** Score preparation leaves901; evaluation replaces it with its fragment count. */
 retainedPromptDI?:number;
 evaluationOutline?(delta:number,colour:number):void;
}
export interface NativeRaceResultsPresentation {
 panel():ReturnType<typeof drawOriginalRaceResultPanel>;
 prepareEvaluation(opponent:number,mode:'win'|'lose',art:Record<string,number[]>):Promise<void>;
 portrait(first:ReadonlyArray<number>,current:ReadonlyArray<number>):void;
 clearTop():void;scores():void;
 evaluation(first:ReadonlyArray<number>,current:ReadonlyArray<number>,fragments:ReadonlyArray<ReadonlyArray<number>>,colour:number):void;
 continueEvaluation(animate:(delta:number)=>void):Promise<number>;
 enterScore(candidate:Parameters<typeof enterNativeHighScore>[2],message:ReadonlyArray<number>):Promise<void>;
 unavailable():void;
 endMenu(host:NativeEndMenuHost,flags:Omit<OriginalEndMenuState,'selected'>):Promise<number>;
}
/** Native post-race presentation and actions, assembled from the verified
 * original components. Retained caller state and file/RNG services are
 * explicit; this function does not invent stack bytes or race results. */
export async function runNativeRaceResults(host:NativeRaceResultsHost,state:NativeRaceResultsState,display?:NativeRaceResultsPresentation){
 // FONTN is stored with cyan as its resource default. The results routine
 // selects black before drawing an evaluation; otherwise the untouched file
 // default leaks into the first opponent comment.
 state.smallFontColor=0;
 const {outcome,evaluationAvailable}=display?display.panel():drawOriginalRaceResultPanel(host.pixels,host.font,host.resources,state.panel);
 host.playResultMusic?.(originalResultMusic(outcome));
 const evaluation=evaluationAvailable?await host.evaluation(state.panel.opponentSelected):undefined;
 const selection=evaluation?(host.selectEvaluation?await host.selectEvaluation(state,outcome):selectOriginalEvaluation(state.choices,state.panel.flags,outcome,state.panel.playerTime,state.raceCounter,host.randomWord,host.randomByte)):undefined;
 if(selection)state.choices={current:selection.current,previous:selection.previous};
 const eligibility=host.prepareScores?await host.prepareScores(state):await prepareNativeHighScores(host.files,state.scores,state.track,state.panel.playerTime,state.panel.flags,state.retainedCandidateTime);state.retainedCandidateTime=eligibility.candidateTime;
 let flags:Omit<OriginalEndMenuState,'selected'>={evaluationAvailable,evaluationStatus:eligibility.status,showEvaluation:1};
 let animation={phase:30,index:0,drawnIndex:0};
 const art=selection&&evaluation?evaluation.art[selection.mode]:undefined,sequence=selection&&evaluation?evaluation.resources[selection.sequence]:undefined;
 if(display&&selection&&art)await display.prepareEvaluation(state.panel.opponentSelected,selection.mode as 'win'|'lose',art);
 const portrait=()=>{if(!art||!sequence)throw Error('Original evaluation resource is unavailable');const key='op0'+String.fromCharCode((sequence[animation.index]+48)&255),sprite=art[key];if(!sprite)throw Error('Missing original evaluation portrait '+key);return sprite;};
 // 6508/6970 use AX returned by the button flash routine 1BAC0. Its timer
 // path is 1C42E -> 245D0 -> DS:407A: the undivided PIT callback counter.
 // Each sequence entry lasts 30 ticks of the original 0x2E9C PIT divisor.
 const animate=(delta:number)=>{if(!sequence||!art)return;const next=advanceOriginalEvaluationAnimation(animation,delta,index=>{const value=sequence[index];if(value===undefined)throw Error('Evaluation sequence needs retained adjacent memory');return value;});animation=next.state;if(next.changed){if(display)display.portrait(art.op01,portrait());else drawOriginalEvaluationPortrait(host.pixels,art.op01,portrait());host.present();}};
 const clearTop=()=>display?display.clearTop():drawOriginalMenuButton(host.pixels,host.font,null,0,0,320,100,15,8,7,0);
 const scores=()=>{if(display)display.scores();else drawOriginalHighScoreTable(host.pixels,host.font,host.smallFont,host.resources,state.trackName,Array.from(state.scores.file),state.scores.order,state.scores.selected);state.smallFontColor=state.scores.selected===6?4:0;};
 const reviewHost={
  scores,
  evaluation(){
   if(!selection||!evaluation||!art)throw Error('Original evaluation resources were not loaded');
   const keys=outcome===2?['ed4a']:selection.current.map((choice,i)=>'e'+selection.prefix+(i+1)+String.fromCharCode((choice+97)&255));
   state.retainedPromptDI=keys.length;
   const fragments=keys.map(key=>{const text=evaluation.resources[key];if(!text)throw Error('Missing original evaluation comment '+key);return text;});
   if(display)display.evaluation(art.op01,portrait(),fragments,state.smallFontColor??0);else drawOriginalEvaluationPanel(host.pixels,host.smallFont,art.op01,portrait(),fragments,state.smallFontColor??0);animation.drawnIndex=animation.index;
  },
  async continueEvaluation(){if(display){state.retainedPromptSI=await display.continueEvaluation(animate);return;}state.retainedPromptSI=await continueNativeEvaluation({...host,animate,onOutline:state.evaluationOutline});for(let y=174;y<198;y++)host.pixels.fill(7,y*320+8,y*320+312);},
  clearTop,release:host.release,
  async enterScore(classification:number){const candidate={time:eligibility.candidateTime,classification,carName:state.carName,opponentSelected:state.panel.opponentSelected,opponentCode:state.opponentCode,opponentCarCode:state.opponentCarCode};if(display){await display.enterScore(candidate,host.resources.einh);return;}await enterNativeHighScore({...host,drawTable:scores,save:async bytes=>{await host.files.writeScores(bytes);}},state.scores,candidate,host.resources.einh,4);},
  unavailable(){if(display){display.unavailable();return;}const bytes=host.resources.ehna,text=String.fromCharCode(...bytes).split('\0')[0],x=Math.trunc((320-measureOriginalFont(host.font,Array.from(text,c=>c.charCodeAt(0))))/2);drawOriginalOutlinedFont(host.pixels,host.font,text,x,50,15,0,Array.from({length:256},(_,i)=>(i*320)&65535));},
 };
 flags=await showNativeRaceReview(reviewHost,flags,outcome);
 return (display?display.endMenu:runNativeEndMenu)({...host,animate:delta=>{if(!flags.showEvaluation&&outcome!==2)animate(delta);},review:async before=>{clearTop();flags=await showNativeRaceReview(reviewHost,before,outcome);return flags;}},flags);
}
