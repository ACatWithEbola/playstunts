import assert from 'node:assert/strict';
import {createBrowserMs91TandyPreview} from './research-tandy-preview.ts';
const device={kind:'tandy' as const,driverGeneration:'ms-1991' as const,port61:()=>0,interruptCx:()=>0,bios(){}};
for(const hostname of ['playstunts.com','example.com','localhost.example.com'])assert.equal(createBrowserMs91TandyPreview(48000,device,{hostname,search:'?preview-tandy=full'}),undefined);
assert.equal(createBrowserMs91TandyPreview(48000,device,{hostname:'localhost',search:''}),undefined);
assert.equal(createBrowserMs91TandyPreview(48000,{...device,driverGeneration:'ms-1990'},{hostname:'localhost',search:'?preview-tandy=full'}),undefined);
for(const hostname of ['localhost','127.0.0.1','[::1]','::1']){const binding=createBrowserMs91TandyPreview(48000,device,{hostname,search:'?preview-tandy=full'});assert.ok(binding);assert.equal(binding.sampleRate,48000);binding.close();}
console.log('Experimental full Tandy profile requires explicit loopback query and modern driver; default/public/legacy launches unchanged');
