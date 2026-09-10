/** Supplied 0x1bac0..0x1bb2a; menu colors at DS:4e8e = 5,14.
 * Preserve signed-word comparison and the inclusive 60-tick endpoint.
 */
export function originalMenuSelectionFlash(counter:number,delta:number,colours:Readonly<{late:number;early:number}>={late:5,early:14}){
 let value=(counter+delta)&65535;
 const signed=()=>value<32768?value:value-65536;
 while(signed()>60)value-=60;
 return {counter:value,color:signed()>30?colours.late:colours.early};
}
