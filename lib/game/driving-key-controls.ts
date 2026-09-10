/** Original224f8..22587: ten configured scan codes, then joystick fallback.
 * A keyboard combination suppresses the joystick sample completely. */
export function originalDrivingKeyControls(bindings:ArrayLike<number>,down:(scan:number)=>boolean,joystick:()=>number){
 const masks=[16,32,9,1,5,4,6,2,10,8];let result=0;
 for(let i=0;i<10;i++)if(down(bindings[i]&255))result|=masks[i];
 return result||joystick()&65535;
}
