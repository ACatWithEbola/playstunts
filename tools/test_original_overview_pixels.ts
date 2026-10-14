import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {drawOriginalTrackOverview} from '../lib/game/track-overview-raster.ts';
import {installOriginalMenuPanorama} from '../lib/game/menu-panorama.ts';
const [snapshot,libraries]=process.argv.slice(2);assert.ok(snapshot&&libraries);
const game=new URL('../public/game/',import.meta.url),json=(name:string)=>JSON.parse(readFileSync(new URL(name,game),'utf8'));
const source=new Uint8Array(readFileSync(snapshot)),assets=json('assets.json'),panoramas=json('menu-panorama-art.json'),ground=json('overview-ground-models.json').resources;
const result=spawnSync('python3',['tools/check_original_overview_pixels.py',snapshot,game.pathname,'--libraries',libraries],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const oracle=JSON.parse(result.stdout);
for(const row of oracle.rows){
 const track=assets.tracks.find((track:{name:string})=>track.name===row.track);assert.ok(track);
 const baseline=source.slice();baseline[0x2d1a0+0x130]=0;installOriginalMenuPanorama(baseline,0x2d1a0,track.raw[900],panoramas[track.raw[900]&3].resources);const before=baseline.slice(),pixels=new Uint8Array(65536);
 drawOriginalTrackOverview(pixels,baseline,track.raw,ground,undefined,'ms-1990');
 assert.equal(createHash('sha256').update(pixels).digest('hex'),row.sha256,row.track);assert.deepEqual(baseline,before);
}
assert.deepEqual(new Uint8Array(readFileSync(snapshot)),source);
console.log(JSON.stringify({originalOverviewPixelCases:oracle.rows.length,engine:'ms-1990',sourceUnchanged:true}));
