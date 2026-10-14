import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawOriginalTrackOverview} from '../lib/game/track-overview-raster.ts';
import {installOriginalMenuPanorama} from '../lib/game/menu-panorama.ts';
const root=new URL('../public/game/',import.meta.url),baseline=new Uint8Array(readFileSync(new URL('native-render-resources.bin',root)));
const ground=JSON.parse(readFileSync(new URL('overview-ground-models.json',root),'utf8')).resources;
const panoramas=JSON.parse(readFileSync(new URL('menu-panorama-art.json',root),'utf8'));
const source=readFileSync(process.argv[2]??'/private/tmp/QA91R001.RPL'),raw=Array.from(source.subarray(26,1828));assert.equal(raw.length,1802);
const panorama=panoramas[raw[900]&3];assert.ok(panorama);
installOriginalMenuPanorama(baseline,0x2d1a0,raw[900],panorama.resources);
const before=baseline.slice(),rawBefore=raw.slice(),modelsBefore=JSON.stringify(ground),outputs:Uint8Array[]=[];
for(const engine of [undefined,'ms-1990','ms-1991'] as const){
 const pixels=new Uint8Array(65536);const result=drawOriginalTrackOverview(pixels,baseline,raw,ground,undefined,engine);
 assert.ok(Number.isFinite(result.pitch)&&Number.isFinite(result.horizon));assert.ok(pixels.some(value=>value!==0));outputs.push(pixels);
 assert.deepEqual(baseline,before);assert.deepEqual(raw,rawBefore);assert.equal(JSON.stringify(ground),modelsBefore);
}
assert.deepEqual(outputs[0],outputs[1],'Untagged overview must retain exact legacy output');
console.log(JSON.stringify({legacyDefaultIdentical:true,modernPixelDifferences:outputs[2].reduce((count,n,i)=>count+(n!==outputs[1][i]?1:0),0),sourceUnchanged:true,originalPixelParityClaimed:false}));
