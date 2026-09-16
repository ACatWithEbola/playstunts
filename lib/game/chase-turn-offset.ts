/** A bounded, critically damped turn reveal, driven by the same interpolated
 * steering as the front wheels. Never estimate turn rate from integer body
 * yaw: alternating native yaw increments must not rock the chase camera.
 * Two identical first-order stages give a positive, non-oscillating kernel.
 * Their exact linear-input solution is independent of display refresh rate. */
export const CHASE_TURN_REVEAL=Math.PI*14/180;
export const CHASE_TURN_RESPONSE=7;

export function createChaseTurnOffset(){
 let first=0,offset=0,previousTarget=0,lastAt:number|undefined;
 return {
  sample(steering:number,now:number,reset=false){
   const target=Math.max(-1,Math.min(1,steering/240))*CHASE_TURN_REVEAL;
   if(reset||lastAt===undefined){first=0;offset=0;previousTarget=target;lastAt=now;return offset;}
   const dt=Math.max(0,(now-lastAt)/1000),w=CHASE_TURN_RESPONSE;
   if(dt>0){
    const slope=(target-previousTarget)/dt,decay=Math.exp(-w*dt);
    const a=first-previousTarget+slope/w;
    offset=target-2*slope/w+(offset-previousTarget+2*slope/w+w*a*dt)*decay;
    first=target-slope/w+a*decay;
   }
   previousTarget=target;lastAt=now;
   return offset;
  },
 };
}
