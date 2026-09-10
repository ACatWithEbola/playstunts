import type {OriginalEndMenuState} from './end-menu-input.ts';
export interface NativeRaceReviewHost {
 scores():void;
 evaluation():void;
 continueEvaluation():Promise<void>;
 clearTop():void;
 release():Promise<void>;
 enterScore(classification:number):Promise<void>;
 unavailable():void;
}
/** Original6179..6738. showEvaluation names the offered button: it is1
 * while high scores are displayed, and0 while the evaluation is displayed. */
export async function showNativeRaceReview(host:NativeRaceReviewHost,before:Omit<OriginalEndMenuState,'selected'>,outcome:number){
 const state={...before,evaluationStatus:before.evaluationStatus&255};
 if(state.evaluationAvailable&&state.evaluationStatus===2){state.evaluationStatus=0;host.scores();state.showEvaluation=1;return state;}
 if(state.evaluationAvailable){
  host.evaluation();state.showEvaluation=0;
  if((state.evaluationStatus<<24>>24)>0){state.evaluationStatus=0;state.showEvaluation=1;await host.continueEvaluation();host.clearTop();await host.enterScore(outcome<<24>>24);}
  return state;
 }
 if((state.evaluationStatus<<24>>24)>0){await host.release();await host.enterScore(0);state.evaluationStatus=0;}
 else if(state.evaluationStatus===255)host.unavailable();
 else host.scores();
 return state;
}
