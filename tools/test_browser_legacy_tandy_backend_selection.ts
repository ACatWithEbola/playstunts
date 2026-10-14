import assert from 'node:assert/strict';
import {createBrowserLegacyTandyBackend} from '../lib/game/browser-legacy-tandy-backend.ts';
const device={kind:'tandy' as const,port61:()=>0,interruptCx:()=>0,bios(){}};
for(const driverGeneration of [undefined,'ms-1990'] as const){
 const backend=createBrowserLegacyTandyBackend(48000,{...device,driverGeneration});assert.equal(backend?.profile,'legacy-tandy-virtual');backend!.close();
}
assert.equal(createBrowserLegacyTandyBackend(48000,{...device,driverGeneration:'ms-1991'}),undefined);
assert.equal(createBrowserLegacyTandyBackend(48000,undefined),undefined);
assert.equal(createBrowserLegacyTandyBackend(48000,{kind:'pc-speaker',port61:()=>0}),undefined);
assert.equal(createBrowserLegacyTandyBackend(48000,{kind:'mt32',execute(){throw Error('Unexpected execution');}}),undefined);
console.log('Legacy backend selection uses only Tandy driver identity; modern/non-Tandy routes unchanged, no preview parameter required');
