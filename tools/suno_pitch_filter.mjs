/** Normalize input rate before intentional pitch reinterpretation. */
export function sunoPitchFilter(rate,shiftedRate){
 if(![rate,shiftedRate].every(n=>Number.isSafeInteger(n)&&n>=8000&&n<=192000))throw Error('Invalid waveform pitch sample rate');
 return ['aresample='+rate,'asetrate='+shiftedRate,'aresample='+rate];
}
