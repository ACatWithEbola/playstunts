/** Supplied 0x1364a..0x1384b: depth-first weighted route selection. */
export function opponentPath(primary:number[],alternate:number[],tiles:number[],weights:number[]){
 let bestCost=999999,best:number[]|null=null;
 const pending=[{entry:0,path:[] as number[],cost:0}];
 while(pending.length){
  let {entry,path,cost}=pending.pop()!;
  for(;;){
   const next=primary[entry]&65535;
   const terminal=next===0||next===65535||path.includes(entry);
   const valid=next===0;
   const weight=weights[tiles[entry]];
   if(weight===undefined)throw Error('Opponent path cost requires the original resource and adjacent memory bytes');
   path=[...path,entry];cost=(cost+(weight&255)+1)>>>0;
   if(terminal){if(valid&&cost<bestCost){bestCost=cost;best=[...path,0,0,1];}break;}
   if((alternate[entry]&65535)!==65535)pending.push({entry:alternate[entry]&65535,path,cost});
   entry=next;
  }
 }
 return best;
}
