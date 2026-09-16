import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runNativeRaceResults,type NativeRaceResultsState} from '../lib/game/native-race-results.ts';

await test('opponent evaluation uses black text and the divided game clock',async()=>{
 const animationTicks=[100,101,129,130];
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
  async enumerate(){return [];},async editPath(){return {path:'',key:0};},counter(){return 0;},animationCounter(){return animationTicks.shift()??130;},
  files:{async readSavedTrack(){return null;},async readScores(){return null;},async insertTrackDisk(){return 0;},async writeScores(){return true;}},
  async evaluation(){return {resources:{winn:[1,2,0],ev1a:[65,0],ev2a:[66,0],ev3a:[67,0]},art:{win:{op01:frame1,op02:frame2}}};},
  randomWord(){return 0;},randomByte(){return 0;},
  async selectEvaluation(){return {current:[0,0,0],previous:[0,0,0],mode:'win' as const,sequence:'winn',prefix:'v'};},
  async prepareScores(){return {status:0,candidateTime:0};},
 },state,{
  panel(){return {outcome:1,evaluationAvailable:1};},async prepareEvaluation(){},portrait(_first,current){portraits.push(current);},clearTop(){},scores(){},
  evaluation(_first,_current,_fragments,colour){evaluationColours.push(colour);},async continueEvaluation(){return 13;},async enterScore(){},unavailable(){},
  async endMenu(host){host.animate(500);host.animate(500);host.animate(500);return 0;},
 });
 assert.deepEqual(evaluationColours,[0],'fresh result comments must not inherit FONTN cyan');
 assert.equal(state.smallFontColor,0);
 assert.deepEqual(portraits,[frame2,frame1],'30 divided game ticks advance two sequence entries regardless of input-clock deltas');
});

console.log('Race-results presentation regression checks passed.');
