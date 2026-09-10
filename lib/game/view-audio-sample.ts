import {i16,type Vector} from '../physics/math.ts';
import {buildCameraAudioSample,buildFollowingAudioSample,type AudioSampleCar} from './audio-sample-build.ts';
export type AudioListenerView = {mode:0|2;focusOpponent:boolean}|{mode:1;current:Vector;previous:Vector}|{mode:3;trackside:Vector;heightOffset:number};
/** Original view dispatch0xa7f1..0xa976, for the four defined camera modes. */
export function buildViewAudioSample(before:Uint8Array,player:AudioSampleCar,opponent:AudioSampleCar|null,view:AudioListenerView){
 if(view.mode===0||view.mode===2)return buildFollowingAudioSample(before,player,opponent,view.focusOpponent);
 if(view.mode===1)return buildCameraAudioSample(before,player,opponent,view);
 if(view.mode===3){const current:Vector=[view.trackside[0],i16(view.trackside[1]+view.heightOffset+90),view.trackside[2]];return buildCameraAudioSample(before,player,opponent,{current,previous:current});}
 throw Error('Unknown original audio view mode');
}
