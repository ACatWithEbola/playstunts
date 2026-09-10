/** Original 0xabd4..0xac70, before rotating the two local vectors. */
export function routePointPair(primary:number[][],alternate:number[][]|null,index:number,reverse:number){
 const vectors=reverse&&alternate?alternate:primary;
 const at=index&255;
 const first=reverse&&!alternate?at+1:at,second=reverse&&!alternate?at:at+1;
 return {first:[...vectors[first]],second:[...vectors[second]],alternate:alternate?1:0};
}
