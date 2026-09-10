import type {RaceCameraState} from '../physics/race-cameras.ts';
import type {Vector} from '../physics/math.ts';
import {resetRaceSession} from './reset-race-session.ts';
import {initializeRaceDriving} from './initialized-player-driving.ts';
/** Complete original 9178..9577 initialization with explicit retained DOS memory. */
export function initializeRaceSession(before:Uint8Array,dataSegment:number,...args:Parameters<typeof initializeRaceDriving> extends [unknown,...infer Rest]?Rest:never){
 const memory=resetRaceSession(before,dataSegment,args[2].mode);
 const initialized=initializeRaceDriving(memory.subarray(dataSegment,dataSegment+65536),...args);
 memory.set(initialized.data,dataSegment);
 const view=new DataView(initialized.data.buffer,initialized.data.byteOffset,initialized.data.byteLength);
 const cameras=[0,1].map(i=>({position:[0,1,2].map(a=>view.getInt16(0x8c06+i*6+a*2,true)) as Vector,previous:[0,1,2].map(a=>view.getInt16(0x8c12+i*6+a*2,true)) as Vector,selected:initialized.data[0x8ead+i]})) as [RaceCameraState,RaceCameraState];
 return {memory,state:initialized.state,cameras,runtime:{done:initialized.data[0x8ff4],mode:initialized.data[0xa3c2]}};
}
