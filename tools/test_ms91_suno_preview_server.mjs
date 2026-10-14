import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createPreviewServer} from './serve_ms91_suno_preview.mjs';
const server=createPreviewServer();server.listen(0,'127.0.0.1');await once(server,'listening');
const root=`http://127.0.0.1:${server.address().port}`;
try{
 for(const path of ['/','/files/','/files/secret.txt','/files/../secret.txt']){const response=await fetch(root+path);assert.equal(response.status,404);assert.equal(response.headers.get('cache-control'),'no-store','A missing preview file must not become a cached failure');}
 const path='/files/ms91-suno-title-loop-20261014-44/loop-seam-trial.wav';
 assert.equal((await fetch(root+'/files/ms91-title-full-trial-20261014-166/arrangement-trial.wav')).status,404,'Reconstruction experiments must not be served');
 assert.equal((await fetch(root+path,{method:'POST'})).status,405);
 assert.equal((await fetch(root+path,{method:'HEAD',headers:{Origin:'https://example.com'}})).status,403);
 const response=await fetch(root+path,{method:'HEAD',headers:{Origin:'http://localhost:5191'}});
 assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),'http://localhost:5191');
 assert.equal(response.headers.get('content-type'),'audio/wav');assert.ok(Number(response.headers.get('content-length'))>1000);
 console.log('Preview server permits only fixed candidate files, GET/HEAD and explicit local origins');
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
