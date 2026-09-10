/** Original AD15 A69's two DIV/SHR/CMP/ADC roundings. The source uses
 *1193180 here; it does not substitute a rounded100Hz callback frequency. */
export function originalAdlibSampleTiming(rate:number){
 rate&=65535;
 if(rate<19)throw Error('Original AdLib sample rate causes division overflow');
 const rounded=(numerator:number,denominator:number)=>Math.floor(numerator/denominator)+Number((denominator>>>1)<numerator%denominator);
 const pitDivisor=rounded(0x1234dc,rate),handoffDivider=rounded(0x2e9c,pitDivisor);
 return {pitDivisor,handoffDivider};
}
