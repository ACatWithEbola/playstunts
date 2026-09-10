import type {PlayerRouteGraph,RouteMemoryEntry} from './player-route-lookup.ts';

/** Original table reads wrap the effective offset inside the far pointer segment.
 * readByte must reject unavailable memory; missing allocation bytes are not zero.
 * Stack bytes are needed only for out-of-range visited nodes other than FFFF,
 * whose alias to the scratch local is modeled by lookupPlayerRoute itself.
 */
export function playerRouteMemory(
 graph:PlayerRouteGraph,
 readByte:(address:number)=>number,
 dataSegment:number,
 stackSegment:number,
 stackFrameOffset:number,
):PlayerRouteGraph{
 const byte=(address:number)=>{
  const value=readByte(address);
  if(!Number.isInteger(value)||value<0||value>255)throw Error('Missing original route memory byte');
  return value;
 };
 const word=(address:number)=>byte(address)|(byte(address+1)<<8);
 const table=(field:number,index:number,size:number)=>{
  const address=word(dataSegment+field+2)*16+((word(dataSegment+field)+index*size)&65535);
  return size===1?byte(address):word(address);
 };
 return {...graph,stackFrameOffset,
  readOutside:(node:number):RouteMemoryEntry=>({
   primary:table(0x73d2,node,2),alternate:table(0x7f9a,node,2),
   column:table(0x9c4e,node,1),row:table(0x9fec,node,1),
   footprint:byte(dataSegment+0x2023+table(0x8fee,node,1)*14),
  }),
  readInitialVisited:(node:number)=>byte(stackSegment*16+((stackFrameOffset+node-0x5a2)&65535)),
 };
}

/** 9640 entry SP -> 9e42 BP: frame prologue (10), player argument/call
 * (6), player prologue (88), route arguments/call (8), saved BP (2).
 * The seek caller's nested call contributes its own four bytes BEFORE entry.
 */
export function recordedPlayerRouteStackFrame(entryStackPointer:number){
 return (entryStackPointer-114)&65535;
}
