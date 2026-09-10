export interface NativeDemoFrameEndHost {memory():Uint8Array;key():number;controls():number}
/** Original13F25..13F50. A demo tests keyboard input first, then playback
 * completion, then held driving controls; manual play takes another branch. */
export function finishNativeDemoFrame(host:NativeDemoFrameEndHost,d:number):'manual'|'exit'|'continue'{
 if(!host.memory()[d+0x90f8])return 'manual';
 if(host.key()&65535)return 'exit';
 if(host.memory()[d+0x8ff4])return 'exit';
 return host.controls()&65535?'exit':'continue';
}
