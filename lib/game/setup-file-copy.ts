import type {OriginalSetupConfigurationHost,OriginalSetupSaveHost} from './native-setup-configuration.ts';
export interface OriginalSetupCopyHost extends OriginalSetupConfigurationHost,OriginalSetupSaveHost {copyTimestamp(source:number,destination:number):void|Promise<void>;}
/** SETUP0522 copies in32767-byte blocks, retaining the unread buffer tail,
 * then copies the timestamp before closing destination and source in that order. */
export async function copyOriginalSetupFile(memory:Uint8Array,destination:string,source:string,host:OriginalSetupCopyHost){
 const signed=(n:number)=>n<<16>>16;
 const input=signed(await host.open(source,0));if(input<0)await host.error(3,source);
 const output=signed(await host.create(destination,0));if(output<0)await host.error(4,destination);
 for(;;){
  const block=await host.read(input,32767);memory.set(block.bytes.subarray(0,32767),0x1716);const count=signed(block.result);
  if(count<=0){if(count<0)await host.error(2,source);break;}
  const written=signed(await host.write(output,memory.slice(0x1716,0x1716+count)));if(written<0)await host.error(1,destination);if(written<count)await host.error(7,destination);
 }
 await host.copyTimestamp(input,output);
 if(signed(await host.close(output))<0)await host.error(5,destination);
 if(signed(await host.close(input))<0)await host.error(5,source);
}
