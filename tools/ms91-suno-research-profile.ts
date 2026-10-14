import type {RemixedMusicPaths,RemixedMusicTiming} from '../lib/game/remixed-music.ts';
import {ms91SunoTiming} from '../lib/game/ms91-suno-music.ts';
/** Actual Suno recordings with timing/loop edits only. Local QA, never default.
 * Do not route harmonic reconstructions or separated/resynthesized layers here.
 * Original exports remain unchanged; this profile still needs full playback QA. */
export function browserMs91SunoScorePreview(generation:string,location:Pick<Location,'hostname'|'search'>|undefined=typeof window==='undefined'?undefined:window.location):{paths:RemixedMusicPaths;timing:RemixedMusicTiming}|undefined{
 if(generation!=='ms-1991'||!location||!['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname))return;
 const values=new URLSearchParams(location.search).getAll('preview-suno-score');if(values.length!==1||values[0]!=='1')return;
 const root='http://127.0.0.1:5192/files/';
 return {
  paths:{titl:root+'ms91-suno-title-loop-20261014-44/loop-seam-trial.wav',slct:root+'ms91-remix-reproducible-20261013-19/slct-three-cycle.wav',vict:root+'ms91-remix-reproducible-20261013-19/vict-three-cycle.wav',over:root+'ms91-remix-reproducible-20261013-19/over-three-cycle.wav'},
  timing:ms91SunoTiming
 };
}
