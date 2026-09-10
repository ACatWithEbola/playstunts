/** Original227A3..227B9 horizontal joystick calibration. Subtraction uses
 * signed16-bit flags; multiplication is unsigned and retains bits8..23. */
export function originalJoystickSteering(sample:number,minimum:number,multiplier:number){
 const delta=(sample<<16>>16)<(minimum<<16>>16)?0:(sample-minimum)&65535;
 return (((Math.floor(delta*(multiplier&65535)/256)&65535)-31)<<16)>>16;
}
