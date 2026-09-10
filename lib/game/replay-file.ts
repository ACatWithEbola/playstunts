import {decodeTrackFile,encodeTrackFile} from './track-file.ts';
/** Supplied149c4 loader /14a1a saver:24-byte configuration,0x70a track bytes,
 * then one input byte per frame. Header word22 controls the saved frame count.
 * Unknown header bytes remain intact. Decode retains trailing bytes for
 * inspection; the original saver writes only the declared input history.
 */
export function decodeOriginalReplayFile(bytes:Uint8Array){
 if(bytes.length<0x722)throw Error('Original replay file is shorter than its header and track');
 const header=bytes.slice(0,24),count=new DataView(header.buffer).getUint16(22,true);
 if(bytes.length<0x722+count)throw Error('Original replay file is shorter than its declared input history');
 return {header,track:decodeTrackFile(bytes.slice(24,0x722)),inputs:bytes.slice(0x722,0x722+count),trailing:bytes.slice(0x722+count)};
}
export function encodeOriginalReplayFile(replay:ReturnType<typeof decodeOriginalReplayFile>){
 if(replay.header.length!==24)throw Error('Original replay header must contain24 bytes');
 if(replay.inputs.length>65535)throw Error('Original replay frame count exceeds a word');
 const output=new Uint8Array(0x722+replay.inputs.length);output.set(replay.header);new DataView(output.buffer).setUint16(22,replay.inputs.length,true);
 output.set(encodeTrackFile(replay.track),24);output.set(replay.inputs,0x722);return output;
}
