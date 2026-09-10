import {releaseResourcePages} from './release-resource-pages.ts';
function transfer(memory:Uint8Array,d:number,restore:boolean){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true);
 const source=restore?0x9b44:0x8fc2,destination=restore?0x8fc2:0x9b44;
 for(let i=0;i<24;i+=2)v.setUint16(d+destination+i,word(source+i),true);
 // The executable reloads each far pointer for every byte, retaining aliases.
 for(let i=0;i<1802;i++){
  const src=restore?0x8a48:0x9356,dst=restore?0x9356:0x8a48;
  const value=memory[word(src+2)*16+((word(src)+i)&65535)];
  memory[word(dst+2)*16+((word(dst)+i)&65535)]=value;
 }
 const src=restore?0xaa7a:0x98,dst=restore?0x98:0xaa7a;
 let length=0;while(length<65535){if(!memory[d+((src+length++)&65535)])break;}
 let index=0;
 // Both fixed destinations are even: the original strcpy copies words first.
 for(;index+1<length;index+=2){const lo=memory[d+((src+index)&65535)],hi=memory[d+((src+index+1)&65535)];memory[d+((dst+index)&65535)]=lo;memory[d+((dst+index+1)&65535)]=hi;}
 if(index<length)memory[d+((dst+index)&65535)]=memory[d+((src+index)&65535)];
}
/** Original2B1C..2B53: save menu settings, both track grids and track filename. */
export function saveOriginalRaceMenuState(memory:Uint8Array,d:number){transfer(memory,d,false);}
/** Original2CC0..2D07: restore menu state and discard the checkpoint allocation. */
export function restoreOriginalRaceMenuState(before:Uint8Array,d:number){
 const memory=before.slice();transfer(memory,d,true);
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return releaseResourcePages(memory,d,v.getUint16(d+0xa032,true));
}
