import {originalAdlibSampleTiming} from './adlib-sample-timing.ts';
/** Original AD15 9CC..ACC. The host must preserve the counter wait between
 * these write groups; this helper does not pretend that port timing is free. */
export function beginAdlibSample(before:Uint8Array,sample:{offset:number;segment:number;length:number;loops:number;rate:number},previousVector:{offset:number;segment:number}){
 if(before.length!==28)throw Error('Invalid original AdLib sample state');
 const state=before.slice(),v=new DataView(state.buffer),timing=originalAdlibSampleTiming(sample.rate);
 for(const at of [0,12]){v.setUint16(at,sample.offset&65535,true);v.setUint16(at+2,sample.segment&65535,true);}
 for(const at of [4,8])v.setUint32(at,sample.length>>>0,true);
 v.setUint16(18,sample.loops&65535,true);v.setUint16(16,0,true);
 v.setUint16(24,timing.handoffDivider,true);v.setUint16(26,timing.handoffDivider,true);
 const installVector=!v.getUint32(20,true);
 if(installVector){v.setUint16(20,previousVector.offset&65535,true);v.setUint16(22,previousVector.segment&65535,true);}
 return {state,...timing,installVector,counterThreshold:-2387,
  beforeWaitWrites:[[1,32],[0x20,0x21],[0x60,0xf0],[0x80,0xf0],[0xc0,1],[0xe0,0],[0x43,0x3f],[0xa0,0x8f],[0xb0,0x2e]],
  afterWaitWrites:[[0xb0,0x20],[0xa0,0]]};
}
