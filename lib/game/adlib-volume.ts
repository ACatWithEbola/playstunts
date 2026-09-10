/** Original AD15.DRV operator-level writes at 0x6e2. */
export function adlibVolume(instrument:number[],channel:number,volume:number,velocity:number):number[][]{
 const operators=[0,1,2,8,9,10,16,17,18];
 if(!Number.isInteger(channel)||channel<0||channel>8)throw Error('Invalid AdLib melodic channel');
 const scaled=(level:number)=>{
  const product=(((volume&255)*(velocity&255))>>>6)+1;
  const gain=(product>>>1)&255;
  const amount=((((gain*((63-level)&255))>>>6)+1)>>>1)&63;
  return 63-amount;
 };
 return [[0x40+operators[channel],((instrument[0x4b]<<6)|(instrument[0x44]===1?scaled(instrument[0x4a]):instrument[0x4a]))&255],[0x43+operators[channel],((instrument[0x57]<<6)|scaled(instrument[0x56]))&255]];
}
