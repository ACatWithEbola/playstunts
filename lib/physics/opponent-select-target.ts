import {i16,vecTransform,type Vector} from './math.ts';
/** Original 0x6fda..0x6fee / 0x7048..0x7207, after route lookup. */
export function opponentSelectTarget(midpoint:Vector,first:Vector,second:Vector,position:Vector,player:Vector,matrix:number[],mode:number,playerCrash:number,previousAvoidance=0){
 const direct=()=>({target:[...midpoint] as Vector,avoidance:previousAvoidance});
 if((mode&255)===2)return direct();
 const local=vecTransform(player.map((v,i)=>i16(v-position[i])) as Vector,matrix);
 const absX=i16(local[0]<0?-local[0]:local[0]);
 if(local[1]>90||absX>180||local[2]>600||local[2]<-180)return direct();
 const relative=player.map((v,i)=>i===1&&midpoint[1]===-1?0:i16(v-midpoint[i])) as Vector;
 const side=vecTransform(relative,matrix)[0]<0?2:1;
 const endpoint=side===2?second:first;
 const target=midpoint.map((v,i)=>i===1&&v===-1?-1:Math.trunc((v+endpoint[i])/2)||0) as Vector;
 return {target,avoidance:local[2]>-78&&!(playerCrash&255)?side:previousAvoidance};
}
