import {startHeading} from './start-heading.ts';
/** Original start-scan phase only; later route validation is separate. */
export function scanStart(raw:number[],onErrorLocation?:(location:number[])=>void){
 const track=raw.slice(0,900);let heading=-1,start=[0,0,0],found=false;
 for(let row=0;row<30;row++)for(let column=0;column<30;column++){
  const index=(29-row)*30+column;let tile=track[index];
  if(tile>=253)tile=0;
  if(tile>=182){tile=4;track[index]=4;}
  const next=startHeading(tile);if(next===null)continue;
  heading=next;
  if(found){onErrorLocation?.([column,row]);return {error:3,start,heading,track};}
  start=[column,raw[901+row*30+column]===6?1:0,row];found=true;
 }
 if(!found)onErrorLocation?.([29,29]);
 return {error:found?0:1,start,heading,track};
}
