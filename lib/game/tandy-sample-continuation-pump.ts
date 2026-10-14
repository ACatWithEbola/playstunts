import type {createAllocatedTandyRaceAudio} from './allocated-tandy-race-audio.ts';
type Program=ReturnType<ReturnType<typeof createAllocatedTandyRaceAudio>['tickProgram']>;
type Request=Extract<ReturnType<Program['next']>,{done?:false}>['value']['sampleStarts'][number];
/** CPU continuation only: external hardware IRQs keep advancing independently.
 * Owner invokes interrupt after servicing a real IRQ, at its actual position.
 * No timers, busy clearing, guessed delay or microtask timing are introduced. */
export function createTandySampleContinuationPump(owner:{
 write(writes:number[][],position:number):void;
 bios(requests:Extract<ReturnType<Program['next']>,{done?:false}>['value']['bios']):void;
 status(channel:number):number;requestStop():boolean;
 start(request:Request,position:number):boolean;
}){
 let program:Program|undefined,pending:Request[]=[],stopping=false,closed=false,executing=false;
 const cancel=()=>{const previous=program;program=undefined;pending=[];stopping=false;previous?.return(undefined as never);};
 function drive(position:number){
  if(!Number.isSafeInteger(position)||position<0)throw Error('Invalid Tandy continuation position');
  if(executing)throw Error('Tandy continuation pump reentry');
  executing=true;
  try{
   while(program){
    if(pending.length){
     if(!stopping){owner.requestStop();if(!program)return false;stopping=true;}
     const status=owner.status(0);if(!program)return false;
     if(status===0)return false;
     const request=pending.shift()!;stopping=false;
     // Original callback returns normally for a zero-length sample. False
     // means no transfer started, not cancellation; owner errors must throw.
     owner.start(request,position);if(!program)return false;
     continue;
    }
    const step=program.next();
    owner.write(step.value.writes,position);if(!program)return false;
    owner.bios(step.value.bios);if(!program)return false;
    if(step.done){program=undefined;return true;}
    pending=step.value.sampleStarts.map(request=>({...request}));
    for(const request of pending){
     for(const value of Object.values(request))if(!Number.isInteger(value)||value<0||value>65535)throw Error('Invalid Tandy continuation sample word');
     if(request.channel!==0)throw Error('Unsupported Tandy continuation sample channel');
    }
   }
   return true;
  }catch(error){cancel();throw error;}finally{executing=false;}
 }
 return {
  get waiting(){return !!program;},
  start(next:Program,position:number){
   if(closed)throw Error('Tandy continuation pump closed');
   if(program)throw Error('Tandy continuation already pending');
   if(!Number.isSafeInteger(position)||position<0)throw Error('Invalid Tandy continuation position');
   program=next;return drive(position);
  },
  interrupt(position:number){if(closed)throw Error('Tandy continuation pump closed');return drive(position);},
  cancel,
  close(){if(closed)return;closed=true;cancel();},
 };
}
