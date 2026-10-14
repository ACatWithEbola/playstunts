import assert from 'node:assert/strict';
import {wallCrashThreshold} from '../lib/physics/wall-response.ts';
import {i16,u16} from '../lib/physics/math.ts';
let differences=0;
for(let direction=0;direction<1024;direction++){
 const impact=direction>256?1024-direction:direction,product=i16(impact*70);
 assert.notEqual(product,-32768,'Legacy minimum-word overflow unreachable in this folded domain');
 const old=wallCrashThreshold(impact,'ms-1990'),modern=wallCrashThreshold(impact,'ms-1991');
 assert.equal(old,u16((100-Math.trunc(product/256))<<8));
 assert.equal(modern,u16((100-(product>>8))<<8));
 assert.equal(wallCrashThreshold(impact),old,'Unlabelled legacy unchanged');
 if(old!==modern)differences++;
}
assert(differences>0);
console.log(`All1024 folded wall-impact directions checked;${differences} modern thresholds differ as original SAR8 requires; legacy/default unchanged`);
