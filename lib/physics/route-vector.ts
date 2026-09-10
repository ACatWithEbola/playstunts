/** Original 0x12f02..0x12fd2: select the preceding record's vector and rotate it. */
export function routeVector(vectors:number[][],direction:number,rotation:number):number[]{
 const [x,y,z]=vectors[direction?1:0];
 const neg=(n:number)=>(-n<<16)>>16;
 if(rotation===256)return [z,y,neg(x)];
 if(rotation===512)return [neg(x),y,neg(z)];
 if(rotation===768)return [neg(z),y,x];
 return [x,y,z];
}
