export interface OriginalRaceResultStatistics {opponentSelected:number;outcome:number;playerTicks:number;opponentTicks:number;timeAdjustment:number;speedSum:number;impactSpeed:number;topSpeed:number;jumps:number;y:number}
/** Original5C99..5CC6 leaves this unsigned quotient in DI. */
export function originalRaceAverageSpeed(playerTicks:number,timeAdjustment:number,speedSum:number){
 const duration=(playerTicks+timeAdjustment)&65535;return duration?(Math.floor((speedSum>>>0)/duration)>>>8)&65535:0;
}
/** Original5c60..5ef5 statistics and evaluation eligibility. */
export function originalRaceResultStatistics(state:OriginalRaceResultStatistics,resources:Record<string,ReadonlyArray<number>>){
 const text=(key:string)=>{const bytes=resources[key];if(!bytes)throw Error('Missing original result text '+key);const end=bytes.indexOf(0);return String.fromCharCode(...(end<0?bytes:bytes.slice(0,end)));};
 const field=(n:number)=>String(n<<16>>16).slice(-3).padStart(3,' ');
 const average=originalRaceAverageSpeed(state.playerTicks,state.timeAdjustment,state.speedSum),lines=[text('eavs')+field(average)+text('emph')];
 if(state.impactSpeed&65535)lines.push(text('eimp')+field((state.impactSpeed&65535)>>>8)+text('emph'));
 lines.push(text('etop')+field((state.topSpeed&65535)>>>8)+text('emph'));
 if(state.jumps&65535)lines.push(text('ejum')+field(state.jumps));
 const available=(state.outcome&255)===2&&(state.playerTicks&65535)!==(state.opponentTicks&65535)?0:state.opponentSelected&255;
 return {evaluationAvailable:available,lines:lines.map((text,index)=>({text,y:(state.y+index*10)&65535}))};
}
