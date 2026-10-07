import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundedRequestText} from '../lib/server/bounded-request-body.ts';
test('normal and split UTF-8 uploads are preserved exactly',async()=>{
 const text='{"name":"Sven","text":"España"}',bytes=new TextEncoder().encode(text);let offset=0;
 const body=new ReadableStream<Uint8Array>({pull(c){if(offset<bytes.length)c.enqueue(bytes.slice(offset,++offset));else c.close();}});
 assert.equal(await boundedRequestText(new Request('https://test/',{method:'POST',body,duplex:'half'} as RequestInit),100),text);
});
test('oversize streaming uploads stop reading and cancel instead of buffering the entire body',async()=>{
 let reads=0,cancelled=false;const body=new ReadableStream<Uint8Array>({pull(c){reads++;c.enqueue(new Uint8Array(100));},cancel(){cancelled=true;}},{highWaterMark:0});
 const result=await boundedRequestText(new Request('https://test/',{method:'POST',body,duplex:'half'} as RequestInit),150);
 assert.ok(result.length>150);assert.equal(reads,2);assert.equal(cancelled,true);
});
test('declared oversize is rejected without consuming body; missing size still gets streaming bounds',async()=>{
 const request=new Request('https://test/',{method:'POST',headers:{'Content-Length':'99999'},body:'{}'});
 assert.ok((await boundedRequestText(request,2)).length>2);assert.equal(request.bodyUsed,false);
 assert.equal(await boundedRequestText(new Request('https://test/',{method:'POST',body:'{}'}),2),'{}');
 assert.ok((await boundedRequestText(new Request('https://test/',{method:'POST',body:'España'}),6)).length>6);
});
