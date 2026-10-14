/** Published asset inputs must reproduce the approved local Suno package. */
import assert from 'node:assert/strict';
import {readFileSync,lstatSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const live=new URL('../public/audio/remixed/ms91-v2/',import.meta.url);
const vendor=new URL('../vendor/runtime/audio/remixed/ms91-v2/',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=readFileSync(new URL('provenance.json',live));
assert.deepEqual(readFileSync(new URL('provenance.json',vendor)),manifestBytes);
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.originalMusicModified,false);
assert.equal(manifest.legacyMusicModified,false);
assert.deepEqual(readdirSync(vendor).sort(),['provenance.json',...manifest.files.map(row=>row.file)].sort(),'No experimental/reconstructed audio belongs in the distribution');
for(const row of manifest.files){
 assert.equal(row.actualSunoRecording,true);assert.equal(row.reconstructed,false);
 assert.ok(lstatSync(new URL(row.file,vendor)).isFile());
 const supplied=readFileSync(new URL(row.file,vendor)),current=readFileSync(new URL(row.file,live));
 assert.equal(supplied.length,row.bytes);assert.equal(hash(supplied),row.sha256);assert.deepEqual(supplied,current);
}
console.log('Four distributed MS1991 Suno tracks and provenance match the approved local package byte-for-byte; no audio was transformed');
