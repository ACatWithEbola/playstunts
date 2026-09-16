const ROMS=[
 {name:'ctrl_mt32_1_07.rom',bytes:65536,sha256:'a73a06c23ed38370e58a11fb1b86f7ea4c547061a60d7aa62bae446235fd2dff'},
 {name:'pcm_mt32.rom',bytes:524288,sha256:'d9164063f293410cf33f2f64cdcea6893b44723fe41938e07ec9aef58b406238'},
] as const;

const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');

/** MT-32 is optional. It is available only when both supported, legally
 * supplied ROMs are present; a renamed or incompatible ROM is not accepted. */
export async function browserMt32Installed(signal:AbortSignal,request:typeof fetch=fetch,digest=(bytes:ArrayBuffer)=>crypto.subtle.digest('SHA-256',bytes)){
 try{
  const checks=ROMS.map(async rom=>{
   const response=await request('/game/mt32-local/'+rom.name,{signal,cache:'force-cache'});
   if(!response.ok)return false;
   const bytes=await response.arrayBuffer();
   if(bytes.byteLength!==rom.bytes)return false;
   return hex(await digest(bytes))===rom.sha256;
  });
  return (await Promise.all(checks)).every(Boolean);
 }catch(error){
  if(signal.aborted||(error instanceof DOMException&&error.name==='AbortError'))throw error;
  return false;
 }
}

export const MT32_INSTALLATION_GUIDE='https://github.com/ACatWithEbola/playstunts#roland-mt-32';
