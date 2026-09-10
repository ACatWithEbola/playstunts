import {i16,intSin,intCos,type Vector} from '../physics/math.ts';
/** Supplied 10372..1059D: update 24 wheel vertices, retaining unchanged axes. */
export function updateOriginalCarWheels(before:readonly Vector[],steering:number,suspension:readonly number[],cached:readonly number[],base:readonly Vector[],centers:readonly Vector[]){
 if(before.length!==24||base.length!==24||cached.length!==5||suspension.length!==4||centers.length!==2)throw Error('Invalid original wheel geometry state');
 const vertices=before.map(v=>[...v] as Vector),cache=cached.map(i16);steering=i16(steering);
 if(cache[4]!==steering){
  const half=i16(i16(steering-(steering<0?-1:0))>>1),sin=intSin(half),cos=intCos(half),mul=(a:number,b:number)=>(Math.imul(i16(a),i16(b))+8192)>>14;
  for(let i=0;i<12;i++){
   const center=centers[i<6?0:1];
   vertices[i][0]=i16(mul(base[i][2],sin)+center[0]+mul(base[i][0],cos));
   vertices[i][2]=i16(mul(base[i][0],sin)+center[2]+mul(base[i][2],cos));
  }
  cache[4]=steering;
 }
 for(let wheel=0;wheel<4;wheel++){
  const displacement=i16(suspension[wheel]),sign=displacement<0?-1:0;
  const height=i16((i16(i16((displacement^sign)-sign)>>6)^sign)-sign);
  if(cache[wheel]===height)continue;
  for(let i=wheel*6;i<wheel*6+6;i++)vertices[i][1]=i16(base[i][1]-height);
  cache[wheel]=height;
 }
 return {vertices,cache};
}
