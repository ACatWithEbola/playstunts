import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {isFpsToggle} from '../lib/game/enhanced-shortcuts.ts';
import {routeDisplay} from '../lib/server/route-display.ts';
import {originalKeyboardScanWord} from '../lib/game/keyboard-scan-word.ts';
test('FPS requires Ctrl+F; plain F remains available for names',()=>{
 assert.match(readFileSync(new URL('../app/OpeningSequence.tsx',import.meta.url),'utf8'),/\[performanceVisible,setPerformanceVisible\]=useState\(false\)/,'FPS overlay starts hidden');
 const event={code:'KeyF',ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,repeat:false};
 assert.equal(isFpsToggle(event),false);assert.equal(isFpsToggle({...event,ctrlKey:true}),true);
 for(const modifier of ['metaKey','altKey','shiftKey','repeat'])assert.equal(isFpsToggle({...event,ctrlKey:true,[modifier]:true}),false);
 assert.equal(isFpsToggle({...event,ctrlKey:true,code:'KeyV'}),false);
 assert.equal(originalKeyboardScanWord(33,()=>false),102,'Lowercase f reaches original name input');
 assert.equal(originalKeyboardScanWord(33,scan=>scan===42),70,'Uppercase F reaches original name input');
});
test('two public labels preserve the distinction between evidence and uncertainty',()=>{
 assert.equal(routeDisplay('full_route').label,'Full run');
 assert.equal(routeDisplay('shortcuts_detected').label,'Possibly exploited');
 assert.match(routeDisplay('shortcuts_detected').detail,/confirms/);
 assert.equal(routeDisplay('not_assessed').label,'Possibly exploited');
 assert.match(routeDisplay('not_assessed').detail,/does not prove/);
 assert.equal(routeDisplay().label,'Possibly exploited');
});
