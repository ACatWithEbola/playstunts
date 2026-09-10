/** Original16275..162ed: decide which retained resources must be refreshed
 * after reading a replay and analyzing its track. Colour/transmission changes
 * alone do not reload the car resources. */
export function originalReplayLoadResources(before:ArrayLike<number>,after:ArrayLike<number>,oldHorizon:number,newHorizon:number){
 let changed=false;
 for(let i=0;i<4;i++)if(before[i]!==after[i])changed=true;
 if(before[6]!==after[6])changed=true;
 if(after[6])for(let i=7;i<11;i++)if(before[i]!==after[i])changed=true;
 return {reloadCarResources:oldHorizon!==newHorizon||changed,refreshOpponent:!changed&&after[6]!==0};
}
