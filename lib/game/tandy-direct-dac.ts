import {originalTandyDacGain} from './tandy-dac-transfer.ts';
/** TL technical reference, PSSJ software specification pp8-10: C4=3
 * selects CPU direct writes at C5; C7 amplitude also applies to raw DAC.
 * Caller supplies reset state and write timing. No DMA/analog defaults. */
export function createOriginalTandyDirectDac(initial:{mode:number;data:number;frequencyLow:number;amplitudeFrequency:number}){
 const byte=(value:number)=>{if(!Number.isInteger(value)||value<0||value>255)throw Error('Invalid Tandy DAC register byte');return value;};
 const modeValue=(value:number)=>{byte(value);if(value!==0&&value!==3)throw Error('Tandy DAC mode requires a separate hardware host');return value;};
 let mode=modeValue(initial.mode),data=byte(initial.data),low=byte(initial.frequencyLow),high=byte(initial.amplitudeFrequency);
 return {snapshot:()=>({mode,data,frequencyLow:low,amplitudeFrequency:high}),
  write(port:number,value:number){
   byte(value);
   if(port===0xc4)mode=modeValue(value);
   else if(port===0xc5){if(mode!==3)throw Error('Tandy DAC data write requires direct mode');data=value;}
   else if(port===0xc6)low=value;
   else if(port===0xc7)high=value;
   else throw Error('Unsupported Tandy DAC register');
  },
  // Inactive modes are not silently interpreted as an audio waveform. The
  // owning mixer decides its non-direct-mode routing, not this latch model.
  sample(){return mode===3?{value:data,gain:originalTandyDacGain((high>>>5)&7)}:null;},
 };
}
