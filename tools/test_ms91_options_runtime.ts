import assert from 'node:assert/strict';
import {runNativeOptions,type NativeOptionsHost} from '../lib/game/native-options-runtime.ts';
const settings={mouse:false,joystick:false,graphics:2},modern={graphics:2,slowVideoManagement:false,configuredFramesPerSecond:20 as 10|20};
const events:string[]=[],choices=[6,7,1,9],options=[4,6];let notices=0;
const host:NativeOptionsHost={physicsEngine:'ms-1991',settings,ms91GraphicsSettings:modern,pixels:new Uint8Array(65536),font:new Uint8Array(4096),resources:{},present(){},async input(){throw Error('Unexpected input');},async release(){},async gameCounter(){return 0;},async enumerate(){return [];},async editPath(path){return {path,key:27};},async audio(operation){events.push(operation);return 0;},async calibrateJoystick(){throw Error('Unexpected calibration');},replayPath:'C:\\',async loadReplay(){throw Error('Unexpected replay load');}};
const result=await runNativeOptions(host,{background(){events.push('background');},capture(){events.push('capture');return {restore(){events.push('restore');},close(){events.push('close');}};},dialogs:{async file(){return undefined;},async dialog(resource,mode,selected,border,disabled,marked){
 if(resource==='emop')return options.shift()!;
 if(resource==='emrs'){notices++;assert.equal(mode,4);return 0;}
 assert.equal(resource,'emrl');assert.equal(mode,2);assert.equal(border,1);assert.equal(disabled,undefined);assert.equal(marked?.filter(Boolean).length,3);
 assert.equal(marked?.[modern.graphics],true);assert.equal(marked?.[modern.slowVideoManagement?6:5],true);assert.equal(marked?.[modern.configuredFramesPerSecond===10?7:8],true);
 return choices.shift()!;
}}});
assert.equal(result,'menu');assert.equal(notices,1);assert.equal(settings.graphics,1);
assert.deepEqual(modern,{graphics:1,slowVideoManagement:true,configuredFramesPerSecond:10});
assert.deepEqual(events,['background','capture','pause-audio','resume-audio','restore','close']);
assert.equal(choices.length,0);assert.equal(options.length,0);
console.log('Native Options routes explicit MS91 graphics settings, marks and notice through the retained presentation/audio lifecycle');
const legacySettings={mouse:false,joystick:false,graphics:2},legacyModern=structuredClone(modern),legacyBefore=structuredClone(legacyModern),legacyOptions=[4,6];let legacyMenuCalls=0;
await runNativeOptions({...host,physicsEngine:'ms-1990',settings:legacySettings,ms91GraphicsSettings:legacyModern},{background(){},capture(){return {restore(){},close(){}};},dialogs:{async file(){return undefined;},async dialog(resource,mode,selected,border,disabled,marked){
 if(resource==='emop')return legacyOptions.shift()!;
 assert.equal(resource,'emrl');assert.equal(marked,undefined);assert.equal(selected,2);legacyMenuCalls++;return 3;
}}});
assert.equal(legacyMenuCalls,1);assert.equal(legacySettings.graphics,3);assert.deepEqual(legacyModern,legacyBefore);
console.log('Legacy Options ignores MS91 settings and retains its original one-selection graphics flow');
for(const retainedDisplay of [false,true]){
 const recovery:string[]=[];let optionCalls=0;
 const failure=new Error('Injected graphics dialog failure');
 const failedHost:NativeOptionsHost={...host,pixels:new Uint8Array(65536).fill(7),settings:{mouse:false,joystick:false,graphics:2},ms91GraphicsSettings:{graphics:2,slowVideoManagement:false,configuredFramesPerSecond:20},present(){recovery.push('present');},async audio(operation){recovery.push(operation);return 0;}};
 const display={background(){},capture(){recovery.push('capture');return {restore(){recovery.push('restore');},close(){recovery.push('close');}};},dialogs:{async file(){return undefined;},async dialog(resource:string){
  if(resource==='emop'){optionCalls++;return 4;}
  failedHost.pixels.fill(9);throw failure;
 }}};
 // Exercise retained-display recovery, including a capture that restores pixels.
 if(!retainedDisplay)display.capture=()=>({restore(){failedHost.pixels.fill(7);recovery.push('restore');},close(){recovery.push('close');}});
 await assert.rejects(runNativeOptions(failedHost,display),error=>error===failure);
 assert.equal(optionCalls,1);assert.equal(recovery.filter(x=>x==='pause-audio').length,1);assert.equal(recovery.filter(x=>x==='resume-audio').length,1);
 assert.equal(recovery.filter(x=>x==='restore').length,1);assert.equal(recovery.filter(x=>x==='close').length,1);
 if(!retainedDisplay)assert.ok(failedHost.pixels.every(x=>x===7));
 assert.ok(recovery.indexOf('resume-audio')<recovery.indexOf('restore'));
}
console.log('MS91 dialog failures resume audio and restore/close retained screens without hiding the original error');
