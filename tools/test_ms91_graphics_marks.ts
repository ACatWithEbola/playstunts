import assert from 'node:assert/strict';
import {markMs91GraphicsChoices} from '../lib/game/ms91-graphics-marks.ts';
import {MS91_DIALOG_TEXT} from '../lib/game/ms91-dialog-resources.ts';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
const original=Array.from(MS91_DIALOG_TEXT.emrl+'\0',c=>c.charCodeAt(0)),before=[...original];
for(const graphics of [0,1,2,3,4])for(const video of [5,6])for(const rate of [7,8]){
 const marked=Array.from({length:9},(_,i)=>[graphics,video,rate].includes(i));
 const bytes=markMs91GraphicsChoices(original,marked),content=originalDialogContent(bytes,line=>line.length,-1,-1,2,'ms-1991');
 assert.equal(content.choices.length,10);
 for(const [index,choice] of content.choices.entries())assert.equal(bytes[choice.offset],index<9&&marked[index]?42:32);
 assert.equal(bytes.filter(byte=>byte===42).length,3);assert.deepEqual(original,before);
}
assert.throws(()=>markMs91GraphicsChoices(original,[]),/nine/);
assert.throws(()=>markMs91GraphicsChoices([0],Array(9).fill(false)),/Incomplete/);
console.log('MS91 graphics marks match original local-copy writes for all20 combinations; Done and source preserved');
