export interface OriginalSetupConfigurationHost {
 open(path:string,mode:number):number|Promise<number>;
 read(handle:number,limit:number):{result:number;bytes:Uint8Array}|Promise<{result:number;bytes:Uint8Array}>;
 close(handle:number):number|Promise<number>;
 detectVideo():number|Promise<number>;
 error(code:number,path:string):void|Promise<void>;
}
const signed=(n:number)=>n<<16>>16;
export function setOriginalSetupChoice(memory:Uint8Array,descriptor:number,id:number,value:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at&65535,true),first=word(descriptor);let entry=first;
 do{if(word(entry)===(id&65535))v.setUint16((entry+4)&65535,value&65535,true);entry=word(entry+14);}while(entry!==first);
}
/** Original SETUP2D2..4DC. Retains the200-byte read buffer's unused tail and
 * its token helper's space-only delimiter and caller cursor advancement. */
export async function loadOriginalSetupConfiguration(memory:Uint8Array,host:OriginalSetupConfigurationHost){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at&65535,true),byte=(at:number)=>memory[at&65535];
 const text=(at:number)=>{let out='';for(let i=0;i<65536;i++){const n=byte(at+i);if(!n)return out;out+=String.fromCharCode(n);}throw Error('Original setup string has no terminator');};
 const token=(at:number)=>{if(!byte(at))return 0;while(byte(at)===32)at=(at+1)&65535;let to=0x99a4;for(let i=0;i<65536;i++){const n=byte(at++);if(!n||n===32){memory[to&65535]=0;return 0x99a4;}memory[to++&65535]=n;}throw Error('Original setup token has no terminator');};
 const number=(at:number)=>{let sign=1,value=0;if(byte(at)===45){sign=-1;at++;}while(byte(at)>=48&&byte(at)<=57)value=(value*10+byte(at++)-48)&65535;return signed(value*sign);};
 v.setUint16(0xaa12,1,true);const path=text(word(12)),handle=signed(await host.open(path,0));
 if(handle<0){const video=await host.detectVideo();setOriginalSetupChoice(memory,0x19a,0,video);setOriginalSetupChoice(memory,0x19a,1,video===3?2:1);v.setUint16(0xaa12,0,true);return;}
 const read=await host.read(handle,200);memory.set(read.bytes.subarray(0,200),0x164e);if(signed(read.result)<0)await host.error(2,path);
 if(signed(await host.close(handle))<0)await host.error(5,path);
 let cursor=0x164e;const next=()=>{const pointer=token(cursor);cursor=(cursor+text(pointer).length+1)&65535;return pointer;};
 if(text(next())!==text(0x6dc))return;
 const values=Array.from({length:6},()=>number(next()));
 for(let i=0;i<5;i++)setOriginalSetupChoice(memory,0x19a,i,values[i]);setOriginalSetupChoice(memory,0x278,values[1],values[5]);
}
export function getOriginalSetupChoice(memory:Uint8Array,descriptor:number,id:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at&65535,true),first=word(descriptor);let entry=first,result=-1;
 do{if(word(entry)===(id&65535))result=signed(word(entry+4));entry=word(entry+14);}while(entry!==first);return result;
}
export interface OriginalSetupSaveHost {
 create(path:string,attribute:number):number|Promise<number>;
 write(handle:number,bytes:Uint8Array):number|Promise<number>;
 close(handle:number):number|Promise<number>;
 error(code:number,path:string):void|Promise<void>;
}
/** Original SETUP0010..02D0, including exact command strings, retained digit
 * scratch and its signed minimum-integer formatting quirk. */
export async function saveOriginalSetupConfiguration(memory:Uint8Array,host:OriginalSetupSaveHost){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(at&65535,true);
 const bytes=(at:number)=>{const out:number[]=[];for(let i=0;i<65536;i++){const n=memory[(at+i)&65535];if(!n)return out;out.push(n);}throw Error('Original setup string has no terminator');};
 let end=0x164e;
 const append=(pointer:number)=>{for(const n of bytes(pointer))memory[end++&65535]=n;memory[end&65535]=0;};
 const integer=(value:number)=>{
  let at=0x999a;value=signed(value);if(value<0){memory[at++]=45;value=signed(-value);}const first=at;
  do{const quotient=Math.trunc(value/10),remainder=value-quotient*10;memory[at++]=(remainder+48)&255;value=quotient;}while(value>0);
  memory[at]=0;for(let left=first,right=at-1;left<right;left++,right--){const n=memory[left];memory[left]=memory[right];memory[right]=n;}
  append(0x999a);
 };
 append(0x6be);const values:number[]=[];
 for(let i=0;i<5;i++){values.push(getOriginalSetupChoice(memory,0x19a,i));integer(values[i]);append(word(14));}
 integer(getOriginalSetupChoice(memory,0x278,values[1]));append(0x6c4);append(word(0x76+values[0]*2));
 for(const [value,table] of [[values[1],0x82],[values[2],0x10],[values[3],0x16],[values[4],0x22]])if(value!==-1)append(word(table+value*2));
 for(const pointer of [0x6c8,0x46,0x6cc,word(0x8e+values[0]*2),0x6d0,0x9a,0x6d4,0xa4,0x6d8])append(pointer);
 const output=Uint8Array.from(bytes(0x164e)),path=String.fromCharCode(...bytes(word(12))),handle=signed(await host.create(path,0));
 if(handle<0)await host.error(4,path);const count=signed(await host.write(handle,output));if(count<0)await host.error(1,path);if(count<output.length)await host.error(7,path);
 if(signed(await host.close(handle))<0)await host.error(5,path);v.setUint16(0xaa12,1,true);
 return output;
}
