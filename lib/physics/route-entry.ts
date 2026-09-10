/** Original0x12924..0x12a46. Rows use the original reversed terrain order. */
export function routeEntry(tile:number,heading:number,column:number,row:number){
 const direction=[0,256,512,768].indexOf(heading);
 if(direction<0)throw Error('Route traversal requires a cardinal heading');
 const codes=tile===253?[12,0,0,9]:tile===254?[11,6,0,7]:tile===255?[10,0,5,8]:[2,4,1,3];
 return {column:(column-(tile===253||tile===255?1:0))&255,row:(row-(tile===253||tile===254?1:0))&255,entry:codes[direction]};
}
