/** Bound network bytes before allocating/parsing an entire public upload.
 * Oversize returns a sentinel longer than the caller's existing limit, so
 * existing translated rejection messages and response statuses stay intact. */
export async function boundedRequestText(request:Request,maxBytes:number){
 const tooLarge=()=> ' '.repeat(maxBytes+1);
 const declared=request.headers.get('content-length');
 if(declared&&/^\d+$/.test(declared)&&Number(declared)>maxBytes)return tooLarge();
 if(!request.body)return '';
 const reader=request.body.getReader(),decoder=new TextDecoder();let bytes=0,text='';
 try{for(;;){const chunk=await reader.read();if(chunk.done)return text+decoder.decode();bytes+=chunk.value.byteLength;if(bytes>maxBytes){void reader.cancel().catch(()=>{});return tooLarge();}text+=decoder.decode(chunk.value,{stream:true});}}
 finally{reader.releaseLock();}
}
