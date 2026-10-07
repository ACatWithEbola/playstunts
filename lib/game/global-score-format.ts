import {createOriginalEmptyHighScores} from './high-score-empty.ts';

// New leaderboard generation, not a change to original physics or scoring.
export const GLOBAL_SCORE_RULES='ms-dec1990-global-reset-20261007';
export const GLOBAL_SCORE_DATABASE='stunts-global-highscores-reset-20261007';
export const GLOBAL_SCORE_ENDPOINT='/api/highscores';
export const MAX_RANKED_FRAMES=30000;
export type GlobalScoreSubmission={record:number[];replay:number[];continued:boolean;flags:number;rules:string};
export const scoreTicks=(record:ArrayLike<number>)=>record[50]|record[51]<<8;
export function scoreString(record:ArrayLike<number>,offset:number,end:number){
 let result='';for(let i=offset;i<end&&record[i];i++)result+=String.fromCharCode(record[i]);return result;
}
export async function scoreHash(bytes:Uint8Array){
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes)))).map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function canonicalScoreRecord(source:ReadonlyArray<number>,carName:string){
 const result=new Uint8Array(52),copy=(start:number,text:string,max:number)=>{Array.from(text.slice(0,max),c=>c.charCodeAt(0)&255).forEach((n,i)=>result[start+i]=n);};
 copy(0,scoreString(source,0,17),16);copy(17,carName,23);
 result[41]=source[41];copy(42,scoreString(source,42,50),7);result[50]=source[50];result[51]=source[51];return result;
}
export function sharedScoreFile(records:ReadonlyArray<ReadonlyArray<number>>){
 const file=createOriginalEmptyHighScores();records.slice(0,7).forEach((record,i)=>{if(record.length!==52)throw Error('Invalid shared score');file.set(record,i*52);});return file;
}
export function validateScoreSubmission(value:unknown):GlobalScoreSubmission{
 const v=value as Partial<GlobalScoreSubmission>;
 const bytes=(a:unknown,length?:number):a is number[]=>Array.isArray(a)&&(length===undefined||a.length===length)&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=255);
 if(!v||v.rules!==GLOBAL_SCORE_RULES||!bytes(v.record,52)||!bytes(v.replay)||v.replay.length<=0x722||v.replay.length>0x722+MAX_RANKED_FRAMES)throw Error('Invalid score submission');
 if(v.continued!==false||!Number.isInteger(v.flags)||v.flags!==1)throw Error('Replay continuation is not eligible');
 if(scoreTicks(v.record)<1||scoreTicks(v.record)>=30000||v.record[41]>1||!v.record.slice(0,17).includes(0))throw Error('Invalid score record');
 if(Array.from(scoreString(v.record,0,17),c=>c.charCodeAt(0)).some(n=>n<32||n===127))throw Error('Invalid driver name');
 return v as GlobalScoreSubmission;
}
