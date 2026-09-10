import {loadNativePvsBank} from './load-pvs-bank.ts';
import {packNativeResidentBitmapBank} from './pack-resident-bitmap-bank.ts';
/** Original2c734 fresh PVS path, after filename/cache selection. Caller
 * supplies its retained outer, decoded-file and UNFLIP allocation names. */
export function loadNativePackedPvsBank(before:Uint8Array,d:number,names:{outer:number;decoded:number;scratch:number},packed:Uint8Array){
 const source=loadNativePvsBank(before,d,names.decoded,names.scratch,packed);
 if(source.error||!source.resource)return {...source,offset:0};
 return packNativeResidentBitmapBank(source.memory,d,source.segment,source.descriptor,names.outer);
}
