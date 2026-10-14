/** Bounded UART command profile for the driver's FF/3F handshake.
 * Queue/status/reset semantics follow the DOSBox Staging MPU model; reset
 * duration is explicitly supplied, not asserted as original hardware timing.
 * This is not the intelligent sequencer or MIDI serial transport. */
export function createMt32UartHandshake(now:()=>number,resetClocks:number){
 if(!Number.isSafeInteger(resetClocks)||resetClocks<1)throw Error('Invalid MPU reset duration');
 let uart=false,resetUntil:number|undefined,pending:number|undefined,last=0;
 const received:number[]=[];
 const time=()=>{
  const value=now();if(!Number.isSafeInteger(value)||value<last)throw Error('Invalid MPU clock');last=value;return value;
 };
 const finish=()=>{
  if(resetUntil!==undefined&&time()>=resetUntil){resetUntil=undefined;
   if(pending!==undefined){const value=pending;pending=undefined;command(value);}
  }
 };
 const command=(value:number)=>{
  if(uart&&value!==255)return;
  if(resetUntil!==undefined&&value!==255){pending=value;return;}
  if(value===255){
   const deadline=time()+resetClocks;if(!Number.isSafeInteger(deadline))throw Error('MPU reset clock overflow');
   const acknowledge=!uart;uart=false;received.length=0;resetUntil=deadline;pending=undefined;
   if(acknowledge)received.push(254);
  }else{uart=true;received.push(254);}
 };
 return {
  get uart(){finish();return uart;},
  read(port:number){
   if(port!==0x330&&port!==0x331)throw Error('Unsupported MPU read port');
   time();finish();return port===0x331?0x3f|(pending!==undefined?0x40:0)|(received.length?0:0x80):received.shift()??254;
  },
  writeCommand(value:number){
   if(value!==255&&value!==63)throw Error('Unsupported MPU command');
   time();finish();command(value);
  },
 };
}
