import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {bodyPlanePoints} from '../lib/physics/body-plane-points.ts';
import {bodyPlaneContact} from '../lib/physics/body-plane-contact.ts';
import type {Vector} from '../lib/physics/math.ts';
const [replayPath,dumpPath]=process.argv.slice(2);assert.ok(replayPath&&dumpPath);
const replay=readFileSync(replayPath),dump=readFileSync(dumpPath),view=new DataView(dump.buffer,dump.byteOffset,dump.byteLength);
const frames=view.getUint16(0,true);assert.equal(dump.length,2+1120*frames);
const id=String.fromCharCode(...replay.subarray(0,4)),car=fixtureData.cars.find((c:{id:string})=>c.id===id);assert.ok(car);
const sim=Buffer.from(car.rawSimulation,'hex'),sv=new DataView(sim.buffer,sim.byteOffset,sim.byteLength);
const wheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>sv.getInt16(210+i*6+a*2,true)) as Vector),height=sv.getInt16(202,true);
let checked=0;
for(let frame=0;frame<frames;frame++){
 const at=2+1120*frame+338;
 if(dump[at+201]!==0)continue; // Post-crash paths may retain cache instead.
 const position=[0,4,8].map(o=>view.getInt32(at+o,true)) as Vector,rotation=[24,26,28].map(o=>view.getInt16(at+o,true)) as Vector;
 const expected=Array.from({length:4},(_,i)=>[0,1,2].map(a=>view.getInt16(at+140+i*6+a*2,true)) as Vector);
 const points=bodyPlanePoints(position,rotation,wheels,height);
 assert.deepEqual(points,expected,'Body cache at frame '+(frame+1));
 const previous=frame===0?Array.from({length:4},()=>[12,16,20].map(o=>(view.getInt32(at+o,true)>>6)<<16>>16) as Vector):Array.from({length:4},(_,i)=>[0,1,2].map(a=>view.getInt16(at-1120+140+i*6+a*2,true)) as Vector);
 const contact=bodyPlaneContact(points,previous,{raw:Array.from(replay.subarray(26,1828)),objects:fixtureData.objects,planes:fixtureData.planes},0);
 assert.equal(contact.crash,false,'Body contact at frame '+(frame+1));
 assert.deepEqual(contact.cache,expected,'Retained body cache at frame '+(frame+1));checked++;
}
assert.ok(checked>0);console.log(JSON.stringify({car:id,checkedBodyCaches:checked,pass:true}));
