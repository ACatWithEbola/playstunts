import type {RemixedMusicPaths,RemixedMusicTiming} from './remixed-music.ts';
/** Actual Suno recordings: timing/loop edits only, never Original music. */
export const ms91SunoTiming:RemixedMusicTiming={
 titl:{cueOffset:0,introDuration:24.11046875,loopDuration:23.940375},
 slct:{cueOffset:0,introDuration:48.08084375,loopDuration:47.88071875},
 vict:{cueOffset:0,introDuration:25.9705,loopDuration:25.800375},
 over:{cueOffset:0,introDuration:30.51853125,loopDuration:30.47046875},
};
export function ms91SunoMusic(generation:string):{paths:RemixedMusicPaths;timing:RemixedMusicTiming}|undefined{
 if(generation!=='ms-1991')return;
 const root='/audio/remixed/ms91-v2/';
 return {paths:{titl:root+'titl.mp3',slct:root+'slct.mp3',vict:root+'vict.mp3',over:root+'over.wav'},timing:ms91SunoTiming};
}
