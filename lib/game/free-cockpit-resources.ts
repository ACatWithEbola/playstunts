import {COCKPIT_DISPLAY_LAYOUTS} from './cockpit-display-layout.ts';
import {freeOriginalDisplayWindow} from './allocate-display-window.ts';
import {freeResource} from './free-resource.ts';
import {freeOriginalSpriteWindow} from './free-sprite-window.ts';
export interface CockpitResourceCleanupHost {
 memory():Uint8Array;writeMemory(memory:Uint8Array):void;
 freeWindow(offset:number,segment:number):void;
}
/** Original14a60 mode3: release the three windows in reverse order, then cache
 * the two instrument banks. The replay bank belongs to its separate caller. */
export function freeNativeCockpitResources(host:CockpitResourceCleanupHost,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const address=COCKPIT_DISPLAY_LAYOUTS[mode];
 const pointer=(at:number)=>{const m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);return [v.getUint16(d+at,true),v.getUint16(d+at+2,true)] as const;};
 for(const at of [0x54b6,0x54a6,0x543a])host.freeWindow(...pointer(address(at)));
 for(const at of [0x543e,0x5436]){const result=freeResource(host.memory(),d,...pointer(address(at)));host.writeMemory(result.memory);if(result.error)throw Error('Original cockpit bank release failed: '+result.error);}
}
export function freeCompleteNativeCockpitResources(host:Pick<CockpitResourceCleanupHost,'memory'|'writeMemory'>,d:number,cs=0x209e0){
 freeNativeCockpitResources({...host,freeWindow(offset,segment){const result=freeOriginalSpriteWindow(host.memory(),d,cs,offset,segment);host.writeMemory(result.memory);if(result.error)throw Error('Original cockpit window release failed: '+result.error);}},d);
}

/** Original mode3 cleanup for the alternative display window allocator. */
export function freeCompleteOriginalCockpitDisplayResources(host:Pick<CockpitResourceCleanupHost,'memory'|'writeMemory'>,d:number,mode:'cga'|'tandy'|'ega'){
 freeNativeCockpitResources({...host,freeWindow(offset,segment){const result=freeOriginalDisplayWindow(host.memory(),d,mode,offset,segment);host.writeMemory(result.memory);if(result.error)throw Error('Original cockpit window release failed: '+result.error);}},d,mode);
}
