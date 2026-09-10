import {i16,type Vector} from './math.ts';
import type {TrackObject} from './track.ts';
// Original point arrays at DS2eb6..2f27, selected by 1212e..124dd.
const patterns:Readonly<Record<number,readonly Vector[]>>={
 11:[[0,0,0]],18:[[-120,0,-281],[-120,0,-231],[-120,0,281],[-120,0,231],[120,0,-281],[120,0,-231],[120,0,281],[120,0,231]],
 32:[[-392,0,0],[-632,0,0]],33:[[392,0,0],[632,0,0]],
 34:[[23,0,-255],[97,0,-255],[-97,0,255],[-23,0,255]],35:[[-60,0,-512],[60,0,512]],
};
/** Original small-object contact points for a tile, including continuation origins.
 * row is the reverse-indexed original terrain row. Unsupported memory outside
 * the supplied map/descriptor arrays is not synthesized.
 */
export function trackCollisionPoints(raw:readonly number[],objects:readonly TrackObject[],column:number,row:number,hillHeight:number):Vector[]{
 const tile=(x:number,r:number)=>{
  if(x<0||x>=30||r<0||r>=30)throw Error('Original collision point lookup requires outside-map memory');
  const value=raw[(29-r)*30+x];if(value===undefined)throw Error('Missing original collision tile');return value;
 };
 let id=tile(column,row);if(id===0)return [];
 let x=column*1024+512,z=(29-row)*1024+512;
 const descriptor=(n:number)=>{const result=objects[n];if(!result)throw Error('Missing original collision descriptor');return result;};
 if(id>=253){
  const continuation=id;
  id=tile(column-(continuation===254?0:1),row-(continuation===255?0:1));
  const flags=descriptor(id).multiTile;
  if(flags&1)z=(continuation===255?29-row:28-row)*1024;
  if(flags&2)x=(continuation===254?column+1:column)*1024;
 }else{
  const flags=descriptor(id).multiTile;
  if(flags&1)z=(29-row)*1024;
  if(flags&2)x=(column+1)*1024;
 }
 const object=descriptor(id),pattern=patterns[object.physics]??(object.physics>=71&&object.physics<=74?patterns[11]:undefined);
 if(!pattern)return [];
 const terrain=raw[901+row*30+column];if(terrain===undefined)throw Error('Missing original collision terrain');
 const height=terrain===6?hillHeight:0;
 return pattern.map(([px,py,pz])=>{
  let dx=px,dz=pz;
  if(object.rotation===256){dx=pz;dz=-px;}
  else if(object.rotation===512){dx=-px;dz=-pz;}
  else if(object.rotation===768){dx=-pz;dz=px;}
  else if(object.rotation!==0)throw Error('Original collision point rotation is unsupported');
  return [i16(x+dx),i16(height+py),i16(z+dz)];
 });
}
