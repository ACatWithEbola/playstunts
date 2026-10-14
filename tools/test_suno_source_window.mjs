import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {sunoSourceWindow} from './suno_source_window.mjs';
import {sunoPitchFilter} from './suno_pitch_filter.mjs';
const root=mkdtempSync(join(tmpdir(),'suno-window-test-'));
for(const rate of [32000,44100,48000]){
 const frames=Math.round(rate*.6),wav=Buffer.alloc(44+frames*4);
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(3,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(32,34);wav.write('data',36);wav.writeUInt32LE(frames*4,40);
 for(let i=0;i<frames;i++){const t=i/rate;wav.writeFloatLE(t>=.15&&t<.225?.3*Math.sin(2*Math.PI*265*t):0,44+i*4);}
 const path=join(root,rate+'.wav');writeFileSync(path,wav,{flag:'wx'});
 const run=rateChanging=>execFileSync('ffmpeg',['-v','error',...sunoSourceWindow(path,.15,.075,rateChanging),'-af',sunoPitchFilter(48000,17208).join(','),'-ar','48000','-ac','1','-f','f32le','pipe:1']);
 const rms=b=>{let sum=0;for(let i=0;i<b.length;i+=4)sum+=b.readFloatLE(i)**2;return Math.sqrt(sum/(b.length/4));};
 const correct=run(true),wrong=run(false);
 assert.ok(rms(correct)>.15,'Selected transient disappeared');
 assert.ok(rms(wrong)<.001,'Negative control must select earlier silence');
 assert.ok(correct.length/4>9900&&correct.length/4<10200,'Source span did not follow rate change');
}
for(const args of [['relative',0,.1],[root,-1,.1],[root,0,NaN],[root,0,3]])assert.throws(()=>sunoSourceWindow(...args));
console.log('Actual FFmpeg source-window selection retains pitched transient at32/44.1/48kHz; output-time negative controls select silence; malformed windows reject');
