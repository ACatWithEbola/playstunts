import assert from 'node:assert/strict';
import {createSynchronizedRemixedMusic,remixedMusicTiming} from '../lib/game/remixed-music.ts';

class Parameter {
 value=0;
 events=[];
 cancelAndHoldAtTime(at){this.events.push(['hold',at]);}
 setValueAtTime(value,at){this.value=value;this.events.push(['set',value,at]);}
 linearRampToValueAtTime(value,at){this.value=value;this.events.push(['ramp',value,at]);}
}

class Source {
 constructor(owner){this.owner=owner;this.playbackRate={value:1};this.loop=false;this.loopStart=0;this.loopEnd=0;this.buffer=null;this.stopped=false;}
 connect(){}
 disconnect(){}
 start(at,offset){this.owner.starts.push({at,offset,rate:this.playbackRate.value,loopStart:this.loopStart,loopEnd:this.loopEnd,source:this});}
 stop(){this.stopped=true;}
}

class Context {
 currentTime=10;
 destination={};
 starts=[];
 createGain(){return {gain:new Parameter(),connect(){},disconnect(){}};}
 createBufferSource(){return new Source(this);}
}

const context=new Context(),output=[],originalPlays=[];
let settings={musicEnabled:true,soundEnabled:true,paused:false};
const original={
 fadeTicks:128,
 get settings(){return settings;},
 control(operation){
  if(operation==='pause-audio')settings={...settings,paused:true};
  if(operation==='resume-audio')settings={...settings,paused:false};
  if(operation==='toggle-music')settings={...settings,musicEnabled:!settings.musicEnabled};
  if(operation==='toggle-sound')settings={...settings,soundEnabled:!settings.soundEnabled};
  return operation==='toggle-music'?Number(settings.musicEnabled):operation==='toggle-sound'?Number(settings.soundEnabled):0;
 },
 setOutputMuted(muted,at=context.currentTime,fade=0){output.push({muted,at,fade});},
 play(name){if(settings.musicEnabled)originalPlays.push(name);},async fadeOut(){},stop(){},close(){},
};
const buffers={titl:{duration:59.64},slct:{duration:61.944},vict:{duration:59.904},over:{duration:58.8}};
const music=createSynchronizedRemixedMusic(context,original,buffers,false);

music.play('titl');
assert.equal(context.starts.length,1);
assert.equal(context.starts[0].at,10.015);
assert.equal(context.starts[0].offset,remixedMusicTiming.titl.cueOffset);
assert.equal(context.starts[0].rate,1,'the remix must keep its natural speed and pitch');
assert.equal(context.starts[0].loopStart,remixedMusicTiming.titl.cueOffset);
assert.equal(context.starts[0].loopEnd-context.starts[0].loopStart,remixedMusicTiming.titl.loopDuration);

context.currentTime=25;
music.setEnabled(true);
music.setEnabled(false);
assert.equal(context.starts.length,1,'audio-mode switching must not restart the score');
assert.deepEqual(output.slice(-2).map(event=>event.muted),[true,false]);

context.currentTime=30;
music.control('pause-audio');
assert.equal(context.starts[0].source.stopped,true);
context.currentTime=35;
music.control('resume-audio');
assert.equal(context.starts.length,2);
assert.equal(context.starts[1].at,35.015);
assert.ok(Math.abs(context.starts[1].offset-(remixedMusicTiming.titl.cueOffset+19.985))<1e-9,'resume must retain the calibrated shared score position');

for(const name of ['slct','vict','over']){
 context.currentTime+=5;
 music.play(name);
 const start=context.starts.at(-1);
 assert.equal(start.rate,1,`${name} must keep its natural speed and pitch`);
 assert.equal(start.offset,remixedMusicTiming[name].cueOffset,`${name} must skip only its measured lead-in`);
 assert.equal(start.loopEnd-start.loopStart,remixedMusicTiming[name].loopDuration,`${name} must use the original score loop duration`);
}
const startsBeforeSwitch=context.starts.length;
music.setEnabled(true);
assert.equal(context.starts.length,startsBeforeSwitch,'switching every score must remain gain-only');

const activeSource=context.starts.at(-1).source;
const playsBeforeOptions=originalPlays.length;
context.currentTime+=3;
assert.equal(music.control('toggle-music'),0,'the in-game Options toggle must disable music');
assert.equal(activeSource.stopped,true,'disabling music must stop the remixed score');
assert.equal(context.starts.length,startsBeforeSwitch,'disabling music must not start another source');
music.setEnabled(false);
music.setEnabled(true);
assert.equal(context.starts.length,startsBeforeSwitch,'the website version switch must stay silent while in-game music is disabled');

context.currentTime+=2;
assert.equal(music.control('toggle-music'),1,'the in-game Options toggle must re-enable music');
assert.equal(originalPlays.length,playsBeforeOptions+1,'re-enabling must restart the remembered original score');
assert.equal(originalPlays.at(-1),'over');
assert.equal(context.starts.length,startsBeforeSwitch+1,'re-enabling must restart the matching remixed score');
assert.equal(context.starts.at(-1).offset,remixedMusicTiming.over.cueOffset,'both versions must restart from the same score boundary');

const startsBeforeSoundToggle=context.starts.length;
assert.equal(music.control('toggle-sound'),0,'sound effects must remain an independent in-game setting');
assert.equal(context.starts.length,startsBeforeSoundToggle,'the sound-effects toggle must not restart music');

music.control('toggle-music');
music.play('vict');
assert.equal(context.starts.length,startsBeforeSoundToggle,'a score requested while music is disabled must remain silent');
music.control('pause-audio');
music.control('resume-audio');
assert.equal(context.starts.length,startsBeforeSoundToggle,'leaving another Options dialog must not resume disabled music');
context.currentTime+=1;
music.control('toggle-music');
assert.equal(originalPlays.at(-1),'vict','re-enabling must use the most recently requested score');
assert.equal(context.starts.at(-1).offset,remixedMusicTiming.vict.cueOffset);

console.log('remixed music synchronization checks passed');
