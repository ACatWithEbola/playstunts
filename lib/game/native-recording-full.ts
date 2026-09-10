export interface NativeRecordingFullHost {
 suspendInput():void;resumeInput():void;pauseAudio():void;resumeAudio():void;resetCounter():void;
 dialog(resource:string,mode:number,selected:number):Promise<number>;
 raceEvent(mode:number,value:number):void;
}
/** Original13b9d..13c17. See Replay is initially selected; Escape becomes
 * Continue Now. Audio/input state is restored before the chosen action. */
export async function handleNativeRecordingFull(host:NativeRecordingFullHost,state:{pending:number;done:number}){
 if(!(state.pending&255))return;
 host.suspendInput();host.pauseAudio();
 let selected=await host.dialog('erbf',2,1);if((selected&65535)===65535)selected=0;
 host.resumeAudio();host.resetCounter();host.resumeInput();
 if(selected&65535){host.raceEvent(4,0);state.done=1;}
 state.pending=0;
}
