import {versionedDemoResource} from './versioned-demo-resource.ts';
/** Standalone copy of the track embedded in the original February1991 demo.
 * The source archive has no separate VANCOUVR.TRK. Never alter replay bytes. */
export function ms91DemoTrack(){
 const replay=versionedDemoResource('ms-1991')!;
 const name=String.fromCharCode(...replay.bytes.subarray(13,22)).split('\0')[0];
 if(name!=='VANCOUVR')throw Error('Unexpected original MS91 demonstration track');
 return {name,bytes:replay.bytes.slice(24,0x722)};
}
