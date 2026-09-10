import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';

export interface OriginalTandyDacTransfer {
 address:number;
 remaining:number;
 divisor:number;
 volume:number;
}

/** Tandy 1000 TL technical reference, PSSJ specification p10: seven output
 * levels separated by approximately 3dB; zero mutes. This ideal gain curve
 * does not describe the machine's analog filtering or speaker response. */
export function originalTandyDacGain(volume:number){
 if(!Number.isInteger(volume)||volume<0||volume>7)throw new RangeError('Invalid Tandy DAC volume');
 return volume===0?0:10**((volume-7)*3/20);
}

/** The documented BIOS playback/busy contract, separated from CPU, DMA and
 * interrupt timing. The caller supplies each actual DMA transfer event and
 * delivers the resulting completion notification when interrupts permit it.
 * No BIOS execution time, zero-length behavior, AH84 stop timing or divisor
 * rewrite phase is invented here. See TL BIOS services pp43–46.
 *
 * Reads are physical and live: BIOS hides DMA's 64KiB boundary from callers.
 * A silent AX8300/CX1 request follows the same busy rule as audible playback.
 * It is not a stop command. */
export function createOriginalTandyDacTransfer(readByte:(physicalAddress:number)=>number){
 let transfer:OriginalTandyDacTransfer|null=null;
 return {
  snapshot():OriginalTandyDacTransfer|null{return transfer?{...transfer}:null;},
  status(){return {ax:0x00c4,carry:transfer!==null};},
  play(request:OriginalTandyBiosSound){
   if((request.ax>>>8)!==0x83)throw new Error('Expected Tandy BIOS playback request');
   // BIOS reports a busy device without replacing the active buffer.
   if(transfer)return {ax:request.ax&255,carry:true};
   const volume=request.ax&255;
   if(!Number.isInteger(request.cx)||request.cx<1||request.cx>65535)throw new RangeError('Unresolved Tandy BIOS buffer length');
   if(!Number.isInteger(request.dx)||request.dx<1||request.dx>4095)throw new RangeError('Unresolved Tandy BIOS transfer divisor');
   originalTandyDacGain(volume);
   transfer={address:(((request.es&65535)<<4)+(request.bx&65535))&0xfffff,remaining:request.cx,divisor:request.dx,volume};
   return {ax:volume,carry:false};
  },
  /** One externally timed DMA byte. Completion becomes a pending BIOS INT15
   * AX91FB event; calling this method does not execute the driver's handler. */
  transferByte(){
   if(!transfer)return null;
   const value=readByte(transfer.address);
   if(!Number.isInteger(value)||value<0||value>255)throw new RangeError('Invalid Tandy DMA sample byte');
   const result={address:transfer.address,value,volume:transfer.volume,completion:transfer.remaining===1?0x91fb:null};
   transfer.address=(transfer.address+1)&0xfffff;
   if(--transfer.remaining===0)transfer=null;
   return result;
  },
  /** C6/C7 modify the running channel's frequency and amplitude. Scheduling
   * the resulting clock edge remains the hardware host's responsibility. */
  write(port:number,value:number){
   if(port!==0xc6&&port!==0xc7)throw new Error('Expected Tandy DAC frequency/amplitude port');
   if(!transfer)return;
   if(port===0xc6)transfer.divisor=(transfer.divisor&0xf00)|(value&255);
   else {transfer.divisor=(transfer.divisor&255)|((value&15)<<8);transfer.volume=(value>>>5)&7;}
  },
 };
}
