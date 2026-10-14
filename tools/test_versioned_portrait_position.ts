import assert from 'node:assert/strict';
import {evaluationPortraitY} from '../lib/game/evaluation-portrait-position.ts';
for(let height=0;height<65536;height++){
 assert.equal(evaluationPortraitY(height),Math.trunc((99-height)/2)||0);
 assert.equal(evaluationPortraitY(height,'ms-1990'),evaluationPortraitY(height));
 assert.equal(evaluationPortraitY(height,'ms-1991'),((99-height)<<16>>16)>>1);
 assert.equal(evaluationPortraitY(height,'ms-1991',true),evaluationPortraitY(height,'ms-1991'));
 assert.equal(evaluationPortraitY(height,'ms-1990',true),Math.trunc(((99-height)<<16>>16)/2)||0);
}
console.log('All65536 portrait heights preserve legacy defaults and select modern signed-shift positioning');
