import type {PlayerAudioChip} from './player-audio-stream.ts';

/** Adapt a chip initialized at twice the playback rate. Each output frame
 * consumes two chip frames, preserving register-write boundaries even for a
 * one-frame output span without advancing the chip past a pending write.
 */
export function createOplOutput(chip:PlayerAudioChip):PlayerAudioChip {
 let output=new Int16Array(1024);
 return {
  write(register,value){chip.write(register,value);},
  generate(samples){
   if(!Number.isInteger(samples)||samples<1||samples>512)throw Error('Invalid OPL output span');
   for(let position=0;position<samples;){
    const count=Math.min(256,samples-position);
    chip.generate(count*2);
    const source=chip.getBuffer();
    if(source.length<count*4)throw Error('AdLib chip returned an incomplete stereo buffer');
    for(let i=0;i<count;i++){
     output[(position+i)*2]=Math.trunc((source[i*4]+source[i*4+2])/2);
     output[(position+i)*2+1]=Math.trunc((source[i*4+1]+source[i*4+3])/2);
    }
    position+=count;
   }
  },
  getBuffer(){return output;},
 };
}
