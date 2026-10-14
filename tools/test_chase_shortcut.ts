import assert from 'node:assert/strict';
import {isChaseToggle} from '../lib/game/chase-shortcut.ts';
const event={code:'KeyV',ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,repeat:false};
for(const edition of ['ms-1990','ms-1991']){
 assert.equal(isChaseToggle(event),false,edition+': plain V must remain available to replay-name entry');
 assert.equal(isChaseToggle({...event,ctrlKey:true}),true,edition+': Ctrl+V selects chase');
 for(const modifier of ['metaKey','altKey','shiftKey','repeat'])assert.equal(isChaseToggle({...event,ctrlKey:true,[modifier]:true}),false);
 assert.equal(isChaseToggle({...event,ctrlKey:true,code:'KeyC'}),false);
}
console.log('Shared chase shortcut accepts only Ctrl+V; plain V and modified/repeated keys remain unconsumed');
