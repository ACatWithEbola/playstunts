/** Read-only BB11 original-assembly capture audit; not a direct MS91 oracle. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isAbsolute,join} from 'node:path';
import {spawnSync} from 'node:child_process';
const [corpus,captures]=process.argv.slice(2);
assert.ok(corpus&&captures&&isAbsolute(corpus)&&isAbsolute(captures),'Supply absolute source corpus and DOS capture directories');
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(readFileSync(join(captures,'repldumo.exe'))),'02cc076b2e62c97cea59bc12fe7c45967f054aa7d12cedfaadfc629b6effc45f','Unexpected archived original-assembly checker');
const cases=[['zct300/25-MAR.RPL','MAR300',2556,2536],['zct300/18-ERI.RPL','ERI300',2264,2244],['zct299/01-ARG.RPL','ARG299',1471,1451],['zct299/20-STB.RPL','STB299',3806,3786]] as const;
let total=0;
for(const [relative,name,frames,ticks] of cases){
 const source=join(corpus,relative),capture=join(captures,name+'.BIN');
 const bytes=readFileSync(source),dump=readFileSync(capture);
 assert.deepEqual(readFileSync(join(captures,name+'.RPL')),bytes,'Staged replay differs from source');
 const view=new DataView(dump.buffer,dump.byteOffset,dump.byteLength);
 assert.equal(view.getUint16(0,true),frames,'Unexpected captured frame count');
 assert.equal(dump.length,2+frames*1120,'Incomplete original capture');
 assert.equal(view.getUint16(2+(frames-1)*1120+322,true),ticks,'Unexpected original finish');
 const result=spawnSync(process.execPath,[new URL('./compare_external_replay.ts',import.meta.url).pathname,source,capture,'ms-1991'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout||String(result.error));
 assert.deepEqual(readFileSync(source),bytes,'Comparison changed source');
 assert.deepEqual(readFileSync(capture),dump,'Comparison changed capture');
 total+=frames;console.log(JSON.stringify({reference:relative,frames,ticks,captureSha256:hash(dump),pass:true}));
}
assert.equal(total,10097);
console.log(JSON.stringify({oracle:'archived BB11 original assembly',frames:total,directMS91Capture:false,pass:true}));
