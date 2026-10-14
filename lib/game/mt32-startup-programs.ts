import {initializeOriginalMt32,uploadOriginalMt32Patches,sendOriginalMt32SystemExclusive} from './mt32-system-exclusive.ts';
import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
/** Shared startup order for browser and timed-host integration. The executor
 * owns hardware readiness, elapsed time and cancellation; modern waits must
 * never be executed by an adapter that discards PIT operations. */
export async function executeMt32StartupPrograms(driver:Uint8Array,patch:Uint8Array,generation:'ms-1990'|'ms-1991',execute:(program:OriginalMt32MpuProgram)=>Promise<number>){
 if(generation!=='ms-1990'&&generation!=='ms-1991')throw Error('Unsupported Roland startup generation');
 if(driver.length!==(generation==='ms-1991'?1750:1667))throw Error('Roland startup driver size does not match generation');
 // Validate only backing storage, not original MIDI values or timbre quirks.
 // Otherwise undefined reads become zero bytes inside the original uploader.
 if(!patch.length||patch.length>65536)throw Error('Incomplete Roland patch library');
 // Own one consistent resource image across asynchronous device operations.
 // A caller reusing its buffers must not alter a half-completed upload.
 driver=Uint8Array.from(driver);patch=Uint8Array.from(patch);
 let position=1;
 for(let record=0;record<patch[0];record++){
  if(position+8>patch.length)throw Error('Incomplete Roland patch record');
  const custom=patch[position]===2;position+=8;
  if(custom){if(position+246>patch.length)throw Error('Incomplete Roland custom timbre');position+=246;}
 }
 if(await execute(initializeOriginalMt32(driver,generation))!==0xfff6)throw Error('Unexpected Roland initialization result');
 if(await execute(uploadOriginalMt32Patches(driver,(_,offset)=>patch[offset],0,0,generation))!==0)throw Error('Roland patch upload failed');
 const systemVolume=Uint8Array.from([16,0,22,100]);
 if(await execute(sendOriginalMt32SystemExclusive(driver,(_,offset)=>systemVolume[offset],0,0,4,generation))!==0)throw Error('Roland startup volume failed');
}
