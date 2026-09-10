import {loadCompleteNativeGameResource} from './load-complete-game-resource.ts';
import {allocateOriginalSpriteWindow} from './allocate-sprite-window.ts';
import {freeOriginalSpriteWindow} from './free-sprite-window.ts';
import {freeResource} from './free-resource.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import type {NativeRawResourceHost} from './load-raw-resource.ts';
import {loadNativeResource,type NativeResourceFileHost} from './load-native-resource.ts';
import {findOriginalResource} from './find-original-resource.ts';
import {originalRandomByte} from './original-random.ts';
type Pointer={offset:number;segment:number};
export interface AllocatedResultsHost extends NativeRawResourceHost {retry():Promise<number>;progress(stage:number):void}
/** Original58D4..595B. Results retain the outer track and recording bank;
 * MISC, opponent text and the result windows belong to this presentation. */
export async function enterAllocatedResultsResources(host:AllocatedResultsHost,d:number,bp:number){
 const word=(at:number,value:number)=>{const m=host.memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+((bp+at)&65535),value,true);};
 const pointer=(at:number,value:Pointer)=>{word(at,value.offset);word(at+2,value.segment);};
 host.progress(4);
 const misc=await loadCompleteNativeGameResource(host,d,0x436,(bp-0xaa)&65535);pointer(-0x4e,misc);
 let opponent:Pointer|undefined;
 if(host.memory()[d+0x8fc8]){host.memory()[d+0x141]=(host.memory()[d+0x8fc8]+48)&255;opponent=await loadCompleteNativeGameResource(host,d,0x13e,(bp-0xaa)&65535);pointer(-0x68,opponent);}
 const allocate=(width:number,height:number)=>{const result=allocateOriginalSpriteWindow(host.memory(),d,width,height);if(result.error||!result.window)throw Error('Original results window allocation failed');host.writeMemory(result.memory);return result.window;};
 const surface=allocate(320,200);const m=host.memory(),view=new DataView(m.buffer,m.byteOffset,m.byteLength);view.setUint16(d+0x933a,surface.offset,true);view.setUint16(d+0x933c,surface.segment,true);
 let alternate:Pointer|undefined;
 if(host.memory()[d+0xaa46]){alternate=allocate(200,100);pointer(-0x46,alternate);}
 host.memory()[d+((bp-0x52)&65535)]=255;
 return {misc,opponent,surface,alternate};
}
/** Original5FA7..605A: opponent's win/lose bitmap bank and animation sequence.
 * The middle comment choice is overwritten by another original random byte. */
export async function loadAllocatedEvaluationResources(host:NativeResourceFileHost,d:number,bp:number,outcome:number){
 const view=()=>{const m=host.memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);};
 const word=(at:number)=>view().getUint16(d+(at&65535),true),set=(at:number,value:number)=>view().setUint16(d+(at&65535),value&65535,true);
 const won=outcome===1,name=won?0x54e:0x556;host.memory()[d+name+3]=(host.memory()[d+0x8fc8]+48)&255;
 const bitmap=await loadNativeResource(host,d,3,name,(bp-0xac)&65535);if(!bitmap)throw Error('Original evaluation bitmap load was cancelled');
 set(bp-0x1c,bitmap.offset);set(bp-0x1a,bitmap.segment);
 const sequence=findOriginalResource(host.memory(),d,word(bp-0x68),word(bp-0x66),won?0x4a1:0x4a6,true)!;
 set(bp-0x5a,sequence.offset);set(bp-0x58,sequence.segment);
 const random=(originalRandomByte(host.memory(),d)+word(0x899e))&65535;
 set(0x53fc,won?(random&1)+(word(0x89a0)?2:0):random&3);host.memory()[d+((bp-0x6a)&65535)]=won?0x76:0x64;
 return {bitmap,sequence};
}
/** Original6B69..6BC4 after the audio/presentation restoration boundary. */
export function releaseAllocatedResultsResources(host:Pick<AllocatedResultsHost,'memory'|'writeMemory'>,d:number,resources:Awaited<ReturnType<typeof enterAllocatedResultsResources>>,evaluation?:Pointer){
 const accept=(result:{memory:Uint8Array;error:unknown})=>{if(result.error)throw Error('Original results release failed: '+result.error);host.writeMemory(result.memory);};
 if(evaluation)accept(releaseResourcePages(host.memory(),d,evaluation.segment));
 if(resources.alternate)accept(freeOriginalSpriteWindow(host.memory(),d,0x209e0,resources.alternate.offset,resources.alternate.segment));
 accept(freeOriginalSpriteWindow(host.memory(),d,0x209e0,resources.surface.offset,resources.surface.segment));
 if(resources.opponent)accept(freeResource(host.memory(),d,resources.opponent.offset,resources.opponent.segment));
 accept(freeResource(host.memory(),d,resources.misc.offset,resources.misc.segment));
}
