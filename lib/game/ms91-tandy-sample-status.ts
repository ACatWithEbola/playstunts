/** Original modern TD15:C91 returns zero only while channel0's transfer is
 * active. Other channels return one, independently of the sample flag. */
export function ms91TandySampleStatus(driver:Uint8Array,channel:number):0|1{
 if(driver.length!==3241)throw Error('Modern Tandy sample status requires complete driver state');
 return (channel&65535)===0&&driver[0x595]!==0?0:1;
}
