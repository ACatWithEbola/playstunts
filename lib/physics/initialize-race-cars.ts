import {initializePlayerRace} from './initialize-player-race.ts';
import {initializeOpponent} from './initialize-opponent.ts';
export interface InitialRoutePoint {midpoint:number[];first:number[];second:number[];alternate:number;side?:number}
export interface RaceCarsSetup {column:number;row:number;angle:number;hill:0|1;transmission:number;mode:number;opponentSelected:number;opponentPath:readonly number[]}
/** Original 91c8..9572, including initial route targets and particle-active reset. */
export function initializeRaceCars(before:Uint8Array,playerTuning:Uint8Array,opponentTuning:Uint8Array,setup:RaceCarsSetup,lookup:(entry:number,point:number,opponent:boolean)=>InitialRoutePoint){
 if(before.length!==65536)throw Error('Expected the complete original data segment');
 const out=before.slice(),v=new DataView(out.buffer,out.byteOffset,out.byteLength);
 const {column,row,angle,hill,transmission,mode,opponentSelected,opponentPath}=setup;
 out.set(initializePlayerRace(out.subarray(0x8c06,0x8f15),playerTuning,transmission,column,row,angle,hill),0x8c06);
 const target=(address:number,result:InitialRoutePoint)=>{[...result.midpoint,...result.first,...result.second,result.alternate].forEach((n,i)=>v.setInt16(address+i*2,n,true));};
 if((mode&65535)!==65534){const point=out[0x8cee];out[0x8cee]=(point+1)&255;target(0x8cc4,lookup(v.getUint16(0x8c82,true),point,false));}
 out.set(initializeOpponent(out.subarray(0x8cf0,0x8da8),opponentTuning,column,row,angle,hill),0x8cf0);
 if((opponentSelected&255)&&(mode&65535)!==65534){
  const point=out[0x8da6];out[0x8da6]=(point+1)&255;const entry=opponentPath[v.getUint16(0x8d3a,true)];
  if(entry===undefined)throw Error('Missing original opponent path entry');
  const result=lookup(entry,point,true);target(0x8d7c,result);
  if(result.side===undefined)throw Error('Missing original opponent route side output');
  out[0x8eaf]=result.side;
 }
 out[0x8ee0]=0;
 return out;
}
