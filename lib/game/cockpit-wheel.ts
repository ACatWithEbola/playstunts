/** Original cockpit wheel selection at 0x14ed3-0x14f00. Preserve signed
 * 16-bit absolute-value overflow before arithmetic shifting by three.
 */
export function cockpitWheel(steering:number){
 const angle=steering<<16>>16;
 const magnitude=(angle<0?-angle:angle)<<16>>16;
 const divided=magnitude>>3,scaled=(angle<0?-divided:divided)|0;
 return {scaled,frame:scaled<-10?0:scaled>10?2:1};
}
