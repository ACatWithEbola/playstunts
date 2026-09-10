import {originalReplayLoadResources} from './replay-load-resources.ts';
export interface NativeReplayLoadHost {
 memory():Uint8Array;pauseAudio():void;selectReplay():Promise<number>;
 prepareLoad():void;readReplay():Promise<number>;analyzeTrack():void;
 refreshOpponent():void|Promise<void>;releaseCarResources():void;loadCarResources():void|Promise<void>;initialize(mode:number):void;
}
/** Original161ea..16305. File selection/loading and resource allocation stay
 * with the host. Even cancelling clears the original race eligibility flags. */
export async function loadNativeReplay(host:NativeReplayLoadHost,d:number){
 host.memory()[d+0x8018]=0;host.pauseAudio();
 if(((await host.selectReplay())<<24>>24)===0)return false;
 let m=host.memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);v.setUint16(d+0x8a10,0x96,true);
 host.prepareLoad();m=host.memory();const before=m.slice(d+0x8fc2,d+0x8fda);
 const horizon=()=>{const bytes=host.memory(),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),address=view.getUint16(d+0x9356,true)+view.getUint16(d+0x9358,true)*16+900;return bytes[address];};
 const oldHorizon=horizon(),status=await host.readReplay();m=host.memory();
 if(status&255)new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x8fd8,0,true);
 m[d+0x8002]=0;host.analyzeTrack();m=host.memory();
 const decision=originalReplayLoadResources(before,m.subarray(d+0x8fc2,d+0x8fda),oldHorizon,horizon());
 if(decision.refreshOpponent)await host.refreshOpponent();
 if(decision.reloadCarResources){host.releaseCarResources();await host.loadCarResources();}
 host.initialize(-1);return true;
}
