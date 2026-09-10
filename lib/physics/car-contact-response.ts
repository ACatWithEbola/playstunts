import {i16,u16,intSin,intCos,intHypot} from './math.ts';
export interface ContactCar{yaw:number;roadSpeed:number}
/** Original187a:04ee after two-car overlap has been established. */
export function carContactResponse(a:ContactCar,b:ContactCar){
 const component=(car:ContactCar,trig:(n:number)=>number)=>i16(((u16(car.roadSpeed)>>>8)*trig(car.yaw)+8192)>>14);
 const relative=Math.max(10,intHypot(i16(component(b,intSin)-component(a,intSin)),i16(component(b,intCos)-component(a,intCos))));
 const angle=(v:number)=>{v=i16(v);if(v>=512)v=i16(v-1024);if(v<=-512)v=i16(v+1024);return v;};
 const product=i16(768*relative),sign=product<0?-1:0;
 const magnitude=i16((product^sign)-sign);
 const reduction=i16(((magnitude>>2)^sign)-sign);
 const first=u16(a.roadSpeed-reduction),second=u16(b.roadSpeed);
 return {cars:[{roadSpeed:first,speed:first,wheelAngle:angle(b.yaw-a.yaw),contact:1},{roadSpeed:second,speed:second,wheelAngle:angle(a.yaw-b.yaw),contact:1}],crash:relative>30};
}
