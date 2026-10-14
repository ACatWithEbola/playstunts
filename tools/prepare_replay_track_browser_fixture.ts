import {writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const directory=process.argv[2];
if(!directory?.startsWith('/private/tmp/ms91-auto-track.'))throw Error('Explicit disposable fixture directory required');
const source=versionedDemoResource('ms-1991')!.bytes;
for(const [file,name,change] of [['QA_AUTO','QA_AUTO',false],['QA_CLASH','QA_AUTO',true],['QA_DFLT','DEFAULT',true]] as const){
 const output=join(directory,file+'.RPL');if(existsSync(output))throw Error('Refusing fixture overwrite');
 const bytes=source.slice();bytes.fill(0,13,22);bytes.set(Buffer.from(name),13);if(change)bytes[24]^=1;
 writeFileSync(output,encodeVersionedReplay(bytes,'ms-1991',10));
}
