/** Bounded offline candidate, never a game asset or fidelity approval. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {isAbsolute,dirname,basename,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
import {bassNotePlan} from './bass_note_plan.mjs';
import {renderHarmonicBass} from './render_harmonic_bass.mjs';
const [source,tracePath,python,destination,channelText='5',cycleOption]=process.argv.slice(2);
const channel=Number(channelText);
const titleBass=cycleOption==='--title-bass-cycles'&&channel===2;
const titleLead=cycleOption==='--title-lead-cycles'&&channel===5;
const titleAccompaniment=cycleOption==='--title-accompaniment-cycles'&&channel===3;
const resultBassTemplates={'--victory-bass-harmonics':{start:'3.075',seconds:'0.05',low:'51.7',high:'51.8'},'--gameover-bass-harmonics':{start:'3',seconds:'0.075',low:'55.3',high:'55.6'}};
const resultBass=channel===2?resultBassTemplates[cycleOption]:undefined;
const resultLead=channel===5?({'--victory-lead-cycles':['5','0.1','138.5'],'--gameover-lead-cycles':['5.05','0.05','248.5']}[cycleOption]):undefined;
const resultAccompaniment=cycleOption==='--victory-accompaniment-cycles'&&[3,4].includes(channel)?{program:92,name:'accompaniment'+channel,parameters:['25.5','0.05','622.5']}:cycleOption==='--gameover-accompaniment-cycles'&&channel===6?{program:34,name:'accompaniment',parameters:['42.7','0.1','740.5']}:undefined;
if(![5,8].includes(channel)&&!titleBass&&!titleAccompaniment&&!resultBass&&!resultAccompaniment)throw Error('Require explicit supported melodic layer');
if(cycleOption&&!titleBass&&!titleLead&&!titleAccompaniment&&!resultBass&&!resultLead&&!resultAccompaniment&&(cycleOption!=='--source-cycles'||channel!==8))throw Error('Source-cycle trial requires explicit supported layer');
// The first original lead attack maps to about 8.895 s in the Suno mix.
// Sample its sustained register, not the lower accompaniment at 8.4 s.
// Harmony5.1s is a cleaner E3-like segment than the simultaneous-note0.99s
// chord. Still only a spectral approximation, not certified voice separation.
const template=resultAccompaniment??(resultBass?{...resultBass,program:30,name:'bass',analysisRate:'8000'}:titleAccompaniment?{program:92,name:'accompaniment'}:titleBass?{program:30,name:'bass'}:channel===5?{start:'8.94',low:'730',high:'750',program:24,name:'lead',analysisRate:'32000'}:{start:'5.1',low:'155',high:'175',program:62,name:'harmony',analysisRate:'16000'});
if(![source,tracePath,python,destination].every(p=>p&&isAbsolute(p))||existsSync(destination))throw Error('Require absolute inputs and NEW output');
const physical=join(realpathSync(dirname(destination)),basename(destination)),publicRoot=realpathSync('public');
if(physical===publicRoot||physical.startsWith(publicRoot+'/'))throw Error('Candidate cannot be a public asset');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),before=[source,tracePath].map(hash);
const trace=JSON.parse(readFileSync(tracePath)),part=trace.finalChannelAssignments.indexOf(channel);
if(trace.generation!=='ms-1991'||trace.sampleRate!==32000||![384000,1920000,3200000,6400000].includes(trace.frames)||part<0||trace.finalPatchTemp[part*16+5]!==0)throw Error('Require explicit12s/60s/100s/200s modern single-assignment capture');
if(trace.finalPatchTemp[part*16+2]!==24)throw Error('Coarse patch key shift requires explicit note transposition before rendering');
const decoded=decodeDeliveredMidi(trace.events);
if(decoded.partial||decoded.interruptions.some(event=>event.kind!=='unterminated-sysex'))throw Error('Incomplete MIDI capture');
const selected=decoded.messages.filter(event=>(event.status&15)===channel&&event.status<0xf0);
if(selected.some(event=>(event.status&0xf0)===0xc0&&event.data[0]!==template.program))throw Error('Instrument changes require separate Suno templates');
// Original vibrato is not the requested Updated-music timbre. Retain the
// captured modulation as provenance, explicitly not modeled in this trial.
const expression=selected.filter(event=>[0xa0,0xd0,0xe0].includes(event.status&0xf0)||((event.status&0xf0)===0xb0&&event.data[0]===1));
const plan=bassNotePlan(selected.filter(event=>!expression.includes(event)),trace.frames,channel,'verified-single-assign');
// Explicit approximation for the original's unreleased high startup note;
// retain its attack/span and Suno-derived spectrum, not constant full volume.
if(titleBass)for(const note of plan.notes)if(note.pitch===123)note.amplitudeModel={decaySeconds:3.8,sustainGain:.13};
const cycleParameters=resultAccompaniment?.parameters??resultLead??(titleBass?['43.95','0.075','69.4']:titleLead?['5','0.05','138.9']:titleAccompaniment?['5.85','0.05','165']:[]);
const model=cycleOption&&!resultBass?{kind:'source-cycle-average',model:JSON.parse(execFileSync(python,['tools/source_cycle_template.py',source,...cycleParameters],{encoding:'utf8'}))}:JSON.parse(execFileSync(python,['tools/analyze_bass_sample_harmonics.py',source,'--start',template.start,'--seconds',template.seconds??'.05','--low',template.low,'--high',template.high,'--analysis-rate',template.analysisRate,'--step','.025',...(resultBass?['--harmonics','32']:[])],{encoding:'utf8'}));
if((!cycleOption||resultBass)&&model.model.residualEnergyFraction>.5)throw Error('Template exceeds bounded experimental fit limit');
const rate=48000,frames=trace.frames*rate/trace.sampleRate,result=renderHarmonicBass(plan.notes,model.model.stereoCoefficients,trace.sampleRate,rate,frames,[],titleBass||titleAccompaniment||resultLead||resultAccompaniment?'truncate':'reject');
const wav=Buffer.alloc(44+result.pcm.length*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(3,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*8,28);wav.writeUInt16LE(8,32);wav.writeUInt16LE(32,34);wav.write('data',36);wav.writeUInt32LE(result.pcm.length*4,40);result.pcm.forEach((value,index)=>wav.writeFloatLE(value,44+index*4));
if([source,tracePath].some((p,i)=>hash(p)!==before[i]))throw Error('Source changed');
mkdirSync(destination);writeFileSync(join(destination,template.name+'-audition.wav'),wav,{flag:'wx'});
writeFileSync(join(destination,'manifest.json'),JSON.stringify({channel,layer:template.name,inputHashes:before,model,plan,events:result.events,capturedExpression:expression,rate,frames,approvedForGame:false,audibleTimingVerified:false,sunoCharacterVerified:false,scope:'Isolated harmonic melodic-layer candidate; original note trigger/release frames, estimated Suno spectral template and provisional envelopes. Static controllers retained, not emulated; original fine expression deliberately not copied. Not a complete remix.'},null,2),{flag:'wx'});
console.log(JSON.stringify({destination,channel,notes:plan.notes.length,firstTriggerFrame:plan.notes[0]?.startFrame,residualEnergyFraction:model.model.residualEnergyFraction,approvedForGame:false}));
