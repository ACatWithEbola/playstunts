import {i16} from '../physics/math.ts';
export interface OriginalMenuDeviceState {
 counter:number;mouseTime:number;joystickTime:number;joystick:number;pressedJoystick:number;
 x:number;y:number;buttons:number;mouseIdle:number;joystickKey:number;mouseKey:number;
 mouseAvailable:boolean;mouseActive:boolean;cursorVisible:boolean;
}
export interface OriginalMenuDeviceSample {delta:number;key:number;joystick:number;rawButtons:number;x:number;y:number;buttons:number}
/** Supplied1aafe..1ad1a: keyboard priority, joystick/mouse edge and repeat
 * handling, pointer ownership and its500-tick inactivity timeout. */
export function pollOriginalMenuDevices(before:OriginalMenuDeviceState,input:OriginalMenuDeviceSample){
 const s={...before},cursor:('hide'|'show')[]=[];
 const hide=()=>{cursor.push('hide');s.cursorVisible=false;},show=()=>{cursor.push('show');s.cursorVisible=true;};
 s.counter=i16(s.counter+input.delta);
 if(s.counter>20000){s.counter=i16(s.counter-10000);s.mouseTime=i16(s.mouseTime-10000);s.joystickTime=i16(s.joystickTime-10000);}
 let key=input.key&65535,rawButtons=input.rawButtons&65535;
 if(key)s.mouseActive=false;
 const joystick=input.joystick&65535;
 const joystickPress=()=>{
  for(const [bit,value] of [[32,13],[16,32],[1,0x4800],[2,0x5000],[8,0x4b00],[4,0x4d00]])if(s.pressedJoystick&bit){s.joystickKey=value;break;}
  if(s.joystickKey){s.joystickTime=s.counter;s.mouseActive=false;}
 };
 if(s.joystick!==joystick){s.pressedJoystick=(s.joystick^joystick)&joystick;s.joystick=joystick;joystickPress();}
 else if(joystick&&i16(s.joystickTime+20)<s.counter)joystickPress();
 const x=i16(input.x),y=i16(input.y),buttons=input.buttons&65535;
 if(s.x!==x||s.y!==y||s.buttons!==buttons){
  s.x=x;s.y=y;s.mouseActive=true;s.mouseIdle=0;
  if(s.mouseAvailable){if(s.cursorVisible)hide();show();}
 }else if(s.mouseActive){
  s.mouseIdle=i16(s.mouseIdle+input.delta);
  if(s.mouseIdle>500){s.mouseIdle=0;s.mouseActive=false;if(s.cursorVisible)hide();}
 }
 if(s.mouseActive){
  const mousePress=()=>{
   if(buttons&1)s.mouseKey=32;else if(buttons&2)s.mouseKey=13;
   if(s.mouseKey)s.mouseTime=s.counter;
   s.mouseIdle=0;
  };
  if(s.buttons!==buttons){s.buttons=buttons;mousePress();}
  else if(buttons&&i16(s.mouseTime+20)<s.counter)mousePress();
  if(buttons&1)rawButtons|=32;else if(buttons&2)rawButtons|=16;
 }
 if(!key){if(s.joystickKey){key=s.joystickKey;s.joystickKey=0;}else if(s.mouseKey){key=s.mouseKey;s.mouseKey=0;}}
 return {state:s,key,rawButtons,cursor};
}
