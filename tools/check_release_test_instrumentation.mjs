import {readFileSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const markers=['preview-audio','preview-mt32','preview-tandy','browserTestAudioMuted','silentAudioOutputContext','testAudioOutput','testMusicScore','testMusicFrames','testMusicNonzero','testMusicPeak','testMusicClock','qaMusicBuffer','qa-driving','qaDriving','local-driving-telemetry'];
markers.push('testRaceAudioMaxGapSeconds','testRaceAudioBuffers','testRaceAudioMaxGapDetail');
markers.push('testRaceFrameWaitDetail');
markers.push('testMusicTransitionBefore','testMusicTransitionAfter');
markers.push('testNativeFileAliases');
markers.push('preview-suno-score');
markers.push('dataset.raceFrame','dataset.raceClock','raceClockBlocked','raceAudioState','raceAudioTime');
export function releaseInstrumentationFindings(entries){
 return entries.flatMap(({path,source})=>markers.filter(marker=>source.includes(marker)).map(marker=>`${path}: ${marker}`));
}
function sources(root){
 const entries=[];
 function walk(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){
  const path=resolve(directory,entry.name);
  if(entry.isDirectory())walk(path);
  else if(entry.isFile()&&/\.(?:tsx?|m?js)$/.test(entry.name))entries.push({path:relative(root,path),source:readFileSync(path,'utf8')});
 }}
 for(const directory of ['app','lib'])walk(resolve(root,directory));
 return entries;
}
export function builtInstrumentationFindings(directory){
 const entries=[];
 function walk(root){for(const entry of readdirSync(root,{withFileTypes:true})){
  const path=resolve(root,entry.name);
  if(entry.isDirectory())walk(path);
  else if(entry.isFile()&&/\.(?:js|mjs|cjs)$/.test(entry.name))entries.push({path:relative(directory,path),source:readFileSync(path,'utf8')});
 }}
 walk(directory);
 if(!entries.length)throw Error('No compiled JavaScript found; build verification cannot pass an empty directory');
 return {files:entries.length,findings:releaseInstrumentationFindings(entries)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const built=process.argv.includes('--built')?builtInstrumentationFindings(resolve('dist')):undefined;
 const findings=built?.findings??releaseInstrumentationFindings(sources(process.cwd()));
 if(findings.length){console.error('Release blocked: remove temporary browser test instrumentation.\n'+findings.join('\n'));process.exitCode=1;}
 else console.log(built?`Compiled release: ${built.files} JavaScript files contain no temporary browser audio mute/diagnostic instrumentation`:'Release source contains no temporary browser audio mute/diagnostic instrumentation');
}
