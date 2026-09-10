/** Original dialog-result branch 0x1d63d..0x1d654. */
export function editorHorizonResult(old:number,choice:number){
 const byte=choice&255;
 return byte===255||byte===5?{horizon:old,changed:false}:{horizon:byte,changed:true};
}
