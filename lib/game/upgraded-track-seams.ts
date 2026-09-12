import type {Shape} from './types.ts';

// The source raster models deliberately overlap neighbouring tiles by one to
// seven world units. That hid integer-raster cracks, but two intersecting
// zero-thickness planes expose a wedge when the modern camera looks along a
// hill crest. Only the straight hill chain is normalized here: both road and
// terrain then terminate at the shared +/-512 tile boundary.
const NORMALIZED_AXES:Readonly<Record<string,readonly number[]>>={
 'GAME1.road':[2],
 'GAME1.zroa':[2],
 'GAME2.rdup':[0,2],
 'GAME2.zrdu':[2],
 'GAME2.goup':[0,2],
 'GAME2.high':[0,2],
};
const cached=new WeakMap<Shape,Map<string,Shape>>();

export function upgradedTrackSeamShape(shape:Shape,shapeName:string):Shape{
 const axes=NORMALIZED_AXES[shapeName];if(!axes)return shape;
 let variants=cached.get(shape);if(!variants){variants=new Map();cached.set(shape,variants);}
 const previous=variants.get(shapeName);if(previous)return previous;
 const vertices=shape.vertices.map(vertex=>vertex.map((coordinate,axis)=>axes.includes(axis)&&Math.abs(coordinate)>=513&&Math.abs(coordinate)<=519?Math.sign(coordinate)*512:coordinate) as [number,number,number]);
 const normalized={...shape,vertices};variants.set(shapeName,normalized);return normalized;
}
