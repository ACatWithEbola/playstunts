import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {carsOverlap} from '../lib/physics/car-overlap.ts';
import {fixtureData} from './global-score-fixture.ts';
const path=process.argv[2];if(!path)throw Error('Usage: node tools/check_divider_overlap_oracle.ts ORIGINAL_CAPTURE.json');
const rows=JSON.parse(readFileSync(path,'utf8')) as {car?:string;dimensions?:[number,number,number];radius?:number;height:number;x:number;z:number;angles?:[number,number,number];hit:boolean}[];
const allCars=process.argv.includes('--all-cars'),perCar=process.argv.includes('--angled')?1296:2835;
assert.equal(rows.length,perCar*(allCars?11:1));
const car=fixtureData.cars.find((car:{id:string})=>car.id==='PMIN'),simulation=Buffer.from(car.rawSimulation,'hex');
const dimensions:[number,number,number]=[200,202,204].map(at=>simulation.readInt16LE(at)) as [number,number,number],radius=simulation.readInt16LE(206);
assert.deepEqual([...dimensions,radius],[19,17,56,62]);
const counts=new Map<string,number>();
for(const row of rows){
 let shape=dimensions,extent=radius;
 if(allCars){
  const id=row.car;assert.ok(id);
  const original=fixtureData.cars.find((car:{id:string})=>car.id===id);assert.ok(original,'Unknown original car');
  const sim=Buffer.from(original.rawSimulation,'hex');
  shape=[200,202,204].map(at=>sim.readInt16LE(at)) as [number,number,number];extent=sim.readInt16LE(206);
  assert.deepEqual(row.dimensions,shape);assert.equal(row.radius,extent);
  counts.set(id,(counts.get(id)??0)+1);
 }
 assert.equal(carsOverlap({position:[row.x,row.height,row.z],angles:row.angles??[0,0,0],dimensions:shape,radius:extent},{position:[0,0,0],angles:[0,0,0],dimensions:[1,10,1],radius:10}),row.hit,JSON.stringify(row));
}
if(allCars){assert.equal(counts.size,11);for(const count of counts.values())assert.equal(count,perCar);}
console.log('All'+rows.length+' web overlap cases match both original routines');
