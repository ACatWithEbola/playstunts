import assert from 'node:assert/strict';
import {bodyPlaneCrosses} from '../lib/physics/body-plane-contact.ts';
const values=[-32768,-8,-7,-6,-5,-1,0,1,5,6,7,8,32767];let cases=0;
for(const old of values)for(const next of values)for(const mode of [0,1,2,255]){
 assert.equal(bodyPlaneCrosses(old,next,mode),mode!==1&&((old<0&&next>0)||(old>0&&next<0)));cases++;
}
assert.equal(bodyPlaneCrosses(65535,1,0),true,'Stored unsigned word must be interpreted as signed');
console.log(cases+' modern guard decisions match the formula independently verified in the original executable; full selection integration remains separate');
