import assert from 'node:assert/strict';
import {stepVoiceDuration} from '../lib/game/voice-duration.ts';
for(const generation of [undefined,'ms-1990','ms-1991'] as const)for(const remaining of [0,1,65535,65536,4294967295])for(const flag of [0,1]){
 const voice=new Uint8Array(46);voice[1]=1;voice[44]=2;new DataView(voice.buffer).setUint32(12,remaining,true);
 const snapshot=voice.slice(),result=stepVoiceDuration(voice,flag,generation);
 assert.deepEqual(voice,snapshot);
 assert.equal(new DataView(result.record.buffer).getUint32(12,true),generation==='ms-1991'&&remaining===0?0:(remaining-1)>>>0);
 assert.deepEqual(result.releaseChannels,remaining===0?[2]:[]);
 if(remaining===0){assert.equal(result.record[1],2);assert.equal(result.record[22],flag?3:4);}
}
console.log('Versioned zero-duration behavior matches independently executed original helpers; untagged remains legacy and inputs unchanged');
