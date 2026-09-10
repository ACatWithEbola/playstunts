/** Supplied1bbf2..1bcba: signed20Hz time, two-character fields, optional
 * hundredths. The original field formatter truncates excess leading digits. */
export function originalGameTime(ticks:number,fractions=true){
 ticks=ticks<<16>>16;
 const minutes=Math.trunc(ticks/1200),seconds=Math.trunc(ticks%1200/20),hundredths=ticks%20*5;
 const field=(value:number,zero:boolean)=>{const result=String(value).slice(-2).padStart(2,' ');return zero?result.replace(/^ /,'0'):result;};
 return field(minutes,false)+':'+field(seconds,true)+(fractions?'.'+field(hundredths,true):'');
}
