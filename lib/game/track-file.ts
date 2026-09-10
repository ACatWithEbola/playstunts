export interface TrackFileBuffers {track:number[];terrain:number[]}
/** Original editor writes 0x70a bytes: track900+horizon, terrain900+trailing byte. */
export function decodeTrackFile(bytes:Uint8Array):TrackFileBuffers{
 if(bytes.length!==1802)throw Error('Track file must contain exactly 1802 bytes');
 return {track:Array.from(bytes.subarray(0,901)),terrain:Array.from(bytes.subarray(901,1802))};
}
export function encodeTrackFile(buffers:TrackFileBuffers):Uint8Array{
 if(buffers.track.length!==901||buffers.terrain.length!==901)throw Error('Track and terrain buffers must each contain 901 bytes');
 const values=[...buffers.track,...buffers.terrain];
 if(values.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Track buffers contain a non-byte value');
 return Uint8Array.from(values);
}
