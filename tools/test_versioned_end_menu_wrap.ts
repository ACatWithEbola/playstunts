import assert from 'node:assert/strict';
import {advanceOriginalEndMenu} from '../lib/game/end-menu-input.ts';
let cases=0;
for(const evaluationAvailable of [0,1])for(const evaluationStatus of [0,2,255])for(const selected of [0,1,2,3])for(const key of [0x4b00,0x4d00]){
 const before={evaluationAvailable,evaluationStatus,selected,showEvaluation:1},source={...before};
 const implicit=advanceOriginalEndMenu(before,key),legacy=advanceOriginalEndMenu({...before,physicsEngine:'ms-1990'},key);
 assert.equal(implicit.state.selected,legacy.state.selected);
 const modern=advanceOriginalEndMenu({...before,physicsEngine:'ms-1991'},key),first=evaluationAvailable&&evaluationStatus!==255?0:1;
 const expected=key===0x4b00?(selected>first?selected-1:3):(selected<3?selected+1:first);
 assert.equal(modern.state.selected,expected);assert.equal(modern.action,'wait');assert.deepEqual(before,source);cases++;
}
console.log(JSON.stringify({cases,modernWrapVerified:true,legacyClampingPreserved:true,pass:true}));
