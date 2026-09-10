import {createMt32UnitRouter} from './mt32-unit-address.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
export interface Mt32Wasm {
 HEAPU8:Uint8Array;HEAPF32:Float32Array;
 _malloc(n:number):number;_free(p:number):void;
 _stunts_mt32_open(control:number,controlSize:number,pcm:number,pcmSize:number):number;
 _stunts_mt32_setting(id:number):number;_stunts_mt32_set(id:number,value:number):number;
 _stunts_mt32_close():void;_stunts_mt32_flush():void;_stunts_mt32_reset_count():number;_stunts_mt32_display(p:number):number;
 _stunts_mt32_sample_rate():number;_stunts_mt32_active():number;_stunts_mt32_reset_controllers():void;_stunts_mt32_midi(p:number,n:number):number;
 _stunts_mt32_render(p:number,n:number):number;
 _stunts_mt32_read(address:number,length:number,target:number):number;
 _stunts_mt32_main_display():void;
 _stunts_mt32_patch_name(part:number,target:number):number;
 _stunts_mt32_sound(group:number,number:number,target:number):number;
}
/** Owns one initialized Munt instance. No patch upload, reset, or timing is
 * invented here: callers deliver the reconstructed driver's output. */
export function createMt32WasmOutput(module:Mt32Wasm,control:Uint8Array,pcm:Uint8Array):Mt32StereoOutput & {resetGeneration():number;resetControllers():void;active():boolean;panelWrite(writes:number[][]):void;unitID():number;setUnitID(value:number):void;sound(group:number,number:number):{group:string;name:string};patchName(part:number):string;read(address:number,length:number):Uint8Array;mainDisplay():void;settings():number[];set(id:number,value:number):void;display():{text:string;midi:boolean};close():void}{
 let c=0,p=0,midi=0,audio=0,lcd=0,closed=false;
 const allocate=(n:number)=>{const pointer=module._malloc(n);if(!pointer)throw Error('Roland synthesizer allocation failed');return pointer;};
 try{
  c=allocate(control.length);p=allocate(pcm.length);module.HEAPU8.set(control,c);module.HEAPU8.set(pcm,p);
  const result=module._stunts_mt32_open(c,control.length,p,pcm.length);if(result)throw Error('Roland ROM initialization failed: '+result);
  midi=allocate(65536);audio=allocate(512*8);lcd=allocate(21);
 }catch(error){module._stunts_mt32_close();for(const pointer of [midi,audio,lcd])if(pointer)module._free(pointer);throw error;}
 finally{if(c)module._free(c);if(p)module._free(p);}
 const router=createMt32UnitRouter();
 let resetCount=module._stunts_mt32_reset_count();
 // Munt reports resets when the queued message is actually processed.
 const syncReset=()=>{const count=module._stunts_mt32_reset_count();if(count!==resetCount){resetCount=count;router.setUnit(16);}};
 const send=(bytes:number[])=>{
  if(closed)throw Error('Roland synthesizer is closed');
  // Seeking can produce more than one transfer buffer of device writes.
  // The persistent MIDI parser retains partial messages across these chunks.
  for(let at=0;at<bytes.length;at+=65536){
   const chunk=bytes.slice(at,at+65536);module.HEAPU8.set(chunk,midi);
   if(module._stunts_mt32_midi(midi,chunk.length))throw Error('Roland MIDI queue overflow');
  }
 };
 const sampleRate=module._stunts_mt32_sample_rate();
 return {sampleRate,
  resetGeneration(){if(closed)throw Error('Roland synthesizer is closed');syncReset();return resetCount;},
  resetControllers(){if(closed)throw Error('Roland synthesizer is closed');module._stunts_mt32_reset_controllers();},
  active(){if(closed)throw Error('Roland synthesizer is closed');return module._stunts_mt32_active()!==0;},
  unitID(){return router.unit;},setUnitID(value){if(closed)throw Error('Roland synthesizer is closed');router.setUnit(value);},
  panelWrite(writes){send(writes.filter(([port])=>port===0x330).map(([,value])=>value));},
  sound(group,number){if(closed||!Number.isInteger(group)||!Number.isInteger(number)||group<0||group>3||number<0||number>127||module._stunts_mt32_sound(group,number,midi))throw Error('Invalid Roland sound');const text=(at:number,n:number)=>new TextDecoder().decode(module.HEAPU8.subarray(midi+at,midi+at+n)).replace(/\0.*$/,'');return {group:text(0,7),name:text(8,10)};},
  patchName(part){if(closed||!Number.isInteger(part)||part<0||part>8||module._stunts_mt32_patch_name(part,midi))throw Error('Invalid Roland part');return new TextDecoder().decode(module.HEAPU8.subarray(midi,midi+10)).replace(/\0.*$/,'');},
  read(address,length){if(closed||!Number.isInteger(address)||address<0||address>0x1fffff||!Number.isInteger(length)||length<1||length>256)throw Error('Invalid Roland memory read');if(module._stunts_mt32_read(address,length,midi))throw Error('Roland memory read failed');return module.HEAPU8.slice(midi,midi+length);},
  mainDisplay(){if(!closed)module._stunts_mt32_main_display();},
  settings(){if(closed)throw Error('Roland synthesizer is closed');return Array.from({length:17},(_,id)=>module._stunts_mt32_setting(id));},
  set(id,value){if(closed||module._stunts_mt32_set(id,value))throw Error('Invalid Munt setting');},
  prepare(writes){
   if(closed)throw Error('Roland synthesizer is closed');
   // Seeking has already simulated these frames without audible output.
   // Apply their retained device writes in bounded chunks, rather than queueing
   // a whole recording as future live music. Exact PC seek pacing is separate.
   module._stunts_mt32_flush();syncReset();
   for(let at=0;at<writes.length;at+=128){send(router.write(writes.slice(at,at+128).filter(([port])=>port===0x330).map(([,value])=>value)));module._stunts_mt32_flush();syncReset();}
  },
  write(writes){if(closed)throw Error('Roland synthesizer is closed');send(router.write(writes.filter(([port])=>port===0x330).map(([,value])=>value)));},
  render(frames){if(closed)throw Error('Roland synthesizer is closed');if(!Number.isSafeInteger(frames)||frames<0||frames>512)throw Error('Invalid Roland render block');if(module._stunts_mt32_render(audio,frames))throw Error('Roland rendering failed');syncReset();return module.HEAPF32.slice(audio/4,audio/4+frames*2);},
  display(){if(closed)return {text:'',midi:false};const led=module._stunts_mt32_display(lcd);if(led<0)throw Error('Roland display is unavailable');const bytes=module.HEAPU8.subarray(lcd,lcd+20),end=bytes.indexOf(0);return {text:new TextDecoder().decode(end<0?bytes:bytes.subarray(0,end)),midi:led===1};},
  close(){if(closed)return;closed=true;module._stunts_mt32_close();for(const pointer of [midi,audio,lcd])module._free(pointer);},
 };
}
