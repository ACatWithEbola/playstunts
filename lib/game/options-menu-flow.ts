/** Options control flow recovered from run_option_menu. Dialog rendering,
 * input hardware and file access are yielded to the caller for original adapters.
 * Dispatcher verified against 220 supplied-executable executions (56a6..58d3).
 * Dialog rendering and individual configuration routines are separate dependencies.
 * The caller owns and updates input flags when configuration returns; joystick
 * calibration can fail, and mouse configuration does not clear the joystick flag.
 */
export type OriginalOptionsRequest =
 | {type:'options'}
 | {type:'input-device';selected:number}
 | {type:'configure-input';device:'keyboard'|'joystick'|'mouse'}
 | {type:'music'} | {type:'sound'} | {type:'graphics'} | {type:'exit-dos'}
 | {type:'select-replay'} | {type:'load-replay'};
export function* originalOptionsFlow(input:{mouse:boolean;joystick:boolean}):Generator<OriginalOptionsRequest,0|1,number>{
 for(;;){
  const selection=((yield {type:'options'})<<24)>>24;
  switch(selection){
   case -1:case 6:return 0;
   case 0:{
    const device=((yield {type:'input-device',selected:input.mouse?2:input.joystick?1:0})<<24)>>24;
    if(device>=0&&device<=2){
     yield {type:'configure-input',device:(['keyboard','joystick','mouse'] as const)[device]};
    }
    break;
   }
   case 1:yield {type:'music'};break;
   case 2:yield {type:'sound'};break;
   case 3:if((yield {type:'select-replay'})&255){yield {type:'load-replay'};return 1;}break;
   case 4:yield {type:'graphics'};break;
   case 5:yield {type:'exit-dos'};break;
  }
 }
}
