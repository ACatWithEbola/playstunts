import type {Vector} from '../physics/math.ts';
/** Original CF36..D002, offsets DS:0890..08b3. The loaded shape at DS:7820
 * matches GAME2.high exactly. These are separate grass tiles beneath a road,
 * submitted in this original order, not road geometry or height changes.
 */
export function elevatedRoadUnderlays(origin:Vector,multiTile:number){
 const offsets:readonly (readonly [number,number])[][]=[[[0,0]],[[0,512],[0,-512]],[[512,0],[-512,0]],[[-512,512],[-512,-512],[512,512],[512,-512]]];
 const selected=offsets[multiTile];
 if(!selected)throw Error('Unknown original elevated road footprint');
 return selected.map(([x,z])=>({position:[(origin[0]+x)<<16>>16,origin[1],(origin[2]+z)<<16>>16] as Vector,shape:'GAME2.high' as const,depth:0x800,flags:5}));
}
