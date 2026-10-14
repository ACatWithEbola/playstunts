import type {RaceCameraState} from '../physics/race-cameras.ts';
import type {Vector} from '../physics/math.ts';
import {resetRaceSession} from './reset-race-session.ts';
import {initializeRaceDriving,readPlayerDrivingState} from './initialized-player-driving.ts';
/** Complete original 9178..9577 initialization with explicit retained DOS memory. */
export function initializeRaceSession(before:Uint8Array,dataSegment:number,...args:Parameters<typeof initializeRaceDriving> extends [unknown,...infer Rest]?Rest:never){
 const cadenceOnly=args[2].physicsEngine==='ms-1991'&&(args[2].mode&65535)===65533;
 // MS91 mode-3 sets derived cadence outside the retained race snapshot, then
 // returns. Native cadence is explicit session context; do not reset its cars.
 const memory=cadenceOnly?before.slice():resetRaceSession(before,dataSegment,args[2].mode,args[2].framesPerSecond??20,args[2].physicsEngine);
 if(dataSegment<0||dataSegment+65536>memory.length)throw Error('Original data segment is outside memory');
 const data=memory.subarray(dataSegment,dataSegment+65536);
 const initialized=cadenceOnly?{data,state:readPlayerDrivingState(data)}:initializeRaceDriving(data,...args);
 memory.set(initialized.data,dataSegment);
 const view=new DataView(initialized.data.buffer,initialized.data.byteOffset,initialized.data.byteLength);
 const cameras=[0,1].map(i=>({position:[0,1,2].map(a=>view.getInt16(0x8c06+i*6+a*2,true)) as Vector,previous:[0,1,2].map(a=>view.getInt16(0x8c12+i*6+a*2,true)) as Vector,selected:initialized.data[0x8ead+i]})) as [RaceCameraState,RaceCameraState];
 return {memory,state:initialized.state,cameras,runtime:{done:initialized.data[0x8ff4],mode:initialized.data[0xa3c2]}};
}
