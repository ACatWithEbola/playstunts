/** Original 150c8..1518f digital speedometer. The caller at 150e2 uses the
 * high byte of the unsigned 8.8 speed word. Hundreds are limited to 1 or 2
 * by that original byte range. The incoming leading flag is retained caller
 * stack state; it is not initialized by this draw branch.
 */
export function stepCockpitDigitalDigits(speed:number,points:readonly (readonly number[])[],retainedByte:number){
 let leading=retainedByte&255;
 let value=(speed&65535)>>>8,hundreds=0;
 const draws:{digit:number;x:number;y:number}[]=[];
 const emit=(digit:number,place:number)=>{const point=points[place];if(!point||point.length<2)throw Error('Missing original digital digit position');draws.push({digit,x:point[0],y:point[1]});};
 if(value>=200){hundreds=2;value-=200;}else if(value>=100){hundreds=1;value-=100;}
 if(hundreds){emit(hundreds,0);leading=1;}
 const tens=Math.trunc(value/10);
 if(tens||leading){emit(tens,1);value-=tens*10;leading=1;}
 emit(value,2);
 return {draws,retainedByte:leading};
}

export function cockpitDigitalDigits(speed:number,points:readonly (readonly number[])[],leading:boolean){
 return stepCockpitDigitalDigits(speed,points,Number(leading)).draws;
}
/** Original BP-relative retained byte. The host supplies the actual caller
 * frame; nothing here assumes a cleared stack or a persistent UI variable.
 */
export function cockpitDigitalMemory(before:Uint8Array,stackSegment:number,basePointer:number,speed:number,points:readonly (readonly number[])[]){
 const address=stackSegment*16+((basePointer-0x1c)&65535);
 if(!Number.isInteger(address)||address<0||address>=before.length)throw Error('Original digital caller stack is outside memory');
 const result=stepCockpitDigitalDigits(speed,points,before[address]);
 const memory=before.slice();memory[address]=result.retainedByte;
 return {memory,draws:result.draws};
}
