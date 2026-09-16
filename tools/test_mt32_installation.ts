import assert from 'node:assert/strict';
import {test} from 'node:test';
import {browserMt32Installed} from '../lib/game/browser-mt32-installation.ts';

const hashes:Record<number,string>={
 65536:'a73a06c23ed38370e58a11fb1b86f7ea4c547061a60d7aa62bae446235fd2dff',
 524288:'d9164063f293410cf33f2f64cdcea6893b44723fe41938e07ec9aef58b406238',
};
const hashBytes=(hex:string)=>Uint8Array.from(hex.match(/../g)!,byte=>parseInt(byte,16)).buffer;
const request=(status=200,wrongSize=false)=>async(input:string|URL|Request)=>{
 const path=typeof input==='string'?input:input instanceof URL?input.href:input.url,size=path.endsWith('/ctrl_mt32_1_07.rom')?65536:path.endsWith('/pcm_mt32.rom')?524288:assert.fail('Unexpected MT-32 request: '+path);
 return new Response(new Uint8Array(wrongSize?size-1:size),{status});
};
const digest=async(bytes:ArrayBuffer)=>hashBytes(hashes[bytes.byteLength]??'00'.repeat(32));

await test('MT-32 installation accepts only the complete supported ROM pair',async()=>{
 const signal=new AbortController().signal;
 assert.equal(await browserMt32Installed(signal,request(),digest),true);
 assert.equal(await browserMt32Installed(signal,request(404),digest),false);
 assert.equal(await browserMt32Installed(signal,request(200,true),digest),false);
 assert.equal(await browserMt32Installed(signal,request(),async()=>hashBytes('00'.repeat(32))),false);
});

await test('MT-32 installation checks preserve cancellation',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(browserMt32Installed(controller.signal,async(_input,init)=>{if(init?.signal?.aborted)throw new DOMException('closed','AbortError');return new Response();},digest),{name:'AbortError'});
});
