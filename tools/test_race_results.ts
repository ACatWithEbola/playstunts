import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runNativeRaceResults,type NativeRaceResultsState} from '../lib/game/native-race-results.ts';
import {advanceOriginalEvaluationAnimation} from '../lib/game/opponent-evaluation-animation.ts';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
import {continueNativeEvaluation} from '../lib/game/native-evaluation-continue.ts';

await test('opponent evaluation uses black text and the original 30 input-tick cadence',async()=>{
 const evaluationColours:number[]=[],portraits:ReadonlyArray<number>[]=[];
 const state={
  panel:{playerTime:100,opponentTime:120,penaltyTime:0,playerTicks:100,opponentTicks:120,timeAdjustment:0,speedSum:0,impactSpeed:0,topSpeed:0,jumps:0,flags:0,opponentSelected:1},
  track:new Uint8Array(1802),trackName:'DEFAULT',trackPath:'',scores:{file:new Uint8Array(364),order:[0,1,2,3,4,5,6],selected:0,name:'',retainedRecord:Array(52).fill(0)},
  choices:{current:[0,0,0],previous:[0,0,0]},raceCounter:0,retainedCandidateTime:0,carName:'COUN',opponentCode:'BERNIE',opponentCarCode:'COUN',smallFontColor:3,
 } satisfies NativeRaceResultsState;
 const frame1=[1],frame2=[2];
 await runNativeRaceResults({
  pixels:new Uint8Array(65536),font:new Uint8Array(65536),smallFont:new Uint8Array(65536),resources:{},
  present(){},async input(){return {key:0,x:0,y:0,mouseActive:false,buttons:0};},async release(){},async gameCounter(){return 0;},
  async enumerate(){return [];},async editPath(){return {path:'',key:0};},counter(){return 0;},
  files:{async readSavedTrack(){return null;},async readScores(){return null;},async insertTrackDisk(){return 0;},async writeScores(){return true;}},
  async evaluation(){return {resources:{winn:[1,2,0],ev1a:[65,0],ev2a:[66,0],ev3a:[67,0]},art:{win:{op01:frame1,op02:frame2}}};},
  randomWord(){return 0;},randomByte(){return 0;},
  async selectEvaluation(){return {current:[0,0,0],previous:[0,0,0],mode:'win' as const,sequence:'winn',prefix:'v'};},
  async prepareScores(){return {status:0,candidateTime:0};},
 },state,{
  panel(){return {outcome:1,evaluationAvailable:1};},async prepareEvaluation(){},portrait(_first,current){portraits.push(current);},clearTop(){},scores(){},
  evaluation(_first,_current,_fragments,colour){evaluationColours.push(colour);},async continueEvaluation(){return 13;},async enterScore(){},unavailable(){},
  async endMenu(host){
   host.animate(0);assert.deepEqual(portraits,[frame2],'the original initial phase of 30 advances immediately');
   host.animate(29);assert.deepEqual(portraits,[frame2],'29 fast ticks must not advance another entry');
   host.animate(1);assert.deepEqual(portraits,[frame2,frame1],'the 30th fast tick advances, without dividing by five');
   host.animate(29);assert.equal(portraits.length,2);
   host.animate(1);return 0;
  },
 });
 assert.deepEqual(evaluationColours,[0],'fresh result comments must not inherit FONTN cyan');
 assert.equal(state.smallFontColor,0);
 assert.deepEqual(portraits,[frame2,frame1,frame2]);
});

await test('portrait speed follows the original PIT at different browser refresh rates',()=>{
 // Source setup 2213D uses divisor 2E9C; source 650B/6973 compares to 1E.
 // The nominal PC clock therefore gives a 300.0045257 ms sequence step.
 assert.equal(ORIGINAL_PIT_DIVISOR,0x2e9c);
 const stepMilliseconds=30*ORIGINAL_PIT_DIVISOR*1000/PC_PIT_INPUT_HZ;
 assert.ok(Math.abs(stepMilliseconds-300.0045257135961)<1e-9);
 for(const refreshRate of [30,60,120,144]){
  let animation={phase:30,index:0,drawnIndex:0},previousTick=0,advances=0;
  for(let frame=0;frame<=refreshRate*3;frame++){
   const milliseconds=frame*1000/refreshRate,ticks=Math.floor(milliseconds*PC_PIT_INPUT_HZ/(ORIGINAL_PIT_DIVISOR*1000));
   const next=advanceOriginalEvaluationAnimation(animation,ticks-previousTick,()=>1);
   if(next.changed)advances++;
   animation=next.state;previousTick=ticks;
   assert.equal(advances,1+Math.floor(ticks/30),`${refreshRate} Hz frame ${frame}`);
  }
 }
});

await test('portrait stalls preserve original one-step polling and signed-word behavior',()=>{
 const sequence=[1,2,3,0],read=(index:number)=>sequence[index];
 const delayed=advanceOriginalEvaluationAnimation({phase:0,index:0,drawnIndex:0},90,read);
 assert.deepEqual(delayed.state,{phase:60,index:1,drawnIndex:1});
 const wrapped=advanceOriginalEvaluationAnimation({phase:29,index:2,drawnIndex:2},1,read);
 assert.deepEqual(wrapped.state,{phase:0,index:0,drawnIndex:0});
 const signed=advanceOriginalEvaluationAnimation({phase:0,index:0,drawnIndex:0},32768,read);
 assert.deepEqual(signed.state,{phase:32768,index:0,drawnIndex:0});
});

await test('evaluation Continue consumes only elapsed ticks, including across counter wrap',async()=>{
 for(const start of [50000,65520]){
  let now=start,poll=0;
  const deltas:number[]=[];
  await continueNativeEvaluation({pixels:new Uint8Array(65536),font:new Uint8Array(65536),resources:{},present(){},async release(){},counter(){return now;},animate(delta){deltas.push(delta);},drawing:{button(){},outline(){}},async input(){now+=[29,1,0][poll];return {key:++poll===3?13:0,x:0,y:0,mouseActive:false,buttons:0};}});
  assert.deepEqual(deltas,[0,29,1],'time before entering Continue must not be replayed as animation ticks');
 }
});

console.log('Race-results presentation regression checks passed.');
