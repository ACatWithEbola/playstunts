import {i16} from '../physics/math.ts';
export type CreditsRequest={type:'timer'}|{type:'input';delta:number}|{type:'present';mode:-1|0}|{type:'wait';duration:500};
export interface OriginalCreditsHost {
 arrow:{x:number;y:number;width:number;height:number};finalY:number;
 drawText():void;
 slide(x:number,y:number,width:number,height:number):void;
 frame(index:number,y:number):void;
 finish(y:number):void;
}
/** Supplied 3532..3717, after the original static credits composition.
 * Preserve the ignored first presentation result and the final 500-counter wait.
 */
export function* originalIntroCredits(host:OriginalCreditsHost,retainedKey=0):Generator<CreditsRequest,number,number>{
 host.drawText();yield {type:'present',mode:-1};yield {type:'timer'};
 let x=330,key=retainedKey&65535;
 for(;;){const delta=(yield {type:'timer'})&65535;x=i16(x-i16(delta*2));if(host.arrow.x>x)break;
  host.slide(x,host.arrow.y,host.arrow.width,host.arrow.height);key=(yield {type:'input',delta})&65535;if(key)break;
 }
 let elapsed=0,threshold=0;
 for(let index=2;index<10&&!key;index++){
  host.frame(index,host.finalY);threshold=i16(threshold+5);
  while(threshold>elapsed){const delta=(yield {type:'timer'})&65535;key=(yield {type:'input',delta})&65535;elapsed=i16(elapsed+delta);}
 }
 host.finish(host.finalY);
 if((yield {type:'present',mode:0})&65535)return 1;
 return ((yield {type:'wait',duration:500})&65535)?1:0;
}
