import {allocateResourcePages} from './allocate-resource-pages.ts';
import {createOriginalDisplayWindow,originalDisplayWindowAllocation} from './create-display-window.ts';
import {freeOriginalSpriteWindow} from './free-sprite-window.ts';
/** Original alternative display allocation joined to the common resource heap. */
export function allocateOriginalDisplayWindow(before:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',width:number,height:number,planeMask=15){
 const request=originalDisplayWindowAllocation(mode,width,height,planeMask),allocated=allocateResourcePages(before,d,request.nameOffset,request.pages);
 if(allocated.error)return {...allocated,window:null};
 const defined=createOriginalDisplayWindow(allocated.memory,mode,width,height,allocated.segment,planeMask);
 return {...allocated,error:defined.error,window:defined.error?null:{offset:defined.offset,segment:defined.segment},pages:request.pages};
}
export function freeOriginalDisplayWindow(before:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',offset:number,segment:number){
 return freeOriginalSpriteWindow(before,d,0x209e0,offset,segment,mode==='cga'?0x70c8:mode==='tandy'?0x6ad6:0x9a40);
}
