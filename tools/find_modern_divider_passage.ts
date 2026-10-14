/** Read-only candidate search; not an original-game parity certificate. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
const root=process.argv[2];assert.ok(root&&isAbsolute(root));
for(const file of readdirSync(root).filter(name=>/\.rpl$/i.test(name)).sort()){
 const path=join(root,file),source=readFileSync(path),decoded=decodeVersionedReplay(source,'ms-1991'),bytes=decoded.bytes;
 const carId=String.fromCharCode(...bytes.slice(0,4));
 if(!fixtureData.cars.some((car:{id:string})=>car.id===carId)){console.log(JSON.stringify({file,skipped:'custom car',carId}));continue;}
 const raw=bytes.slice(24,0x722);
 if(!raw.slice(0,900).some(id=>id===109||id===110))continue;
 const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond:decoded.framesPerSecond},
  {configuration:Array.from(bytes.slice(0,24)),track:Array.from(raw),name:'SEARCH',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 race.session.skipIntroduction();let firstCrash:number|undefined;const nearTrees:{frame:number;position:number[];allContact:number;surfaces:number[]}[]=[];
 for(let frame=0;frame<bytes.length-0x722;frame++){
  captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+frame],decoded.framesPerSecond,'ms-1991');
  race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
  const car=race.session.state.player.driving.car,[x,y,z]=car.pose.position.map(v=>v>>6),column=x>>10,row=29-(z>>10);
  if(car.grip.crash&&car.grip.crash!==3)firstCrash??=frame+1;
  const id=column>=0&&column<30&&row>=0&&row<30?raw[row*30+column]:0;
  if((id===109||id===110)&&car.grip.crash===0&&y>=24&&y<120&&Math.hypot(x-(column*1024+512),z-((29-row)*1024+512))<100)
   nearTrees.push({frame:frame+1,position:car.pose.position.slice(),allContact:car.grip.allContact,surfaces:car.grip.surfaces.slice()});
 }
 assert.deepEqual(readFileSync(path),source);
 console.log(JSON.stringify({file,carId,frames:bytes.length-0x722,firstCrash:firstCrash??null,finished:race.session.state.player.driving.car.grip.crash===3,nearTreeFrames:nearTrees.length,first:nearTrees[0],last:nearTrees.at(-1),candidateOnly:true}));
}
