export interface PlayerRouteProgress {status:number;confirmations:number;route:number;lastRoute:number;laps:number;lastPenalty:number;penaltyDisplay:number;totalPenalty:number}
/** Original 98fa..99de, after route lookup. Delta is the original signed lookup
 * result, not a distance inferred from rendered geometry. Status 1 suspends
 * route acceptance; status 2 records the reverse adjacency branch.
 */
export function playerRouteProgress(before:PlayerRouteProgress,changed:boolean,route:number,delta:number,primary:readonly number[],alternate:readonly number[]):PlayerRouteProgress{
 const s={...before};if(!changed)return s;
 route&=65535;delta=delta<<16>>16;
 if(delta===-2){s.status=1;s.confirmations=0;}
 else if(s.status===1){s.status=0;s.confirmations=0;}
 if(s.status===0){
  let commit=false;
  if(route===0&&s.lastRoute!==0){s.laps=(s.laps+1)&255;commit=true;}
  else if(delta>=0&&delta<3){s.confirmations=0;s.route=route;}
  else if(delta===-1||delta>3){
   const adjacent=(from:number,to:number)=>{
    if(primary[from]===undefined||alternate[from]===undefined)throw Error('Missing original player route adjacency');
    return primary[from]===to||alternate[from]===to;
   };
   if(adjacent(s.lastRoute,route))s.confirmations=(s.confirmations+1)&255;
   else {if(adjacent(route,s.lastRoute))s.status=2;s.confirmations=1;}
   if((s.confirmations<<24>>24)>=3)commit=true;
  }
  if(commit){
   s.route=route;s.confirmations=0;
   if(delta>0){s.lastPenalty=(60*delta)&65535;s.penaltyDisplay=80;s.totalPenalty=(s.totalPenalty+s.lastPenalty)&65535;}
  }
 }
 s.lastRoute=route;return s;
}
