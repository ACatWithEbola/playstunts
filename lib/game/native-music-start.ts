import type {NativeMusicScore} from './native-music-score.ts';
/** Await explicitly asynchronous players; keep immediate players supported.
 * The caller owns cancellation and must not enter the next screen afterward. */
export async function startNativeMusic(player:{play(name:NativeMusicScore):void;playAsync?(name:NativeMusicScore):Promise<void>},name:NativeMusicScore,cancelled:()=>boolean=()=>false){
 const check=()=>{if(cancelled())throw new DOMException('Music transition cancelled','AbortError');};
 check();if(player.playAsync)await player.playAsync(name);else player.play(name);check();
}
