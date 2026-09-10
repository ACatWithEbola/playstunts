import {intSin,intCos,intAtan2} from '../physics/math.ts';
/** Original24129: integer projection and its zero-vertical-angle fallback. */
export function initializeOriginalProjection(memory:Uint8Array,d:number,horizontal:number,vertical:number,width:number,height:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true),set=(at:number,value:number)=>v.setUint16(d+at,value&65535,true);
 const divide=(numerator:number,denominator:number)=>{const value=Math.floor(numerator/denominator);if(!denominator||value>65535)throw Error('Original projection division fault');return value;};
 set(0x4b90,divide((horizontal&65535)*2048,360)>>>1);set(0x4b92,divide((vertical&65535)*2048,360)>>>1);
 set(0x4b80,(width&65535)>>>1);set(0x4b88,word(0x4b80)+word(0x4b84));set(0x4b82,(height&65535)>>>1);set(0x4b8a,word(0x4b82)+word(0x4b86));
 const project=(angle:number,size:number)=>divide((intCos(angle)&65535)*size,intSin(angle)&65535);
 set(0x4b8c,project(word(0x4b90),word(0x4b80)));
 if(word(0x4b92))set(0x4b8e,project(word(0x4b92),word(0x4b82)));
 else{const horizontalScale=word(0x4b8c),scale=horizontalScale-(horizontalScale>>>3)-(horizontalScale>>>4);set(0x4b8e,scale);set(0x4b92,intAtan2(scale,word(0x4b82)));}
}
