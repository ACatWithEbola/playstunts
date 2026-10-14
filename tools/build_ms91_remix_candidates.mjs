/** Actual user Suno recordings: timing/loops/fades only, no reconstruction.
 * Reproducible UNAPPROVED scratch candidates. Never publishes assets. */
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,isAbsolute,join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
const [sourceDirectory,outputDirectory]=process.argv.slice(2);
if(!sourceDirectory||!outputDirectory||!isAbsolute(sourceDirectory)||!isAbsolute(outputDirectory))throw Error('Supply absolute source directory and NEW scratch output directory');
const output=resolve(outputDirectory),sourceRoot=resolve(sourceDirectory);
if(existsSync(output)||output===sourceRoot||output.startsWith(sourceRoot+'/')||output.startsWith(resolve('public')+'/'))throw Error('Refusing existing/source/public output location');
const physicalOutput=join(realpathSync(dirname(output)),basename(output)),publicRoot=realpathSync('public'),physicalSource=realpathSync(sourceRoot);
if(physicalOutput===publicRoot||physicalOutput.startsWith(publicRoot+'/')||physicalOutput===physicalSource||physicalOutput.startsWith(physicalSource+'/'))throw Error('Refusing source/public location through symbolic link');
const sources={titl:'01 - Opening and Title - Suno.wav',slct:'02 - Menu and Selection - Suno.wav',vict:'03 - Victory - Suno.wav',over:'04 - Game Over - Suno.wav'};
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const sourceHashes=Object.fromEntries(Object.entries(sources).map(([name,file])=>[name,hash(join(sourceRoot,file))]));
for(const file of Object.values(sources)){
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=sample_rate,channels','-of','json',join(sourceRoot,file)],{encoding:'utf8'})).streams[0];
 if(Number(probe?.sample_rate)!==48000||probe?.channels!==2)throw Error('Measured recipes require the original48000Hz stereo exports');
}
mkdirSync(output);
const steps=[];
function render(name,input,filter,complex=false){
 const destination=join(output,name+'.wav');
 const args=['-v','error','-n','-i',input,...(complex?['-filter_complex',filter,'-map','[out]']:['-af',filter]),'-c:a','pcm_f32le',destination];
 execFileSync('ffmpeg',args,{maxBuffer:1024*1024});
 steps.push({name,input,filter,complex,sha256:hash(destination)});return destination;
}
const core={};
for(const [name,cue,tempo] of [['titl',.052244897959183696,.9930340136054422],['slct',.7836402980239715,.9915744735989634],['vict',.40263401360544215,.999071201814059],['over',.48427426843753374,.9902144476838355]])
 core[name]=render(name,join(sourceRoot,sources[name]),`atrim=start=${cue},asetpts=PTS-STARTPTS,atempo=${tempo}`);
const rest=render('over-rest',core.over,'[0:a]asplit=2[a][b];[a]atrim=end=28.186,afade=t=out:st=27.5505:d=0.6355,asetpts=PTS-STARTPTS[first];anullsrc=r=48000:cl=stereo,atrim=duration=2.33253125[rest];[b]atrim=start=30.030912202381,asetpts=PTS-STARTPTS[second];[first][rest][second]concat=n=3:v=0:a=1[out]',true);
for(const [name,input,first,start,end] of [['titl',core.titl,24.11046875,24.11046875,48.05084375],['vict',core.vict,25.9705,25.9705,51.770875]]){
 const destination=join(output,name+'-three-cycle.wav');
 const report=JSON.parse(execFileSync(process.execPath,['tools/assemble_remix_repeat.mjs',input,destination,String(first),String(start),String(end),'2'],{encoding:'utf8'}));
 steps.push({name:name+'-three-cycle',assembly:report,sha256:hash(destination)});
}
for(const [name,input,first,headEnd,tailStart] of [['slct',core.slct,48.08084375,60.08084375,12.200125],['over',rest,30.51853125,55.51853125,25.0480625]])
 render(name+'-three-cycle',input,`[0:a]asplit=3[a][b][c];[a]atrim=end=${first},asetpts=PTS-STARTPTS[first];[b]atrim=start=${first}:end=${headEnd},asetpts=PTS-STARTPTS[head];[c]atrim=start=${tailStart}:end=${first},asetpts=PTS-STARTPTS[tail];[head][tail]concat=n=2:v=0:a=1[steady];[steady]asplit=2[s1][s2];[first][s1][s2]concat=n=3:v=0:a=1[out]`,true);
// Four milliseconds of the same Suno recording, blended at its Title wrap.
// This changes neither duration nor the score schedule; no synthesized layers.
const titleLoopDirectory=join(output,'title-loop');
const titleLoop=JSON.parse(execFileSync(process.execPath,['tools/build_loop_seam_trial.mjs',join(output,'titl-three-cycle.wav'),titleLoopDirectory,'24.11046875','48.05084375','192'],{encoding:'utf8'}));
const titleLoopPath=join(titleLoopDirectory,'loop-seam-trial.wav');
steps.push({name:'titl-loop',outputPath:'title-loop/loop-seam-trial.wav',source:'titl-three-cycle.wav',assembly:titleLoop,sha256:hash(titleLoopPath)});
for(const [name,file] of Object.entries(sources))if(hash(join(sourceRoot,file))!==sourceHashes[name])throw Error('Source changed during candidate generation');
const manifest={sourceRoot,sourceHashes,steps,sourceFilesUnchanged:true,actualSunoRecordingsOnly:true,reconstructedMusicAllowed:false,originalMusicModified:false,approvedForGame:false,individualNotesVerified:false,audibleSeamsVerified:false,referenceProfile:'virtual CPU4772728Hz/poll20cycles; not physical hardware'};
writeFileSync(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,files:steps.length,sourceFilesUnchanged:true,approvedForGame:false}));
