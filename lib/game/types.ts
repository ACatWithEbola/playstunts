export type Primitive={type:number;flags:number;materials:number[];indices:number[]};
export type Shape={vertices:number[][];primitives:Primitive[];paintCount:number};
export type Car={id:string;name:string;description:string;gears:number;mass:number;maxRPM:number;idleRPM:number;torqueCurve:number[]};
export type Assets={cars:Car[];tracks:{name:string;raw:number[]}[];replays?:{name:string;file:string;bytes:number;sha256:string}[];shapes:Record<string,Record<string,Shape>>};
