/** Generate the original menu-music startup states without executing DOS code. */
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {loadSoundEffect} from '../lib/game/load-sound-effect.ts';
import {resetAudio} from '../lib/game/audio-reset.ts';
import {initializeOriginalPcSpeaker} from '../lib/game/pc-speaker-control.ts';

const [sourceArgument,outputArgument]=process.argv.slice(2);
if(!sourceArgument||!outputArgument)throw Error('Usage: node tools/generate_music_seeds.ts ORIGINAL OUTPUT');
const source=resolve(sourceArgument),output=resolve(outputArgument);mkdirSync(output,{recursive:true});
const scores=['TITL','SLCT','VICT','OVER'] as const;
const devices=[
 {prefix:'',name:'AD',channels:10},
 {prefix:'pc-',name:'PC',channels:5},
 {prefix:'tandy-',name:'TD',channels:6},
 {prefix:'mt32-',name:'MT',channels:16},
] as const;
const bytes=(name:string)=>new Uint8Array(readFileSync(join(source,name)));
const view=(data:Uint8Array)=>new DataView(data.buffer,data.byteOffset,data.byteLength);
const putPointer=(data:Uint8Array,at:number,offset:number,segment:number)=>{const v=view(data);v.setUint16(at,offset&65535,true);v.setUint16(at+2,segment&65535,true);};

function initializedTimers(bank:Uint8Array,header:number){
 const empty={timers:Array.from({length:24},()=>new Uint8Array(72)),voices:Array.from({length:10},()=>new Uint8Array(46)),lastNotes:new Uint8Array(24),markers:new Uint8Array(24),velocities:Array(9).fill(0),driverSegment:0x39e1,paused:1};
 const timers=resetAudio(empty).timers;
 const instrumentCount=bank[header+6],trackCount=bank[header+7+instrumentCount*4];
 if(trackCount>7)throw Error('Unsupported original music track count');
 const driverCallbacks=[0x00a4,0x044a,0x0874,0x0cc1,0x0e41,0x125f,0x1679];
 for(let owner=0;owner<trackCount;owner++){
  const timer=timers[owner],entry=header+8+instrumentCount*4+owner*5;
  const sequence=(view(bank).getUint16(entry,true)+4)&65535;
  putPointer(timer,0,sequence,0x8000);putPointer(timer,5,sequence,0x8000);
  timer[36]=32;putPointer(timer,46,header+7,0x8000);putPointer(timer,51,driverCallbacks[owner],0x45e6);timer[67]=254;
 }
 // The original music timer reserves owner six for its internal callback.
 if(trackCount<7){const internal=timers[6];putPointer(internal,5,0x166b,0x45e6);putPointer(internal,46,0x005b,0x45e6);putPointer(internal,51,0x1679,0x45e6);internal[67]=254;}
 for(let owner=16;owner<24;owner++)timers[owner].fill(0);
 return timers.map(timer=>Array.from(timer));
}

const adlibWrites=()=>{
 const state={timers:Array.from({length:24},()=>new Uint8Array(72)),voices:Array.from({length:10},()=>new Uint8Array(46)),lastNotes:new Uint8Array(24),markers:new Uint8Array(24),velocities:Array(9).fill(0),driverSegment:0x39e1,paused:1};
 return resetAudio(state).writes.slice(0,46);
};
const pcWrites=[[0x43,0x36],[0x40,0x9c],[0x40,0x2e],[0x43,0xb6],[0x61,0]];
const tandyWrites=[[0x61,0],[0xc0,0x80],[0xc1,0],[0xc0,0x9f],[0xc0,0xa0],[0xc1,0],[0xc0,0xbf],[0xc0,0xc0],[0xc1,0],[0xc0,0xdf],[0xc0,0xe0],[0xc1,0],[0xc0,0xff],[0x61,0]];
const mt32Writes=Array.from({length:16},(_,index)=>[[0x330,0xb0|(15-index)],[0x330,121],[0x330,0]]).flat();

for(const device of devices){
 const voice=bytes(device.name+'SKIDMS.VCE'),rawDriver=bytes(device.name+'15.DRV');
 for(const score of scores){
  const rawBank=bytes('SKID'+score+'.KMS');
  const loaded=loadSoundEffect(rawBank,voice,Uint8Array.from(score,c=>c.charCodeAt(0)),{offset:0,segment:0x8000},{offset:0,segment:0x9000},Array.from({length:7},()=>({offset:0,segment:0})));
  if(loaded.header===null)throw Error('Original music resource was not found: '+score);
  let driver:Uint8Array|undefined,initialWrites:number[][];
  const hardware=Array.from({length:device.channels},()=>Array(46).fill(0).map((value,index)=>index===0&&device.name!=='MT'?255:value));
  if(device.name==='AD')initialWrites=adlibWrites();
  else if(device.name==='PC'){
   driver=rawDriver.slice(0,0x2df);initializeOriginalPcSpeaker(driver,0);driver[0x1c1]=1;initialWrites=pcWrites.map(write=>write.slice());
  }else if(device.name==='TD'){
   driver=rawDriver.slice();driver.fill(15,0x516,0x51c);initialWrites=tandyWrites.map(write=>write.slice());
  }else{driver=rawDriver.slice();initialWrites=mt32Writes.map(write=>write.slice());}
  const seed:Record<string,unknown>={
   markers:Array(24).fill(0),masterVolume:127,commandArgument:76,header:loaded.header,
   bank:Array.from(loaded.bank),voices:Array.from(voice),timers:initializedTimers(loaded.bank,loaded.header),hardware,
   lastNotes:Array(24).fill(0),velocities:device.name==='AD'?Array(9).fill(0):device.name==='PC'||device.name==='MT'?Array(9).fill(127):Array.from(rawDriver.slice(0x957,0x960)),
   initialWrites,percussion:loaded.percussion.map(pointer=>[pointer.offset,pointer.segment]),
  };
  if(driver)Object.assign(seed,{driver:Array.from(driver),port61:0});
  if(device.name==='MT'){
   // TITL deliberately references the absent STRT patch. The original then
   // reads a null far pointer; preserve only the bytes its MT15 callbacks use,
   // instead of capturing unrelated interrupt-vector memory as asset data.
   const nullInstrument=Array(100).fill(0);for(const [at,value] of [[18,112],[21,255],[25,16],[40,85],[53,18],[67,240],[68,224],[69,16]])nullInstrument[at]=value;
   Object.assign(seed,{nullInstrument,systemVolume:[16,0,22,0]});
  }
  writeFileSync(join(output,device.prefix+'music-'+score.toLowerCase()+'-seed.json'),JSON.stringify(seed));
 }
}
console.log('Generated 16 deterministic music initial states from original scores and drivers.');
