import assert from 'node:assert/strict';
import {i16,intSin,intCos} from '../lib/physics/math.ts';
import {rotateY} from '../lib/physics/rotation.ts';
import {scaleSteeringWord} from '../lib/physics/engine-version.ts';
// Original legacy abs/SAR/sign overflows only at -32768. The resulting quarter
// differs from the existing helper by16384, exactly16 full1024-unit turns.
// Preserve the existing legacy helper: prove geometric periodicity separately
// without claiming the retained angle word is bit-identical at this edge.
const original=8192,native=scaleSteeringWord(-32768,2,'ms-1990');
assert.equal(native,-8192);assert.equal(original-native,16*1024);
for(let word=0;word<65536;word++){
 const angle=i16(word),a=i16(angle-original),b=i16(angle-native);
 assert.equal(intSin(a),intSin(b));assert.equal(intCos(a),intCos(b));
 assert.deepEqual(rotateY(a),rotateY(b));
}
console.log('65536 wheel-angle cases: original legacy quarter overflow and preserved helper yield identical rotation matrices; retained raw angle words differ and are not claimed exact');
