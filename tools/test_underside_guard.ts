import assert from 'node:assert/strict';
import {undersideGuard} from '../lib/physics/underside-guard.ts';
const values=[-32768,-100,-25,-24,-23,-13,-12,-11,-1,0,1,32767];
let checked=0;
for(const flag of [0,1,2,255])for(const old of values)for(const next of values){
 const underside=flag!==0;
 const expected=underside||old>=-12||next>=-12?'normal':next<=-24?'ground-fallback':'underside-crash';
 assert.equal(undersideGuard(underside,old,next),expected);
 assert.equal(undersideGuard(underside,old&65535,next&65535),expected);
 checked++;
}
console.log(checked+' original-verified underside decisions match signed and unsigned stored words');
