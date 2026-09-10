/** Original 0x1304b..0x13152, after the record vector has been rotated. */
export function routePlacement(vector:number[],column:number,row:number,terrain:number,multiTile:number){
 // Wide tiles at column29 read the adjacent original table word,1.
 // The editor rejects placement there; existing track bytes retain this quirk.
 const x=multiTile&2?(column===29?1:(column+1)*1024):column*1024+512;
 const i16=(n:number)=>(n<<16)>>16;
 return {position:[i16(vector[0]+x),i16(vector[1]+(terrain===6?450:0)),i16(vector[2]+(29-row)*1024+(multiTile&1?0:512))],cell:(29-row)*30+column};
}
