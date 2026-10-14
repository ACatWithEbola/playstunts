import assert from 'node:assert/strict';
import {originalDialogInput} from '../lib/game/dialog-input.ts';
import {originalDialogSession} from '../lib/game/dialog-session.ts';
import {originalDialogContent} from '../lib/game/dialog-content.ts';
let cases=0,startupCases=0;
for(let count=1;count<=8;count++)for(let mask=0;mask<(1<<count)-1;mask++)for(let selected=0;selected<count;selected++){
 const disabled=Array.from({length:count},(_,n)=>(mask>>>n)&1);
 const text=Array.from('Title]'+Array.from({length:count},(_,n)=>'['+String.fromCharCode(65+n)+']').join('')+'\0',c=>c.charCodeAt(0));
 const content=originalDialogContent(text,line=>line.length,-1,-1,2,'ms-1991');
 const initial=Array.from({length:count},(_,n)=>(selected+n)%count).find(n=>!disabled[n]);
 const session=originalDialogSession(content,2,selected,disabled,undefined,'ms-1991');
 assert.deepEqual(session.next().value,{type:'draw',selected:initial});
 const legacySession=originalDialogSession(content,2,selected,disabled);
 assert.deepEqual(legacySession.next().value,{type:'draw',selected});
 startupCases++;
 for(const key of [0x4800,0x4b00,0x4d00,0x5000]){
  const direction=key===0x4800||key===0x4b00?-1:1;
  const enabled=Array.from({length:count},(_,n)=>(selected+direction*(n+1)+count*2)%count).find(n=>!disabled[n]);
  assert.equal(originalDialogInput({count,selected,hover:-1,key,disabled,physicsEngine:'ms-1991'}).selected,enabled);
  const legacy=originalDialogInput({count,selected,hover:-1,key,disabled});
  assert.deepEqual(legacy,originalDialogInput({count,selected,hover:-1,key,disabled,physicsEngine:'ms-1990'}));cases++;
 }
}
assert.equal(originalDialogInput({count:3,selected:1,hover:-1,key:0x4800,disabled:[1,1,1],physicsEngine:'ms-1991'}).selected,1);
assert.equal(originalDialogInput({count:3,selected:0,hover:-1,key:0x4800}).selected,0);
assert.equal(originalDialogInput({count:3,selected:2,hover:-1,key:0x5000}).selected,2);
console.log(JSON.stringify({cases,startupCases,modernWrapAndDisabledSkipping:true,legacyClampingUnchanged:true,allDisabledSafetyBound:true,pass:true}));
