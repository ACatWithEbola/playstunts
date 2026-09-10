import type {LevelState} from '../physics/level-step.ts';
import type {OpponentRouteTarget} from '../physics/opponent-decision.ts';
/** Original opponent car layout, preserving bytes outside reconstructed writes. */
export function writeOpponentCarState(before:Uint8Array,previous:LevelState,current:LevelState,route:{routeIndex:number;point:number;completed:number},target:OpponentRouteTarget,angle:number,targetAlternate?:number){
 if(before.length!==184)throw Error('Expected the original opponent car structure');
 const out=before.slice(),v=new DataView(out.buffer),word=(at:number,value:number)=>v.setUint16(at,value,true),vector=(at:number,values:readonly number[])=>values.forEach((n,i)=>word(at+i*2,n));
 const {engine:e,grip:g,suspension:s}=current;
 current.pose.position.forEach((n,i)=>v.setInt32(i*4,n,true));previous.pose.position.forEach((n,i)=>v.setInt32(12+i*4,n,true));vector(24,current.pose.rotation);
 for(const [off,value] of [[0x1e,e.gravity],[0x20,g.steeringAngle],[0x22,e.rpm],[0x24,e.lastRPM],[0x28,e.speedDiff],[0x2a,e.speed],[0x2c,e.roadSpeed],[0x2e,e.lastSpeed],[0x30,e.ratio],[0x32,e.ratioHigh],[0x34,e.knobX],[0x36,g.wheelAngle],[0x38,e.knobY],[0x3a,e.targetX],[0x3c,e.targetY],[0x3e,g.spin],[0x40,g.frontWheelAngle],[0x42,g.slip],[0x44,g.demandedGrip],[0x46,g.surfaceGrip],[0x48,angle],[0x4a,route.routeIndex]])word(off,value);
 for(const [off,values] of [[0x4c,s.rc1],[0x54,s.rc2],[0x64,s.rc4],[0x6c,s.rc5]] as const)vector(off,values);
 if(!current.wheelPositions)throw Error('Original wheel history is required');
 current.wheelPositions.forEach((values,i)=>vector(0x74+i*6,values));vector(0x8c,target.midpoint);vector(0x92,target.first);vector(0x98,target.second);
 for(const [off,value] of [[0xa4,e.braking],[0xa5,e.accelerating],[0xa6,e.gear],[0xa7,g.surfaces[0]+g.surfaces[1]],[0xa8,e.rearContact],[0xa9,e.allContact],[0xae,e.limiter],[0xaf,g.sliding],[0xb1,g.crash],[0xb2,e.shifting],[0xb3,e.shiftTimer],[0xb4,e.automatic],[0xb5,route.completed],[0xb6,route.point],[0xb7,g.soundFlags]])out[off]=value;
 if(targetAlternate!==undefined)word(0x9e,targetAlternate);
 if(current.contactFlag!==undefined)out[0xb0]=current.contactFlag;
 g.surfaces.forEach((value,i)=>out[0xaa+i]=value);
 return out;
}
