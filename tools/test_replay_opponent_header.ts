import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateReplayEncoding} from '../lib/game/upload-validation.ts';
import {encodeSaveBackup,decodeSaveBackup} from '../lib/game/save-backup.ts';
const original=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),before=original.slice();
assert.doesNotThrow(()=>validateReplayEncoding(original),'Disabled opponent retains its existing sentinel bytes');
for(const id of ['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']){
 const replay=original.slice();replay[6]=1;replay.set(new TextEncoder().encode(id),7);replay[11]=4;replay[12]=1;
 assert.doesNotThrow(()=>validateReplayEncoding(replay),'Native opponent ID begins at byte7: '+id);
 assert.deepEqual(decodeSaveBackup(encodeSaveBackup([{key:'C:\\OPP.RPL',bytes:replay}],'C:\\')).files[0].bytes,replay);
 const bad=replay.slice();bad[7]=0;assert.throws(()=>validateReplayEncoding(bad),/not a supported/);
}
const wrongOffset=original.slice();wrongOffset[6]=1;wrongOffset.set(new TextEncoder().encode('PMIN'),9);
assert.throws(()=>validateReplayEncoding(wrongOffset),/not a supported/);
assert.deepEqual(original,before);
console.log('All11 opponent IDs validate at native byte7; disabled opponents remain unchanged, wrong-offset headers reject');
