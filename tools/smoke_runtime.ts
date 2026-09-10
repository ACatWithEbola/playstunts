/** Small installation smoke check using only locally generated assets. */
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createNativeResourceCatalog} from '../lib/game/native-resource-catalog.ts';
const root=resolve(process.argv[2]??'public','game');
const json=(name:string)=>JSON.parse(readFileSync(join(root,name+'.json'),'utf8'));
const assets=json('assets');
const catalog=createNativeResourceCatalog(json('original-resources/manifest').files,async file=>new Uint8Array(readFileSync(join(root,'original-resources',file))));
const configuration=Array(24).fill(0);configuration.splice(0,4,...Buffer.from('COUN'));configuration[5]=1;configuration[7]=255;configuration.splice(13,7,...Buffer.from('DEFAULT'));
const track=assets.tracks.find((t:{name:string})=>t.name==='DEFAULT');if(!track)throw Error('DEFAULT.TRK is required');
const runtime=await createNativeManualRaceRuntime({base:new Uint8Array(readFileSync(join(root,'native-resource-base.bin'))),catalog,cars:assets.cars,records:json('route-records'),vectors:json('route-vectors'),samples:json('route-sample-vectors'),objects:json('track-objects'),points:json('route-point-vectors'),indices:json('route-speed-indices'),planes:json('collision-planes'),walls:json('collision-walls').walls},{configuration,track:track.raw,name:'DEFAULT',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
const controls={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
for(let frame=0;frame<30;frame++){
 for(let tick=0;tick<5;tick++)runtime.tick(controls);
 const pixels=runtime.renderCockpitWorld();if(!pixels.length||!pixels.some(value=>value!==pixels[0]))throw Error('Empty race frame');
 runtime.finishRenderedFrame();
}
console.log('Fresh race initialization and 30 rendered frames passed.');
