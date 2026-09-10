/** Original2B868 filename builder. Preserve the working buffer's retained tail
 * and its last-backslash path rule; existing three-letter extensions survive. */
export function buildOriginalSoundResourceFilename(memory:Uint8Array,d:number,name:number,extension:number,prefix:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const middle={mcga:0,cga:0x5e0,tandy:0x620,ega:0x460}[mode];
 const u=(n:number)=>n&65535,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),byte=(at:number)=>memory[d+u(at)],put=(at:number,value:number)=>{memory[d+u(at)]=value;};
 const length=(at:number)=>{for(let i=0;i<65535;i++)if(!byte(at+i))return i;throw Error('Original sound filename is not terminated');};
 const copy=(destination:number,source:number)=>{const count=length(source)+1;let i=0;for(;i+1<count;i+=2)v.setUint16(d+u(destination+i),v.getUint16(d+u(source+i),true),true);if(i<count)put(destination+i,byte(source+i));};
 const lastSlash=(at:number)=>{let last=0;for(let i=0;i<65535;i++){const value=byte(at+i);if(!value)return last;if(value===92)last=u(at+i);}throw Error('Original sound path is not terminated');};
 const append=(source:number)=>copy((0x73e0+middle)+length((0x73e0+middle)),source);
 copy((0x73e0+middle),name);const slash=lastSlash((0x73e0+middle));put(slash?slash+1:(0x73e0+middle),0);
 append(prefix);const originalSlash=lastSlash(name);append(originalSlash?originalSlash+1:name);
 const size=length((0x73e0+middle));
 if(byte((0x73dc+middle)+size)!==46||size<=4){append(0x4e6c);append(extension);}
 return (0x73e0+middle);
}
