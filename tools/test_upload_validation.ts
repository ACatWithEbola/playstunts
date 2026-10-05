import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateTrackEncoding,validateReplayEncoding} from '../lib/game/upload-validation.ts';
import {prepareTrackUpload} from '../lib/game/track-upload.ts';
import {prepareReplayUpload} from '../lib/game/replay-upload.ts';
import {decodeSaveBackup,encodeSaveBackup} from '../lib/game/save-backup.ts';
const root=new URL('../public/game/',import.meta.url);
test('original files and supported backups are accepted; unrelated and disguised payloads are rejected',()=>{
 const track=new Uint8Array(readFileSync(new URL('original-resources/DEFAULT.TRK',root))),replay=new Uint8Array(readFileSync(new URL('replays/DEFAULT.RPL',root)));
 validateTrackEncoding(track);validateReplayEncoding(replay);
 const files=[prepareTrackUpload('DEFAULT.TRK',track,'C:\\'),prepareReplayUpload('DEFAULT.RPL',replay,'C:\\'),{key:'C:\\SETUP.DAT',bytes:new TextEncoder().encode('rem 4 4 -1 -1 -1 -1\r\n')}];
 assert.equal(decodeSaveBackup(encodeSaveBackup(files,'C:\\')).files.length,3);
 for(const name of ['test.exe','test.png','test.zip','test.txt','../a.trk'])assert.throws(()=>prepareTrackUpload(name,track,'C:\\'));
 const disguised=new Uint8Array(1802);disguised.fill(255);assert.throws(()=>prepareTrackUpload('BAD.TRK',disguised,'C:\\'));
 const appended=new Uint8Array(replay.length+10);appended.set(replay);assert.throws(()=>prepareReplayUpload('BAD.RPL',appended,'C:\\'));
 for(const name of ['TOOL.EXE','SCRIPT.JS','IMAGE.PNG','CUSTOM.DAT'])assert.throws(()=>decodeSaveBackup(encodeSaveBackup([{key:'C:\\'+name,bytes:new Uint8Array([77,90,0])}],'C:\\')));
 assert.throws(()=>decodeSaveBackup(encodeSaveBackup([{key:'C:\\BAD.TRK',bytes:disguised}],'C:\\')));
});
