import assert from 'node:assert/strict';
import {conditionLoopSeam} from './loop_seam_context.mjs';
const input=new Float32Array(2048);
for(let i=0;i<1024;i++){input[i*2]=.2*Math.sin(i*.05)+(i>700?.3:0);input[i*2+1]=-input[i*2];}
const before=input.slice(),result=conditionLoopSeam(input,8000,256.5/8000,768.5/8000,32);
assert.deepEqual(input,before);assert.equal(result.output.length,input.length);
for(let frame=0;frame<1024;frame++)if(frame<result.firstEditedFrame||frame>result.lastEditedFrame)for(let ch=0;ch<2;ch++)assert.equal(result.output[frame*2+ch],input[frame*2+ch]);
const at=(data,f,ch)=>{let i=Math.floor(f);return data[i*2+ch]*(1-(f-i))+data[(i+1)*2+ch]*(f-i);};
for(let ch=0;ch<2;ch++){
 const after=at(result.output,256.5,ch)-at(result.output,767.5,ch);
 const expected=at(input,256.5,ch)-at(input,255.5,ch);
 assert.ok(Math.abs(after-expected)<1e-8,'Seam must follow preceding start context, not duplicate next attack');
}
assert.ok(Math.max(...result.output.map(Math.abs))<=Math.max(...input.map(Math.abs)));
assert.throws(()=>conditionLoopSeam(input,8000,.001,.05,32));
assert.throws(()=>conditionLoopSeam(input,8000,256.5/8000,768/8000,32));
const snapped=conditionLoopSeam(input,8000,(256/8000)*(1-Number.EPSILON),(768/8000)*(1-Number.EPSILON),32);
assert.equal(snapped.loopStartFrame,256);assert.equal(snapped.loopEndFrame,768);
console.log('Context seam preserves source/length/outside PCM and stereo phase; fractional seam follows normal start-context slope; invalid boundaries reject');
