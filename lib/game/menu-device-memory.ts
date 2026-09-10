/** Transfer the browser's original-device polling result to the retained
 * game memory read by the replay controller (original1aafe..1ad1a). */
export function writeOriginalMenuDeviceSample(memory:Uint8Array,d:number,sample:{key:number;x:number;y:number;buttons:number;rawButtons:number;mouseActive:boolean}){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 view.setUint16(d+0xa77c,sample.x,true);
 view.setUint16(d+0xa7de,sample.y,true);
 view.setUint16(d+0x893a,sample.buttons,true);
 view.setUint16(d+0x9ad4,sample.rawButtons,true);
 memory[d+0x132]=Number(sample.mouseActive);
 return sample.key&65535;
}
