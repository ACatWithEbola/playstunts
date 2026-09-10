export interface OriginalEvaluationChoices {current:[number,number,number];previous:[number,number,number]}
/** Original5eff..605b. The middle phrase's first random selection is later
 * overwritten by another random byte plus the race counter. The initial
 * random calls still happen and must not be optimized away. */
export function selectOriginalEvaluationWords(before:OriginalEvaluationChoices,flags:number,outcome:number,playerTime:number,randomWord:()=>number){
 const current=[...before.current] as [number,number,number];let previous=[...before.previous] as [number,number,number];
 const signed=(value:number)=>value<<16>>16;
 const avoid=(value:number,prior:number,table:Record<number,number>)=>{if((value&65535)!==(prior&65535))return value&65535;return table[value];};
 if(!(flags&4)){
  previous=[...current];
  // Include the preceding source words: abs(-32768) remains negative in
  // the original random-word routine, so its remainder can index before0.
  const three={[-2]:0,[-1]:6,0:2,1:0,2:1};
  current[0]=avoid(signed(randomWord())%3,previous[0],three);
  current[2]=avoid(signed(randomWord())%3,previous[2],three);
  const value=signed(randomWord())%(outcome===1?2:4)+(outcome===1&&(playerTime&65535)!==0?2:0);
  current[1]=avoid(value,previous[1],{[-3]:2,[-2]:0,[-1]:1,0:1,1:0,2:3,3:2});
 }
 return {current,previous};
}
export function selectOriginalEvaluation(before:OriginalEvaluationChoices,flags:number,outcome:number,playerTime:number,raceCounter:number,randomWord:()=>number,randomByte:()=>number){
 const {current,previous}=selectOriginalEvaluationWords(before,flags,outcome,playerTime,randomWord);
 const random=(randomByte()+raceCounter)&65535;
 current[1]=outcome===1?(random&1)+((playerTime&65535)!==0?2:0):random&3;
 return {current,previous,mode:outcome===1?'win':'lose',sequence:outcome===1?'winn':'lose',prefix:outcome===1?'v':'d'};
}
