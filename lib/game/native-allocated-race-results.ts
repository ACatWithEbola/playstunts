import {writeOriginalEvaluationOutlineScratch} from './evaluation-outline-scratch.ts';
import {originalRaceAverageSpeed} from './race-result-statistics.ts';
import {writeOriginalRaceResultTimeScratch} from './race-result-time-scratch.ts';
import {writeOriginalHighScorePromptFrame} from './high-score-prompt-frame.ts';
import {enterAllocatedResultsResources,loadAllocatedEvaluationResources,releaseAllocatedResultsResources} from './allocated-results-resources.ts';
import {prepareAllocatedHighScores} from './allocated-high-score-preparation.ts';
import {readOriginalRaceResultMemory} from './race-result-memory.ts';
import {originalRandomWord,originalRandomByte} from './original-random.ts';
import {selectOriginalEvaluationWords} from './opponent-evaluation-selection.ts';
import type {NativeRaceResultsHost,NativeRaceResultsState} from './native-race-results.ts';
import type {NativeHighScorePreparationHost} from './native-high-score-preparation.ts';
import type {NativeDemoData} from './native-demo-runtime.ts';
export interface AllocatedResultsRuntime {trackAddress:number;session:{state:{memory:Uint8Array};originalMemory:{writeMemory(memory:Uint8Array):void}}}
export interface AllocatedRaceResultsServices {
 progress(stage:number):void;
 readFile(name:string):Promise<Uint8Array|null>;
 writeFile(name:string,bytes:Uint8Array):Promise<number>;
 insertTrackDisk():Promise<number>;
 present(state:NativeRaceResultsState,services:Pick<NativeRaceResultsHost,'randomWord'|'randomByte'|'selectEvaluation'|'prepareScores'>&{files:NativeHighScorePreparationHost}):Promise<number>;
}
/** Results owned by the completed allocated race, before its saved menu state
 * is released. Browser drawing/input remains in the original native result UI. */
