import type {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
/** Temporary read-only support for keyboard-driven local release QA. */
export function localDrivingTelemetry(runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,location:Pick<Location,'hostname'|'search'>){
 if(!['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname)||new URLSearchParams(location.search).get('preview-audio')!=='observe')return;
 const car=runtime.session.state.player.driving.car;
 return {position:[...car.pose.position],rotation:[...car.pose.rotation],speed:car.engine.speed,steering:car.grip.steeringAngle};
}
