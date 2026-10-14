/** Scratch-only stereo assembly. No timing correction, fades or score-match claim.
 * Usage: SOURCE NEW_OUTPUT FIRST_END STEADY_START STEADY_END REPEATS
 */
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const [source,output,...argumentsSeconds]=process.argv.slice(2);
const [firstEnd,steadyStart,steadyEnd,repeats]=argumentsSeconds.map(Number);
if(!source||!output||argumentsSeconds.length!==4||![firstEnd,steadyStart,steadyEnd].every(Number.isFinite)||firstEnd<=0||steadyStart<0||steadyEnd<=steadyStart||!Number.isInteger(repeats)||repeats<1||repeats>8)throw Error('Invalid scratch assembly arguments');
if(resolve(source)===resolve(output)||existsSync(output))throw Error('Output must be new and different from source');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=sample_rate,channels','-of','json',source],{encoding:'utf8'}));
const stream=probe.streams[0],rate=Number(stream?.sample_rate);
if(stream?.channels!==2||!Number.isInteger(rate)||rate<=0)throw Error('Stereo source with explicit sample rate required');
const pcm=execFileSync('ffmpeg',['-v','error','-i',source,'-map','0:a:0','-f','f32le','pipe:1'],{maxBuffer:256*1024*1024});
if(pcm.length%8)throw Error('Incomplete stereo PCM frame');
const firstFrames=Math.round(firstEnd*rate),startFrame=Math.round(steadyStart*rate),endFrame=Math.round(steadyEnd*rate);
if(firstFrames>pcm.length/8||endFrame>pcm.length/8||endFrame<=startFrame)throw Error('Requested complete traversal is not available in source');
const cycle=pcm.subarray(startFrame*8,endFrame*8);
const assembled=Buffer.concat([pcm.subarray(0,firstFrames*8),...Array(repeats).fill(cycle)]);
execFileSync('ffmpeg',['-v','error','-n','-f','f32le','-ar',String(rate),'-ac','2','-i','pipe:0','-c:a','pcm_f32le',output],{input:assembled,maxBuffer:1024*1024});
const restored=execFileSync('ffmpeg',['-v','error','-i',output,'-map','0:a:0','-f','f32le','pipe:1'],{maxBuffer:256*1024*1024});
if(!restored.equals(assembled))throw Error('Output did not preserve assembled stereo PCM');
console.log(JSON.stringify({source,output,sampleRate:rate,firstFrames,steadyStartFrame:startFrame,steadyFrames:endFrame-startFrame,repeats,totalFrames:assembled.length/8,decodedStereoSamplesPreserved:true,scoreAlignmentVerified:false,audibleSeamVerified:false}));
