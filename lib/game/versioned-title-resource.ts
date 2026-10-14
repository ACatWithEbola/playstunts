import resource from './ms91-title-resource.json' with {type:'json'};
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import type {createNativeResourceCatalog} from './native-resource-catalog.ts';
import {decodeOriginalPackedResource} from './decode-packed-resource.ts';
import {soundResourceOffset} from './sound-resource.ts';
function packedTitle(){
 const bytes=Uint8Array.from(atob(resource.base64),c=>c.charCodeAt(0));
 if(bytes.length!==resource.bytes)throw Error('MS91 title resource length mismatch');
 return bytes;
}
/** Raster opening uses the same original bank as the allocated display path.
 * Enhanced artwork remains a separate presentation and is not replaced. */
export function versionedTitleArtwork<T extends {resources:Record<string,{bytes:number[]}>}>(legacy:T,engine?:PhysicsEngineVersion){
 if(engine!=='ms-1991')return legacy;
 const bank=decodeOriginalPackedResource(packedTitle()).bytes;
 const offset=soundResourceOffset(bank,Uint8Array.from([116,105,116,108]));
 if(offset===null)throw Error('Missing MS91 title bitmap');
 const view=new DataView(bank.buffer,bank.byteOffset,bank.byteLength);
 const length=16+view.getUint16(offset,true)*view.getUint16(offset+2,true);
 if(length!==64016||offset+length>bank.length)throw Error('Unexpected MS91 title bitmap bounds');
 return {...legacy,sha256:resource.sha256,resources:{...legacy.resources,titl:{...legacy.resources.titl,offset,length,sha256:'81c3ea366d053af2a7a8f551be39fd63c4b74cb615c4574176dcd77dfb73e284',bytes:Array.from(bank.subarray(offset,offset+length))}}};
}
/** Separate read-only catalog owner prevents legacy cache contamination. */
export function versionedTitleResourceCatalog(catalog:ReturnType<typeof createNativeResourceCatalog>,engine?:PhysicsEngineVersion){
 if(engine!=='ms-1991')return catalog;
 const isTitle=(name:string)=>name.replaceAll('/','\\').split('\\').pop()!.toUpperCase()==='SDTITL.PVS';
 return {
  exists(name:string){return isTitle(name)||catalog.exists(name);},
  async read(name:string){
   if(!isTitle(name))return catalog.read(name);
   return packedTitle();
  },
 };
}
