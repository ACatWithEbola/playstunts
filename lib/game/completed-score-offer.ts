import {prepareOriginalHighScoreRecord,nameOriginalHighScoreRecord} from './high-score-record.ts';
import {GLOBAL_SCORE_RULES,type GlobalScoreSubmission} from './global-score-format.ts';
import type {GlobalScoreContext} from './global-score-file-store.ts';
export type CompletedScoreOffer={track:string;car?:string;ticks:number;submit(name:string):Promise<string>};
/** Snapshot any eligible finish without altering the original local table. */
export async function completedScoreProof(context:GlobalScoreContext,localStatus:number):Promise<GlobalScoreSubmission|undefined>{
 const {state,runtime,history}=context;
 if(state.panel.flags!==1||!state.panel.playerTime||!history||history.continued)return;
 const record=prepareOriginalHighScoreRecord(Array(52).fill(0),{time:state.panel.playerTime,classification:state.panel.opponentSelected&&state.panel.opponentTime&&state.panel.opponentTime<state.panel.playerTime?1:0,carName:state.carName,opponentSelected:state.panel.opponentSelected,opponentCode:state.opponentCode,opponentCarCode:state.opponentCarCode});
 const inputs=Uint8Array.from(history.inputs);let proof:GlobalScoreSubmission|undefined;
 await runtime.session.saveReplay(async replay=>{const complete=new Uint8Array(0x722+inputs.length);complete.set(replay.slice(0,0x722));complete.set(inputs,0x722);new DataView(complete.buffer).setUint16(22,inputs.length,true);proof={record:Array.from(record),replay:Array.from(complete),continued:false,flags:1,rules:GLOBAL_SCORE_RULES};return 0;});
 return proof;
}
export function namedCompletedScore(proof:GlobalScoreSubmission,name:string):GlobalScoreSubmission{
 if(!name.trim()||name.length>16||Array.from(name).some(c=>c.charCodeAt(0)<32||c.charCodeAt(0)>126))throw Error('Enter a name using up to 16 basic characters.');
 return {...proof,record:Array.from(nameOriginalHighScoreRecord(proof.record,name))};
}
