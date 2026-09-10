import {i16} from './math.ts';
/** Original initializer 0x8f7c..0x8ff9: current height starts 512 fixed units above previous. */
export function initialCarPose(position:number[],heading:number){
 const [x,y,z]=position.map(v=>v|0);
 return {position:[x,(y+512)|0,z],previous:[x,y,z],rotation:[i16(heading),0,0]};
}
