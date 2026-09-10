import {originalMovementAudioCall} from './movement-audio-call.ts';
import {crashFrameSounds,type RaceFrameSound} from './race-frame-sounds.ts';
import {applyOtherCarContact} from './apply-other-car-contact.ts';
import {stepPlayerDriving,type PlayerDrivingState} from './player-driving-step.ts';
import {stepOpponentDrivingRace} from './opponent-driving-race.ts';
import {stepRaceSharedEffects} from './race-shared-effects.ts';
import type {readOpponentCarState} from './read-opponent-race-state.ts';
import type {RaceCameraState} from '../physics/race-cameras.ts';
import type {Vector} from '../physics/math.ts';
import type {opponentDrivingStep} from '../physics/opponent-driving-step.ts';
export interface TwoCarRaceState {player:PlayerDrivingState;opponent:ReturnType<typeof readOpponentCarState>&{avoidance?:number};cameras:[RaceCameraState,RaceCameraState]}
type PlayerArgs=Parameters<typeof stepPlayerDriving> extends [unknown,...infer Rest]?Rest:never;
type OpponentArgs=Parameters<typeof opponentDrivingStep>;
export interface TwoCarRaceResources {
 player:PlayerArgs;trackside:Vector[];audioExiting?:number;
 opponent:{contactCaller?:NonNullable<OpponentArgs[1][0]['contactCaller']>;tuning:OpponentArgs[1][2]&OpponentArgs[4];wheels:Vector[];track:OpponentArgs[3];path:OpponentArgs[1][6];lookup:OpponentArgs[1][7];speedProfile:number;startX:number;startZ:number;startAngle:number;flags:number;timeAdjustment:number};
}
/** Active caller composition, applying cross-car writes before the next car. */
export function stepTwoCarRaceFrame(before:TwoCarRaceState,resources:TwoCarRaceResources){
 const contact=(selected:0|1,car:typeof before.opponent.car,own:NonNullable<TwoCarRaceResources['opponent']['track']['landmarks']>,other:NonNullable<TwoCarRaceResources['opponent']['track']['landmarks']>)=>({selected,dimensions:own.dimensions,radius:own.radius,body:{position:car.pose.position.map(v=>v>>6) as Vector,angles:[car.pose.rotation[2],car.pose.rotation[1],car.pose.rotation[0]] as Vector,dimensions:other.dimensions,radius:other.radius},state:{yaw:car.pose.rotation[0],speed:car.engine.speed,roadSpeed:car.engine.roadSpeed,wheelAngle:car.grip.wheelAngle,contact:car.contactFlag??0}});
 const p=resources.player[3].landmarks,r=resources.opponent,o=r.track.landmarks;
 if(!p||!o)throw Error('Shared car contact requires both original collision dimensions');
 const playerArgs=[...resources.player] as PlayerArgs;playerArgs[3]={...playerArgs[3],otherCar:contact(0,before.opponent.car,p,o)};
 const cleaned={...before.player,driving:{...before.player.driving,car:{...before.player.driving.car,contactOther:undefined,contactCrashOther:false}}};
 let player:PlayerDrivingState&{effects:ReturnType<typeof stepPlayerDriving>['effects']}=stepPlayerDriving(cleaned,...playerArgs);
 const cross=applyOtherCarContact(before.opponent.car,player.driving.car.contactOther,!!player.driving.car.contactCrashOther,1,player.driving);
 player={...player,driving:{...player.driving,race:cross.race,particles:cross.particles},effects:[...player.effects,...cross.effects]};
 const previous=before.opponent,car={...cross.car,contactOther:undefined,contactCrashOther:false},frame=resources.player[4];
 const opponentTrack={...r.track,otherCar:contact(1,player.driving.car,o,p)};
 const controls={contactCaller:r.contactCaller,position:car.pose.position,rotation:car.pose.rotation,steering:car.grip.steeringAngle,frontContact:car.grip.surfaces[0]+car.grip.surfaces[1],rearContact:car.engine.rearContact,crash:car.grip.crash,wheelAngle:car.grip.wheelAngle,roadSpeed:car.engine.roadSpeed,speed:car.engine.speed,demandedGrip:car.grip.demandedGrip,surfaceGrip:car.grip.surfaceGrip,sliding:car.grip.sliding,route:previous.route,routeTarget:previous.routeTarget,targetAlternate:previous.targetAlternate};
 const result=stepOpponentDrivingRace([car,[controls,car.engine,r.tuning,player.driving.car.pose.position,player.driving.car.grip.crash,r.track.mode??1,r.path,r.lookup,r.speedProfile],r.wheels,opponentTrack,r.tuning],{previousAngle:previous.angle,startX:r.startX,startZ:r.startZ,startAngle:r.startAngle,raceWords:player.driving.race.stats,savedRaceWords:player.driving.race.savedStats,timeAdjustment:r.timeAdjustment,flags:r.flags},player.driving);
 const opponent={...previous,contact:result.car.contactFlag??previous.contact,avoidance:result.car.decision.avoidance,car:result.car,route:result.car.decision.route,routeTarget:result.car.decision.routeTarget,targetAlternate:result.car.decision.targetAlternate??previous.targetAlternate,angle:result.tail.angle};
 const back=applyOtherCarContact(player.driving.car,result.car.contactOther,!!result.car.contactCrashOther,0,{race:result.race,particles:result.particles});
 player={...player,driving:{car:back.car,race:back.race,particles:back.particles}};
 const g=player.navigation.guidance;
 const effects=stepRaceSharedEffects([before.cameras,[{position:player.driving.car.pose.position,target:g.target,angle:g.angle,routeIndex:g.routeIndex,field9e:g.wheelAngle,crash:player.driving.car.grip.crash},{position:opponent.car.pose.position,target:opponent.routeTarget.midpoint,angle:opponent.angle,routeIndex:opponent.route.routeIndex,field9e:opponent.targetAlternate,crash:opponent.car.grip.crash}],1,frame,resources.trackside,!!(player.navigation.progress.status||player.navigation.progress.confirmations)],player.driving.particles,player.driving.car.pose.position[1]);
 const parked=before.player.driving.car,playerMoved=!(parked.grip.crash&&parked.engine.roadSpeed===0&&parked.engine.speed===0&&parked.suspension.rc1.every(n=>n===0));
 const impact=(selected:number,flags:number)=>originalMovementAudioCall(resources.player[3].mode??1,resources.audioExiting??0,selected,flags,before.player.driving.race.audioHandles,Number(before.player.driving.race.audioEnabled));
 const playerImpact=playerMoved?impact(0,player.driving.car.grip.soundFlags):null,opponentImpact=impact(1,opponent.car.grip.soundFlags);
 const soundEvents:RaceFrameSound[]=[...crashFrameSounds(player.effects),...(playerImpact?[{kind:'impact' as const,...playerImpact}]:[]),...crashFrameSounds([...result.effects,...back.effects]),...(opponentImpact?[{kind:'impact' as const,...opponentImpact}]:[])];
 return {player:{...player,driving:{...player.driving,particles:effects.particles}},opponent,cameras:effects.cameras,effects:[...player.effects,...result.effects,...back.effects],soundEvents};
}
