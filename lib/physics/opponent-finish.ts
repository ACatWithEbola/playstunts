/** Supplied event 3, car 1 through 0xb3b2..0xb55a. Words map DS8c22..8c37. */
export function opponentFinish(status:number,raceWords:number[],savedRaceWords:number[],timeAdjustment:number,flags:number){
 const race=[...raceWords],saved=[...savedRaceWords];
 if(status&255)return {status:status&255,raceWords:race,savedRaceWords:saved};
 race[4]=(race[2]+timeAdjustment)&65535;
 race[6]=race[2];
 return {status:3,raceWords:race,savedRaceWords:flags&4?saved:[...race]};
}
