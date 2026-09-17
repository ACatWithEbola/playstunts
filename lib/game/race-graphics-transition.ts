export type RaceGraphicsTransition='original'|'hold'|'enhanced';

/** Keep the last presented frame while a requested enhanced race scene is
 * being prepared. Painting the native world during that gap exposes one
 * original-graphics frame between results and replay. */
export function raceGraphicsTransition(enabled:boolean,ready:boolean,failed:boolean):RaceGraphicsTransition{
 if(!enabled||failed)return 'original';
 return ready?'enhanced':'hold';
}
