import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {join,isAbsolute,dirname,basename} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
import {bassNotePlan} from './bass_note_plan.mjs';
import {renderHarmonicBass} from './render_harmonic_bass.mjs';
const [source,tracePath,python,destination,secondsText]=process.argv.slice(2);
const seconds=secondsText===undefined?8:Number(secondsText);
if(!Number.isSafeInteger(seconds)||seconds<8||seconds>100)throw Error('Require bounded8..100second audition');
if(![source,tracePath,python,destination].every(p=>p&&isAbsolute(p))||existsSync(destination))throw Error('Require explicit absolute inputs and NEW audition directory');
const physical=join(realpathSync(dirname(destination)),basename(destination)),publicRoot=realpathSync('public');
if(physical===publicRoot||physical.startsWith(publicRoot+'/'))throw Error('Audition cannot be a game asset');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),before=[source,tracePath].map(hash);
const model=JSON.parse(execFileSync(python,['tools/analyze_bass_sample_harmonics.py',source,'--start','3.3','--seconds','.15','--low','58','--high','66'],{encoding:'utf8'}));
if(model.model.residualEnergyFraction>.1)throw Error('Harmonic candidate too impure for bounded trial');
const trace=JSON.parse(readFileSync(tracePath)),part=trace.finalChannelAssignments.indexOf(2);
if(trace.generation!=='ms-1991'||part<0||trace.finalPatchTemp[part*16+5]!==0)throw Error('Require verified Menu single-assignment snapshot');
const sourceFrames=seconds*trace.sampleRate;if(trace.frames<sourceFrames)throw Error('Trace too short');
const decoded=decodeDeliveredMidi(trace.events.filter(e=>e[0]<sourceFrames));
if(decoded.partial||decoded.interruptions.some(event=>event.kind!=='unterminated-sysex'))throw Error('Incomplete original MIDI');
// Raw driver SysEx can be aborted by a channel status. The existing unit
// router drops that incomplete packet and forwards the channel status.
const plan=bassNotePlan(decoded.messages,sourceFrames,2,'verified-single-assign');
// The template is not a general MIDI synthesizer. Permit only this observed
// static Menu setup; don't silently discard dynamic expression changes.
for(const control of plan.controls){
 const kind=control.status&0xf0,[number,value]=control.data;
 if(kind===0xc0){if(number!==30||control.frame>=plan.notes[0].startFrame)throw Error('Unsupported instrument change');}
 else if(number===7){if(value!==127)throw Error('Unsupported dynamic volume');}
 else if(number===10){if(value!==70)throw Error('Unsupported pan change');}
 else if((number===121||number===123)&&control.frame>=plan.notes[0].startFrame)throw Error('Unsupported active controller reset');
}
if(plan.notes.some(n=>![40,42,45,47,49,50,52,54].includes(n.pitch)||n.velocity!==127))throw Error('Unexpected Menu trial notes');
const rate=48000,frames=seconds*rate,result=renderHarmonicBass(plan.notes,model.model.stereoCoefficients,trace.sampleRate,rate,frames);
const wav=Buffer.alloc(44+result.pcm.length*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(3,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*8,28);wav.writeUInt16LE(8,32);wav.writeUInt16LE(32,34);wav.write('data',36);wav.writeUInt32LE(result.pcm.length*4,40);result.pcm.forEach((v,i)=>wav.writeFloatLE(v,44+i*4));
if([source,tracePath].some((p,i)=>hash(p)!==before[i]))throw Error('Source changed');
mkdirSync(destination);writeFileSync(join(destination,'bass-audition.wav'),wav,{flag:'wx'});
writeFileSync(join(destination,'manifest.json'),JSON.stringify({source,tracePath,inputHashes:before,model,plan,events:result.events,rate,frames,seconds,staticMenuControlsChecked:true,approvedForGame:false,audibleAlignmentVerified:false,controllerTimbrePanAndEnvelopeFidelityVerified:false,scope:'Bounded isolated Suno-derived harmonic-template bass. Original byte trigger frames and pitches; provisional5ms attack/20ms release/2ms retrigger abort, no Munt processing-delay/envelope equivalence. Static controls validated, not emulated. Not original Suno stem or full-mix replacement.'},null,2),{flag:'wx'});
console.log(JSON.stringify({destination,notes:plan.notes.length,frames,approvedForGame:false}));
