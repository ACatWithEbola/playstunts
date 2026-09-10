/** Original0x131ef jump table. Coordinates are bytes in reversed terrain-row order. */
const exits=[[0,-1,0],[0,1,512],[1,0,256],[-1,0,768],[1,-1,0],[-1,1,768],[1,1,256],[2,0,256],[2,1,256],[1,1,512],[0,2,512],[1,2,512]];
export function routeExit(code:number,column:number,row:number,heading:number){
 const exit=exits[(code&255)-1];
 return exit?{column:(column+exit[0])&255,row:(row+exit[1])&255,heading:exit[2]}:{column,row,heading};
}
