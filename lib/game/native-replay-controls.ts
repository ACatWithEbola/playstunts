import {originalReplayPointerInput} from './replay-pointer-input.ts';
import {originalReplayNavigation} from './replay-navigation.ts';
import {originalReplayCameraAdjustment} from './replay-camera-adjustment.ts';
export interface NativeReplayControlsHost {
 memory():Uint8Array;read():Promise<number>;ctrlHeld():boolean;raceCommand(key:number):number|Promise<number>;
 control(mode:number,start:number,current:number):void;pauseAudio():void;
 presentWorld():void;
 scrub(direction:'forward'|'backward'):Promise<void>;menu():Promise<void>;
 seekStart():void;waitTicks(ticks:number):Promise<void>;
}
/** Original15830 mode3 input loop. A return yields to the race renderer;
 * navigation/pause keep polling here, preserving the original redraw order. */
export async function runNativeReplayControls(host:NativeReplayControlsHost,d:number){
 const word=(o:number)=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+o,true);};
 const redraw=()=>host.control(1,word(0x8c26),word(0x8c26));
 let prepare=true;
 for(;;){
  const input=await host.read(),sample=host.memory();
  // Hidden replay buttons have no browser pointer targets. Keep keyboard
  // commands active without letting invisible hover regions redraw the panel.
  let key=sample[d+0xaae6]?originalReplayPointerInput(sample,d,input,prepare):input&65535;prepare=false;
  if(key!==0&&key!==27&&await host.raceCommand(key))return;
  let m=host.memory();
  if(!m[d+0x9aca]&&key===0){
   if(m[d+0xaae6])redraw();
   // Browser input polling already yielded one animation frame. A visible
   // panel presents that frame through control(1); a hidden panel must still
   // present the world instead of limiting enhanced playback to half refresh.
   else host.presentWorld();
   return;
  }
  if(!m[d+0xaae6]){m[d+0x9c46]=255;new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x9000,65535,true);}
  if(m[d+0x9aca]&&(m[d+0x5527]||m[d+0x5526]))host.control(2,4,0);
  redraw();m=host.memory();
  const modifier=host.ctrlHeld()||(m[d+0x31e9]===8&&(m[d+0x9ad4]&0x30)!==0);
  if(modifier&&key!==43&&key!==45){
   const command=key===0x4800?'up':key===0x5000?'down':key===0x4b00?'left':key===0x4d00?'right':undefined;
   if(command&&originalReplayCameraAdjustment(m,d,command))return;
   key=0;
  }
  if(key===43||key===45){if(originalReplayCameraAdjustment(m,d,key===43?'zoom-in':'zoom-out'))return;key=0;}
  if(key===27){await host.menu();return;}
  if(key===13||key===32){
   const selected=m[d+0x31e9];
   if(selected===0||selected===1){await host.scrub(selected===0?'forward':'backward');return;}
   if(selected===6){await host.menu();return;}
   if(selected===2){host.control(2,2,0);m=host.memory();m[d+0x8ffe]=3;m[d+0x9aca]=0;}
   if(selected===3){m[d+0x8ffe]=0;host.control(2,3,0);host.memory()[d+0x9aca]=0;}
   if(selected===4){m[d+0x9aca]=1;host.pauseAudio();host.control(2,4,0);redraw();}
   if(selected===5){
    m[d+0x9aca]=1;host.pauseAudio();host.control(2,5,0);redraw();host.seekStart();await host.waitTicks(50);host.control(2,4,0);redraw();return;
   }
  }else{
   const action=originalReplayNavigation(host.memory(),d,key);
   if((action==='zoom-in'||action==='zoom-out')&&originalReplayCameraAdjustment(host.memory(),d,action))return;
  }
  redraw();
 }
}
