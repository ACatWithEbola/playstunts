/** Supplied SETUP initialized data through DS:164D; C startup clears its BSS.
 * Browser setup must begin with fresh state, never a captured menu session. */
export function createOriginalSetupMemory(data:Uint8Array){
 if(data.length!==0x164e)throw Error('Original SETUP initialized data has an unexpected size');
 const memory=new Uint8Array(65536);memory.set(data);return memory;
}
