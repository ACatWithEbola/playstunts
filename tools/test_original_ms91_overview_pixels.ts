import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {drawOriginalTrackOverview} from '../lib/game/track-overview-raster.ts';
import {installOriginalMenuPanorama} from '../lib/game/menu-panorama.ts';
const [original,libraries]=process.argv.slice(2);assert.ok(original&&libraries);
const game=new URL('../public/game/',import.meta.url),json=(name:string)=>JSON.parse(readFileSync(new URL(name,game),'utf8'));
const baseline=new Uint8Array(readFileSync(new URL('native-render-resources.bin',game))),assets=json('assets.json'),panoramas=json('menu-panorama-art.json'),ground=json('overview-ground-models.json').resources;
const result=spawnSync('python3',['tools/check_original_ms91_scene_setup.py',original,'--web',game.pathname,'--libraries',libraries,'--overview'],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const oracle=JSON.parse(result.stdout);
assert.equal(oracle.overviews.length,assets.tracks.length);
for(const row of oracle.overviews){
 const track=assets.tracks.find((track:{name:string})=>track.name===row.track);assert.ok(track);assert.equal(row.queueDrains,900);assert.ok(row.modelCalls>0);
 const memory=baseline.slice();memory[0x2d1a0+0x130]=0;installOriginalMenuPanorama(memory,0x2d1a0,row.landscape,panoramas[row.landscape&3].resources);
 const before=memory.slice(),pixels=new Uint8Array(65536);drawOriginalTrackOverview(pixels,memory,track.raw,ground,undefined,'ms-1991');
 assert.equal(createHash('sha256').update(pixels).digest('hex'),row.sha256,track.name);assert.deepEqual(memory,before);
}
console.log(JSON.stringify({originalOverviewPixelCases:oracle.overviews.length,engine:'ms-1991',sourceUnchanged:true}));
