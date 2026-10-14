import type {runTandySampleContinuation} from './run-tandy-sample-continuation.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
type Program=Parameters<typeof runTandySampleContinuation>[0];
/** CPU ownership only. The hardware host supplies actual BIOS entry/return
 * positions. DMA/completion may proceed while CPU waits; neither busy flags
 * nor hardware time are manufactured by this pump. */
export function createLegacyTandyContinuationPump(owner:{
 write(writes:number[][],position:number):void;
 /** True means this BIOS call has returned; false suspends until biosReturned. */
 bios(request:OriginalTandyBiosSound,position:number):boolean;
}){
 let program:Program|undefined,pending:OriginalTandyBiosSound[]=[],waitingBios=false,terminal=false,closed=false,executing=false;
 const positionValid=(position:number)=>{if(!Number.isSafeInteger(position)||position<0)throw Error('Invalid legacy BIOS boundary position');};
 const cancel=()=>{const previous=program;program=undefined;pending=[];waitingBios=false;terminal=false;previous?.return(undefined as never);};
 function drive(position:number){
  positionValid(position);if(executing)throw Error('Legacy BIOS continuation reentry');executing=true;
  try{while(program){
   if(waitingBios)return false;
   if(pending.length){const request=pending.shift()!;const returned=owner.bios({...request},position);if(!program)return false;if(typeof returned!=='boolean')throw Error('Legacy BIOS owner must report explicit return');if(!returned){waitingBios=true;return false;}continue;}
   if(terminal){program=undefined;terminal=false;return true;}
   const step=program.next();
   if(!step.done&&step.value.sampleStarts.length)throw Error('Legacy BIOS pump cannot deliver modern sample replacement');
   pending=step.value.bios.map(request=>({...request}));terminal=!!step.done;
   owner.write(step.value.writes.map(write=>write.slice()),position);if(!program)return false;
  }return true;
  }catch(error){cancel();throw error;}finally{executing=false;}
 }
 return {
  get waiting(){return !!program;},get waitingForBiosReturn(){return waitingBios;},
  start(next:Program,position:number){if(closed)throw Error('Legacy BIOS pump closed');if(executing)throw Error('Legacy BIOS continuation reentry');if(program)throw Error('Legacy BIOS continuation already pending');positionValid(position);program=next;return drive(position);},
  biosReturned(position:number){if(closed)throw Error('Legacy BIOS pump closed');positionValid(position);if(executing)throw Error('Legacy BIOS continuation reentry');if(!program||!waitingBios)throw Error('No pending legacy BIOS return');waitingBios=false;return drive(position);},
  cancel,close(){if(closed)return;closed=true;cancel();},
 };
}
