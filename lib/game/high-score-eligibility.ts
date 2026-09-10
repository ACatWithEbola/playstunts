/** Supplied60db..6116 checks only the first901 bytes: the track pieces and
 * horizon. It does not compare the following terrain bytes. */
export function originalHighScoreTrackMatches(current:Uint8Array,saved:Uint8Array|null){
 if(saved===null)return false;
 if(current.length<901||saved.length<901)throw Error('Original track comparison needs901 bytes');
 for(let i=0;i<901;i++)if(current[i]!==saved[i])return false;
 return true;
}
/** Supplied613d..616b. Status0 permits viewing scores,1 requests entry,
 * and255 suppresses scores. Replay/continuation flags prevent a new entry. */
export function originalHighScoreEligibility(status:number,finishTime:number,flags:number,lastTime:number,retainedTime:number){
 status&=255;finishTime&=65535;lastTime&=65535;let candidateTime=retainedTime&65535;
 if(status===0&&finishTime!==0){candidateTime=finishTime;if(!(flags&6)&&lastTime>finishTime)status=1;}
 return {status,candidateTime};
}
