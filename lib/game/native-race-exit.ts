export interface NativeRaceExitHost {
 memory():Uint8Array;hasAlternateBuffer():boolean;hideMouse():void;showMouse():void;
 selectBackBuffer():void;selectFrontBuffer():void;clearScreen(x:number,y:number,width:number,height:number,color:number):void;
 copyBackBuffer():void;pauseAudio():void;removeAudioTimer():void;waitForOpponent():Promise<void>;
 resetMouse(mode:number):void;removeFrameCallback():Promise<void>;freeCars():void;releaseInput():Promise<void>;showWaiting():void;
}
/** Original14034..14181. Opponent simulation, graphics and resource cleanup
 * keep their own original runtimes; this coordinator preserves their order. */
export async function finishNativeRace(host:NativeRaceExitHost,d:number){
 if(host.memory()[d+0xaa46]&&host.hasAlternateBuffer()){
  host.hideMouse();host.selectBackBuffer();host.clearScreen(0,0,320,200,0);host.selectFrontBuffer();host.showMouse();
 }
 host.copyBackBuffer();host.memory()[d+0x9aca]=1;host.pauseAudio();host.removeAudioTimer();
 await host.waitForOpponent();host.memory()[d+0xa34e]=0;
 host.resetMouse(0);await host.removeFrameCallback();host.freeCars();
 const memory=host.memory();new DataView(memory.buffer,memory.byteOffset,memory.byteLength).setUint16(d+0x8a10,100,true);
 await host.releaseInput();host.showWaiting();
}
