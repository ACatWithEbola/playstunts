import {allocateResourcePages} from './allocate-resource-pages.ts';
import {createCockpitWindow} from './cockpit-window.ts';
/** Original26a40, including the backing resource allocation under DS:524a.
 * Width and height are original 16-bit values; allocation arithmetic wraps. */
export function allocateOriginalSpriteWindow(before:Uint8Array,d:number,width:number,height:number){
 const pages=(((((width&65535)*(height&65535)+16)&65535)>>>4)+1)&65535;
 const allocated=allocateResourcePages(before,d,0x524a,pages);
 if(allocated.error)return {...allocated,window:null};
 const result=createCockpitWindow(allocated.memory,width,height,allocated.segment);
 return {...allocated,memory:result.memory,window:{offset:result.offset,segment:result.segment},pages};
}
