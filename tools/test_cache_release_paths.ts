import assert from 'node:assert/strict';
import {freeResource} from '../lib/game/free-resource.ts';

// Same fixtures as check_original_cache_release.py, using canonical DS fields.
for(const kind of ['last','interior','no-gap','cache-edge','missing','zero-pages']){
 const memory=new Uint8Array(0x100000),d=0x60000,v=new DataView(memory.buffer);
 const put=(at:number,value:number)=>v.setUint16(d+at,value,true),word=(at:number)=>v.getUint16(d+at,true);
 const first=0x1000,last=0x1036;let cache=0x1100;
 put(0x4b12,first);put(0x4b14,last);put(0x4b16,cache);
 for(let n=0;n<4;n++){
  const at=first+18*n;
  memory.set([...Buffer.from('RESOURCE'),...Array(4).fill(65+n)],d+at);
  put(at+12,2);put(at+14,0x3000+0x100*n);put(at+16,1);
 }
 put(cache+14,0x5000);put(cache+12,0);put(cache+16,1);
 const descriptor=kind==='last'?last:first+18;
 if(kind==='cache-edge'){cache=descriptor;put(0x4b16,cache);}
 if(kind==='no-gap')put(cache+14,word(last+14)+word(last+12));
 if(kind==='zero-pages')put(descriptor+12,0);
 const source=word(descriptor+14),pages=word(descriptor+12);
 const payload=Uint8Array.from({length:pages*16},(_,n)=>(n*17+3)&255);
 memory.set(payload,source*16);const unchanged=memory.slice();
 const result=freeResource(memory,d,0x1234,kind==='missing'?0x7777:source);
 assert.deepEqual(memory,unchanged,'caller memory must remain unchanged');
 if(kind==='missing'){assert.equal(result.error,'missing');continue;}
 assert.equal(result.error,null);assert.equal(result.offset,0x1234);
 const out=new DataView(result.memory.buffer),read=(at:number)=>out.getUint16(d+at,true);
 const copied=!['no-gap','cache-edge'].includes(kind);
 assert.equal(result.segment,copied?0x5000-pages:0);
 assert.equal(read(descriptor+16),0);
 assert.equal(read(0x4b16),copied?cache-18:cache);
 assert.equal(read(0x4b14),kind==='last'?last-18:last);
 if(copied)assert.deepEqual(result.memory.slice(result.segment*16,result.segment*16+payload.length),payload);
 assert.deepEqual(result.memory.slice(source*16,source*16+payload.length),payload);
}
console.log('PASS: 6 native cache-release paths match original fixture outcomes; caller memory unchanged');
