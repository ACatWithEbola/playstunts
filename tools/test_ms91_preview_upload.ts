import assert from 'node:assert/strict';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {prepareReplayUpload,preparePrivateReplayUpload} from '../lib/game/replay-upload.ts';
import {browserPreviewGraphicsSettings} from '../lib/game/browser-future-race-engine.ts';
const replay=versionedDemoResource('ms-1991')!,file=encodeVersionedReplay(replay.bytes,replay.physicsEngine,replay.framesPerSecond),before=file.slice();
for(const hostname of ['playstunts.com','localhost'])for(const search of ['', '?preview-engine=ms-1991']){
 const options={experimentalMs91Slow:!!browserPreviewGraphicsSettings({hostname,search})};
 const privateFile=preparePrivateReplayUpload('QA_SLOW.RPL',file,'C:\\','ms-1991');
 assert.equal(privateFile.physicsEngine,'ms-1991');assert.equal(privateFile.framesPerSecond,10);assert.deepEqual(privateFile.bytes,replay.bytes,'Ordinary private import requires no location or preview flag');
 if(hostname==='localhost'&&search){const stored=prepareReplayUpload('QA_SLOW.RPL',file,'C:\\','ms-1991',options);assert.equal(stored.physicsEngine,'ms-1991');assert.equal(stored.framesPerSecond,10);assert.deepEqual(stored.bytes,replay.bytes);}
 else assert.throws(()=>prepareReplayUpload('QA_SLOW.RPL',file,'C:\\','ms-1991',options),/Only 20 Hz/);
 assert.deepEqual(file,before);
}
console.log('General upload keeps20Hz/default guards; explicit local preview and ordinary private import accept MS9110Hz while preserving canonical bytes and recorded identity');
