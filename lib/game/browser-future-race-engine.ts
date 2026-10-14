import {selectFutureRaceEngine} from './future-race-engine.ts';
import type {Ms91GraphicsSettings} from './ms91-graphics-options.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Local QA override only. Never use this to choose a saved recording's engine. */
export function selectBrowserFutureRaceEngine(location:Pick<Location,'hostname'|'search'>|undefined=typeof window==='undefined'?undefined:window.location){
 // Explicit player launch choice is separate from local QA. Recorded replay
 // identity is resolved by its loader and must never use this setting.
 if(location){const chosen=new URLSearchParams(location.search).get('play-engine');if(chosen!==null)return selectFutureRaceEngine(chosen);}
 if(location&&['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname)){
  const value=new URLSearchParams(location.search).get('preview-engine');
  if(value!==null)return selectFutureRaceEngine(value);
 }
 return selectFutureRaceEngine();
}
/** Engine capabilities follow the future engine, not a deployment hostname.
 * Public behavior stays legacy until the separately gated default switch. */
export function graphicsSettingsForFutureEngine(engine:PhysicsEngineVersion):Ms91GraphicsSettings|undefined{
 return engine==='ms-1991'?{graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20}:undefined;
}
/** Retain modern capabilities independently of the launch engine. Imported
 * recordings keep their own physics/rate; this only owns menu preferences. */
export function createBrowserMenuGraphicsSettings(supplied?:Ms91GraphicsSettings){
 const retained=supplied??graphicsSettingsForFutureEngine('ms-1991')!;
 return (engine:PhysicsEngineVersion)=>engine==='ms-1991'?retained:undefined;
}
/** Retained export name for callers; now also supports the eventual MS91 default.
 * A public preview query never overrides the configured release engine. */
export function browserPreviewGraphicsSettings(location:Pick<Location,'hostname'|'search'>|undefined=typeof window==='undefined'?undefined:window.location):Ms91GraphicsSettings|undefined{
 return graphicsSettingsForFutureEngine(selectBrowserFutureRaceEngine(location));
}
