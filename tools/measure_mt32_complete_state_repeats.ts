/** Complete ready-runtime state repetition, not timed delivery or recording
 * calibration. Include command scratch and hardware voice tails: matching only
 * notes or sequencer pointers would permit false loop boundaries. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
const limit=24000;
for(const generation of ['ms-1990','ms-1991'] as const)for(const name of ['titl','slct','vict','over']){
 const runtime=createOriginalMt32MusicRuntime(versionedMt32MusicSeed(JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8')),generation));
 const snapshot=()=>Buffer.concat([
  Buffer.from(JSON.stringify([runtime.state,runtime.commandArgument])),
  ...[runtime.driver,runtime.markers,...runtime.timers,...runtime.voices,runtime.lastNotes].map(bytes=>Buffer.from(bytes)),
 ]);
 const seen=new Map<string,number>(),sequencers=new Map<string,number>();let repeat:unknown=null,sequencerRepeat:unknown=null;
 for(let tick=0;tick<=limit;tick++){
  const bytes=snapshot(),key=createHash('sha256').update(bytes).digest('hex'),previous=seen.get(key);
  if(!sequencerRepeat){
   const sequencerKey=JSON.stringify([runtime.state,runtime.commandArgument,...runtime.timers.map(value=>Array.from(value)),Array.from(runtime.markers)]);
   const earlier=sequencers.get(sequencerKey);
   if(earlier!==undefined)sequencerRepeat={firstTick:earlier,repeatedTick:tick,periodCallbacks:tick-earlier,hardwareVoiceStateVerified:false};
   else sequencers.set(sequencerKey,tick);
  }
  if(previous!==undefined){
   // Independently reconstruct the earlier snapshot to compare actual bytes,
   // rather than treating a hash match alone as proof.
   const check=createOriginalMt32MusicRuntime(versionedMt32MusicSeed(JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8')),generation));
   for(let i=0;i<previous;i++)check.tick();
   const earlier=Buffer.concat([Buffer.from(JSON.stringify([check.state,check.commandArgument])),...[check.driver,check.markers,...check.timers,...check.voices,check.lastNotes].map(value=>Buffer.from(value))]);
   if(!bytes.equals(earlier))throw Error('State hash collision');
   repeat={firstTick:previous,repeatedTick:tick,periodCallbacks:tick-previous};break;
  }
  seen.set(key,tick);runtime.tick();
 }
 console.log(JSON.stringify({generation,name,limit,repeat,sequencerRepeat,timedDeliveryOrRecordingVerified:false}));
}
