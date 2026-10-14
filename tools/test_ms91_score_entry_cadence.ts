import assert from 'node:assert/strict';
import {enterNativeHighScoreWithPresentation,type NativeHighScoreCandidate} from '../lib/game/native-high-score-runtime.ts';
import {createOriginalEmptyHighScores} from '../lib/game/high-score-empty.ts';
let cases=0;
for(const physicsEngine of [undefined,'ms-1990','ms-1991'] as const)
for(const framesPerSecond of [10,20] as const)
for(const time of [0,1,650,32767,32768,65534,65535]){
 const candidate:NativeHighScoreCandidate={time,physicsEngine,framesPerSecond,classification:0,carName:'INDY',opponentSelected:0,opponentCode:'',opponentCarCode:''};
 const before={...candidate},state={file:createOriginalEmptyHighScores(),order:[0,1,2,3,4,5,6],selected:255,name:'MARCO',retainedRecord:Array(52).fill(0x7d)};
 let saved:Uint8Array|undefined;
 const result=await enterNativeHighScoreWithPresentation({drawTable(){},present(){},async editName(name){return name;},async save(bytes){saved=bytes.slice();}},state,candidate,[],4);
 const expected=physicsEngine==='ms-1991'&&framesPerSecond===10?(time<<1)&65535:time;
 assert.equal(result,expected<65535);
 if(result){assert.ok(saved);assert.equal(saved[50]|saved[51]<<8,expected);}
 else assert.equal(saved,undefined);
 assert.deepEqual(candidate,before);cases++;
}
// Scaling must happen before qualification, not merely before writing bytes.
const file=createOriginalEmptyHighScores();for(let n=0;n<7;n++){file[n*52+50]=1000&255;file[n*52+51]=1000>>>8;}
let writes=0;
assert.equal(await enterNativeHighScoreWithPresentation({drawTable(){},present(){},async editName(){throw Error('Must not prompt');},async save(){writes++;}},
 {file,order:[0,1,2,3,4,5,6],selected:255,name:'',retainedRecord:Array(52).fill(0)},
 {time:650,physicsEngine:'ms-1991',framesPerSecond:10,classification:0,carName:'INDY',opponentSelected:0,opponentCode:'',opponentCarCode:''},[],4),false);
assert.equal(writes,0);
console.log(JSON.stringify({entryCases:cases+1,modern10HzCanonicalizedBeforeQualification:true,wordWrapVerified:true,legacyAnd20HzUnchanged:true,callerCandidateUnchanged:true,pass:true}));
