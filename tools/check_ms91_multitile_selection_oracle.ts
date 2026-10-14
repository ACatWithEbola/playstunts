import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fixtureData} from './global-score-fixture.ts';
import type {TrackObject} from '../lib/physics/track.ts';
const [image,libraries,replay,game]=process.argv.slice(2);assert.ok(image&&libraries&&replay&&game);
const source=readFileSync(replay),staged=Buffer.from(source);
const objects=(fixtureData.objects as TrackObject[]).slice(0,198).filter(o=>o.multiTile);
const put=(row:number,col:number,id:number)=>{staged[26+row*30+col]=id;staged[26+901+(29-row)*30+col]=0;};
objects.forEach((o,index)=>{
 const row=3+Math.floor(index/8)*4,col=2+(index%8)*3;
 put(row,col,o.id);
 if(o.multiTile&1)put(row-1,col,254);
 if(o.multiTile&2)put(row,col+1,255);
 if(o.multiTile===3)put(row-1,col+1,253);
});
const root=mkdtempSync(join(tmpdir(),'ms91-multitile-')),path=join(root,'LAYOUT.RPL');writeFileSync(path,staged,{flag:'wx'});
// Catalogue layout is not a connected race circuit. Exercise geometry only;
// do not claim original route analysis or race acceptance for this fixture.
const r=spawnSync(process.execPath,['tools/check_ms91_full_selection_oracle.ts',image,libraries,path,game,'--synthetic'],{encoding:'utf8',maxBuffer:2000000});
assert.equal(r.status,0,r.stderr);assert.deepEqual(readFileSync(replay),source);assert.deepEqual(readFileSync(path),staged);
console.log(JSON.stringify({multiTileElements:objects.length,comparison:JSON.parse(r.stdout),sourceUnchanged:true}));
