import {i16} from '../physics/math.ts';
export interface OriginalInputSample {key:number;controls:number;shift:number;x:number;y:number;buttons:number}
/** Original 1AAFE..1AD1A, with keyboard/joystick/mouse hardware supplied by host.
 * Cursor effects are emitted in source order; their raster routines are separate.
 */
export function pollOriginalInput(memory:Uint8Array,d:number,delta:number,input:OriginalInputSample){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),get=(o:number)=>v.getUint16(d+o,true),set=(o:number,n:number)=>v.setUint16(d+o,n,true),byte=(o:number)=>memory[d+o],put=(o:number,n:number)=>{memory[d+o]=n;};
 const effects:('hideCursor'|'showCursor')[]=[];
 set(0x3396,get(0x3396)+delta);
 if(i16(get(0x3396))>20000)for(const o of [0x3396,0x3382,0x3384])set(o,get(o)-10000);
 let key=input.key&65535;const controls=input.controls&65535;
 if(key)put(0x132,0);
 set(0x9ad4,input.shift);
 let synthesize=false;
 if(get(0x3386)!==controls){set(0x3388,(get(0x3386)^controls)&controls);set(0x3386,controls);synthesize=true;}
 else if(controls&&i16(get(0x3384)+20)<i16(get(0x3396)))synthesize=true;
 if(synthesize){
  const pressed=get(0x3388);
  for(const [mask,value] of [[32,13],[16,32],[1,0x4800],[2,0x5000],[8,0x4b00],[4,0x4d00]])if(pressed&mask){set(0x3392,value);break;}
  if(get(0x3392)){set(0x3384,get(0x3396));put(0x132,0);}
 }
 set(0xa77c,input.x);set(0xa7de,input.y);set(0x893a,input.buttons);
 if(get(0x338a)!==get(0xa77c)||get(0x338c)!==get(0xa7de)||get(0x338e)!==get(0x893a)){
  set(0x338a,get(0xa77c));set(0x338c,get(0xa7de));put(0x132,1);set(0x3390,0);
  if(byte(0x131)){if(byte(0x133))effects.push('hideCursor');effects.push('showCursor');}
 }else if(byte(0x132)){
  set(0x3390,get(0x3390)+delta);
  if(i16(get(0x3390))>500){set(0x3390,0);put(0x132,0);if(byte(0x133))effects.push('hideCursor');}
 }
 if(byte(0x132)){
  const buttons=get(0x893a);
  if(get(0x338e)!==buttons||(buttons&&i16(get(0x3382)+20)<i16(get(0x3396)))){
   set(0x338e,buttons);if(buttons&1)set(0x3394,32);else if(buttons&2)set(0x3394,13);
   if(get(0x3394))set(0x3382,get(0x3396));set(0x3390,0);
  }
  if(buttons&1)put(0x9ad4,byte(0x9ad4)|32);else if(buttons&2)put(0x9ad4,byte(0x9ad4)|16);
 }
 if(!key){if(get(0x3392)){key=get(0x3392);set(0x3392,0);}else if(get(0x3394)){key=get(0x3394);set(0x3394,0);}}
 return {key,effects};
}