export async function runAllocatedRaceResults(data:NativeDemoData,runtime:AllocatedResultsRuntime,services:AllocatedRaceResultsServices){
 const d=0x2d1a0,bp=0xeefe,memory=()=>runtime.session.state.memory;
 const view=()=>{const m=memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);};
 const word=(at:number)=>view().getUint16(d+(at&65535),true),set=(at:number,n:number)=>view().setUint16(d+(at&65535),n&65535,true);
 const string=(at:number)=>{let text='';for(let i=0;i<65536;i++){const byte=memory()[d+((at+i)&65535)];if(!byte)return text;text+=String.fromCharCode(byte);}throw Error('Unterminated original results string');};
 const writeString=(at:number,text:string)=>memory().set(Uint8Array.from(Array.from(text).map(char=>char.charCodeAt(0)&255).concat(0)),d+at);
 const smallFontAddress=()=>word(0x9336)+word(0x9338)*16;
 const scoreAddress=()=>word(0x92fc)+word(0x92fe)*16;
 const choices=()=>({current:[word(0x53fa),word(0x53fc),word(0x53fe)] as [number,number,number],previous:[word(0x53f4),word(0x53f6),word(0x53f8)] as [number,number,number]});
 const storeChoices=(value:NativeRaceResultsState['choices'])=>{value.current.forEach((n,i)=>set(0x53fa+i*2,n));value.previous.forEach((n,i)=>set(0x53f4+i*2,n));};
 const writeMemory=(next:Uint8Array)=>runtime.session.originalMemory.writeMemory(next);
 const resourcesHost={memory,writeMemory,progress:services.progress,async readFile(at:number){return data.catalog.read(string(at));},async exists(at:number){return data.catalog.exists(string(at));},async retry(){throw Error('Original results resource is unavailable');}};
 const resources=await enterAllocatedResultsResources(resourcesHost,d,bp);
 let evaluation:Awaited<ReturnType<typeof loadAllocatedEvaluationResources>>|undefined;
 // Main caller 2B2D..2B42 leaves SI=1802; returning race/resource helpers
 // preserve it. Opponent Continue overwrites SI at660C before name entry.
 const state:NativeRaceResultsState={retainedPromptSI:1802,retainedPromptDI:901,evaluationOutline:(delta,colour)=>writeOriginalEvaluationOutlineScratch(memory(),d,bp,delta,colour),...readOriginalRaceResultMemory(memory(),d),track:memory().slice(runtime.trackAddress,runtime.trackAddress+1802),trackName:string(0x8fcf),trackPath:string(0x98),choices:choices(),smallFontColor:memory()[smallFontAddress()],retainedCandidateTime:word(bp-0x88),carName:string(0x8a12),opponentCode:string(0xaa74),opponentCarCode:string(0x8019),scores:{file:memory().subarray(scoreAddress(),scoreAddress()+364),order:Array.from({length:7},(_,i)=>word(0xa780+i*2)),selected:memory()[d+0x8fea],name:string(0x9ff2),
  // Preserve the live native caller's unused bytes, never a fixture or a
  // cleared replacement. Exact nested-source stack padding remains audited
  // separately from the verified globals and allocated resource buffers.
  prepareRetainedRecord(){writeOriginalHighScorePromptFrame(memory(),d,bp,resources.misc,{di:state.retainedPromptDI,si:state.retainedPromptSI});},
  get retainedRecord(){return Array.from(memory().subarray(d+bp-0xe6,d+bp-0xe6+52));},
  set retainedRecord(record:ReadonlyArray<number>){if(record.length!==52)throw Error('Original high-score local requires52 bytes');memory().set(record,d+bp-0xe6);},
 }};
 writeOriginalRaceResultTimeScratch(memory(),d,bp,state.panel);
 const scoreHost={memory,writeMemory,readFile:(at:number)=>services.readFile(string(at)),writeFile:(at:number,bytes:Uint8Array)=>services.writeFile(string(at),bytes),insertTrackDisk:services.insertTrackDisk};
 const files:NativeHighScorePreparationHost={readSavedTrack:async()=>{throw Error('Allocated score preparation owns the saved-track load');},readScores:async()=>{throw Error('Allocated score preparation owns the score read');},insertTrackDisk:services.insertTrackDisk,writeScores:async bytes=>(await services.writeFile(string(0x937a),bytes))===0};
 try{
  const result=await services.present(state,{files,randomWord:()=>originalRandomWord(memory(),d),randomByte:()=>originalRandomByte(memory(),d),
   async selectEvaluation(current,outcome){
    storeChoices(selectOriginalEvaluationWords(current.choices,current.panel.flags,outcome,current.panel.playerTime,()=>originalRandomWord(memory(),d)));
    evaluation=await loadAllocatedEvaluationResources(resourcesHost,d,bp,outcome);
    return {...choices(),mode:outcome===1?'win':'lose',sequence:outcome===1?'winn':'lose',prefix:outcome===1?'v':'d'};
   },
   async prepareScores(current){
    const eligibility=await prepareAllocatedHighScores(scoreHost,d,bp,originalRaceAverageSpeed(current.panel.playerTicks,current.panel.timeAdjustment,current.panel.speedSum));
    current.scores.file=memory().subarray(scoreAddress(),scoreAddress()+364);current.scores.order=Array.from({length:7},(_,i)=>word(0xa780+i*2));current.scores.selected=memory()[d+0x8fea];return eligibility;
   },
  });
  if(state.smallFontColor!==undefined)view().setUint16(smallFontAddress(),state.smallFontColor,true);
  storeChoices(state.choices);state.scores.order.forEach((n,i)=>set(0xa780+i*2,n));memory()[d+0x8fea]=state.scores.selected;writeString(0x9ff2,state.scores.name);
  return result;
 }finally{releaseAllocatedResultsResources(resourcesHost,d,resources,evaluation?.bitmap);}
}
