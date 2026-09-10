/** Dedicated flat circuit for validating the reconstructed native physics. */
export function testCircuit():number[]{
 const raw=Array<number>(1802).fill(0);
 const put=(x:number,z:number,id:number)=>{raw[z*30+x]=id};
 for(let z=6;z<12;z++){put(7,z,4);put(12,z,4)}
 for(let x=8;x<12;x++){put(x,5,5);put(x,12,5)}
 put(7,5,8);put(12,5,9);put(12,12,7);put(7,12,6);
 return raw;
}
