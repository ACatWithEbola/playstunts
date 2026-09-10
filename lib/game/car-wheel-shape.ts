import type {Shape} from './types.ts';
import type {Vector} from '../physics/math.ts';
import {initializeOriginalCarWheels} from './initialize-car-wheels.ts';
import {updateOriginalCarWheels} from './car-wheel-geometry.ts';
/** Each car owns mutable wheel geometry; original resource data stays shared. */
export function createOriginalWheelShape(source:Shape,retainedCenters:readonly Vector[]){
 if(source.vertices.length<32)throw Error('Original detailed car model lacks wheel vertices');
 const shape:Shape={...source,vertices:source.vertices.map(v=>[...v])};
 const initial=initializeOriginalCarWheels(shape.vertices.slice(8,32) as Vector[],retainedCenters);
 let cache=initial.cache;
 return {shape,update(steering:number,suspension:readonly number[]){
  const result=updateOriginalCarWheels(shape.vertices.slice(8,32) as Vector[],steering,suspension,cache,initial.base,initial.centers);
  for(let i=0;i<24;i++)shape.vertices[i+8]=result.vertices[i];
  cache=result.cache;
 }};
}
