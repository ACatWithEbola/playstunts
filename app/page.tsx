'use client';
import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';
import Image from 'next/image';
import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {loadBrowserSetupSelection} from '@/lib/game/browser-setup-selection';
import {nativeLaunchProfile} from '@/lib/game/native-launch-profile';
import OpeningSequence from './OpeningSequence';
import NativeSetupPanel from './NativeSetupPanel';
import {useRolandDevice} from './use-roland-device';
import {RolandDevicePanel} from './RolandDevicePanel';
import StuntsBrand from './StuntsBrand';
import SaveBackupPanel from './SaveBackupPanel';
import SharedTracksPanel from './SharedTracksPanel';
import GlobalScoreStatus from './GlobalScoreStatus';
import SharedReplaysPanel from './SharedReplaysPanel';
import RecentRacesPanel from './RecentRacesPanel';
import StuntsBox from './StuntsBox';
import StuntsNavigation from './StuntsNavigation';
import type {Assets} from '@/lib/game/types';
import {MT32_INSTALLATION_GUIDE} from '@/lib/game/browser-mt32-installation';

const Garage=lazy(()=>import('./Garage'));

type SavedSetup=Awaited<ReturnType<typeof loadBrowserSetupSelection>>;
const setupKey=(saved:SavedSetup)=>JSON.stringify([saved.directory,saved.configuredSelection]);
const soundNames=['No sound','PC speaker','Tandy','AdLib','Sound Blaster','Roland MT-32'];
export default function Home(){
 const roland=useRolandDevice();
 const [running,setRunning]=useState(false);
 const [setup,setSetup]=useState<(ReturnType<typeof nativeLaunchProfile>&{directory:string;track?:number[];soundName:string;mt32Fallback:boolean})|null>(null);
 const [assets,setAssets]=useState<Assets|null>(null),[error,setError]=useState(''),[session,setSession]=useState(0);
 const [settingsNotice,setSettingsNotice]=useState(''),[autoStart,setAutoStart]=useState(false);
 const [showroom,setShowroom]=useState(false);
 const currentSetupKey=useRef(''),settingsRead=useRef<AbortController|null>(null),gameRunning=useRef(false);
 const setRolandGameRunning=roland.setGameRunning;
 const gameRunningChanged=useCallback((running:boolean)=>{gameRunning.current=running;setRunning(running);setRolandGameRunning(running&&setup?.soundDevice==='mt32');},[setRolandGameRunning,setup?.soundDevice]);
 useEffect(()=>()=>settingsRead.current?.abort(),[]);
 useEffect(()=>{
  const sync=()=>setShowroom(new URL(window.location.href).searchParams.get('view')==='cars');
  sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);
 },[]);
 useEffect(()=>{
  const url=new URL(window.location.href);if(url.searchParams.has('sound')){url.searchParams.delete('sound');window.history.replaceState(window.history.state,'',url);}
  setAssets(null);setError('');setSettingsNotice('');settingsRead.current?.abort();
  const controller=new AbortController();
  fetch('/game/assets.json',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('The game files could not load. Please reload the page.');return response.json();}).then(async value=>{
   const saved=await loadBrowserSetupSelection(controller.signal),profile=nativeLaunchProfile(saved.selection);if(controller.signal.aborted)return;
   currentSetupKey.current=setupKey(saved);setSetup({...profile,directory:saved.directory,track:saved.track,soundName:soundNames[saved.selection.sound],mt32Fallback:saved.mt32Fallback});setAssets(value as Assets);
  }).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:String(reason));});
  return()=>controller.abort();
 },[session]);
 const setupClosed=useCallback(async()=>{
  settingsRead.current?.abort();const controller=new AbortController();settingsRead.current=controller;
  try{
   const saved=await loadBrowserSetupSelection(controller.signal);if(controller.signal.aborted)return;
   const changed=currentSetupKey.current!==setupKey(saved);
   if(changed){setAutoStart(gameRunning.current);setSession(value=>value+1);return;}
   setSettingsNotice('Saved settings are unchanged.');
  }catch(reason){if(!controller.signal.aborted)setSettingsNotice(reason instanceof Error?reason.message:String(reason));}
 },[]);
 const openShowroom=useCallback(()=>{
  const url=new URL(window.location.href);url.searchParams.set('view','cars');url.hash='play';window.history.pushState(window.history.state,'',url);setShowroom(true);
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById('play')?.scrollIntoView({behavior:'smooth'})));
 },[]);
 const openHomeSection=useCallback((id:string,openDetails=false)=>{
  const url=new URL(window.location.href);url.searchParams.delete('view');url.hash=id;window.history.pushState(window.history.state,'',url);setShowroom(false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const section=document.getElementById(id);if(openDetails&&section instanceof HTMLDetailsElement)section.open=true;section?.scrollIntoView({behavior:'smooth'});}));
 },[]);
 const selectedSound=setup?.soundDevice;
 return <main className="game-shell stunts-launcher stunts-universe" id="top">
  <header className="stunts-masthead">
   <div className="stunts-masthead-brand"><h1><WebsiteElement as="a" href="/" aria-label="Play Stunts home"><StuntsBrand/></WebsiteElement></h1><p className="stunts-developer-credit"><WebsiteText text={"BY DISTINCTIVE SOFTWARE, THE DEVELOPERS OF "}/><span style={{whiteSpace:'nowrap'}}><WebsiteText text={"TEST DRIVE™"}/></span> &amp; <span style={{whiteSpace:'nowrap'}}><WebsiteText text={"THE DUEL: TEST DRIVE II™"}/></span></p></div>
   <div className="stunts-masthead-art" aria-hidden="true"><Image unoptimized width={790} height={309} onError={event=>{event.currentTarget.style.display="none";}} src="/site/manual-red-car.webp" alt=""/></div>
   <div className="stunts-masthead-copy"><span><WebsiteText text={"WELCOME TO"}/></span><strong><WebsiteText text={"4D SPORTS"}/><br/><WebsiteText text={"DRIVING"}/></strong><p><WebsiteText text={"Choose your car. Build your track."}/><br/><WebsiteText text={"Take it for a drive."}/></p></div>
  </header>
  <StuntsNavigation><a className={showroom?undefined:'nav-play'} href="#play" onClick={event=>{event.preventDefault();openHomeSection('play');}}><WebsiteText text={"PLAY"}/></a><a href="#setup" onClick={event=>{event.preventDefault();openHomeSection('setup');}}><WebsiteText text={"SETUP"}/></a><a href="#about" onClick={event=>{event.preventDefault();openHomeSection('about');}}><WebsiteText text={"THE GAME"}/></a><a className={showroom?'nav-play':undefined} href="/?view=cars" onClick={event=>{event.preventDefault();openShowroom();}}><WebsiteText text={"3D CARS"}/></a><a href="/high-scores"><WebsiteText text={"HIGH SCORES"}/></a><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer"><WebsiteText text={"MANUAL"}/></a><a href="#saves" onClick={event=>{event.preventDefault();openHomeSection('saves',true);}}><WebsiteText text={"TRACKS & REPLAYS"}/></a><a href="/faq"><WebsiteText text={"FAQ"}/></a><a href="https://github.com/ACatWithEbola/playstunts" target="_blank" rel="noreferrer"><WebsiteText text={"GITHUB"}/></a></StuntsNavigation>
  <div className="launcher-grid">
   <WebsiteElement as="aside" className="stunts-manual-rail" aria-label="Stunts game box and manual">
    <StuntsBox/>
    <p className="rail-statement"><WebsiteText text={"ELEVEN CARS."}/><br/><WebsiteText text={"SIX OPPONENTS."}/><br/><WebsiteText text={"YOUR OWN TRACKS."}/></p>
    <a className="manual-link" href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer"><WebsiteText text={"Read the manual "}/><span>↗</span></a>
    <RecentRacesPanel/>
   </WebsiteElement>
   <div className="stunts-setup-column"><section className="launcher-station stunts-setup-station" id="setup" aria-labelledby="setup-heading"><h2 id="setup-heading"><WebsiteText text={"GAME SETUP"}/></h2><NativeSetupPanel onClosed={setupClosed}/><div className="launcher-settings-state"><p role="status">{settingsNotice||<WebsiteText text={'Saving changed settings restarts the game automatically.'}/>}</p></div></section><section className="launcher-station stunts-shortcuts" aria-labelledby="shortcuts-heading"><h2 id="shortcuts-heading"><WebsiteText text={"KEYBOARD SHORTCUTS"}/></h2><dl><dt><kbd>↑</kbd> / <kbd>↓</kbd></dt><dd><WebsiteText text={"Accelerate / brake"}/></dd><dt><kbd>←</kbd> / <kbd>→</kbd></dt><dd><WebsiteText text={"Steer left / right"}/></dd><dt><kbd>A</kbd> / <kbd>Z</kbd></dt><dd><WebsiteText text={"Shift up / down"}/></dd><dt><kbd><WebsiteText text={"Space"}/></kbd> / <kbd><WebsiteText text={"Enter"}/></kbd></dt><dd><WebsiteText text={"Alternate shift keys"}/></dd><dt><kbd><WebsiteText text={"Esc"}/></kbd></dt><dd><WebsiteText text={"Open game menu"}/></dd><dt><kbd>C</kbd></dt><dd><WebsiteText text={"Cycle camera views"}/></dd><dt><kbd>F1</kbd> – <kbd>F4</kbd></dt><dd><WebsiteText text={"Choose camera"}/></dd><dt><kbd>T</kbd></dt><dd><WebsiteText text={"Follow opponent"}/></dd><dt><kbd>D</kbd></dt><dd><WebsiteText text={"Toggle dashboard"}/></dd><dt><kbd><WebsiteText text={"Ctrl"}/></kbd> + <kbd>F</kbd></dt><dd><WebsiteText text={"Toggle FPS (Enhanced)"}/></dd><dt><kbd>V</kbd></dt><dd><WebsiteText text={"Cycle chase distance (Enhanced)"}/></dd><dt><kbd><WebsiteText text={"Ctrl"}/></kbd> + <kbd><WebsiteText text={"Arrows"}/></kbd></dt><dd><WebsiteText text={"Move replay camera"}/></dd><dt><kbd>+</kbd> / <kbd>−</kbd></dt><dd><WebsiteText text={"Zoom replay camera"}/></dd><dt><kbd><WebsiteText text={"Arrow keys"}/></kbd></dt><dd><WebsiteText text={"Choose replay control"}/></dd><dt><kbd><WebsiteText text={"Enter"}/></kbd> / <kbd><WebsiteText text={"Space"}/></kbd></dt><dd><WebsiteText text={"Activate replay control"}/></dd><dt><kbd><WebsiteText text={"Shift"}/></kbd> + <kbd>F1</kbd></dt><dd><WebsiteText text={"Open terrain editor"}/></dd></dl></section></div>
   <section className="launcher-station stunts-play-station" id="play" aria-labelledby="game-heading"><h2 id="game-heading">{showroom?<WebsiteText text={'3D CAR SHOWROOM'}/>:<WebsiteText text={'PLAY STUNTS IN YOUR BROWSER'}/>}</h2>
    {!showroom&&setup?.mt32Fallback&&<aside className="mt32-fallback-panel" role="alert"><strong><WebsiteText text={"Roland MT-32 is not available"}/></strong><p><WebsiteText text={"Compatible MT-32 ROMs were not found or did not pass validation. Original sound and music will use Sound Blaster instead."}/></p><a href={MT32_INSTALLATION_GUIDE} target="_blank" rel="noreferrer"><WebsiteText text={"How to install Roland MT-32 correctly on GitHub ↗"}/></a></aside>}
    {showroom?<div className="stunts-showroom-inline">{assets?<Suspense fallback={<div className="launcher-loading"><p role="status"><WebsiteText text={"Loading cars…"}/></p></div>}><Garage assets={assets}/></Suspense>:<div className="launcher-loading"><p role={error?'alert':'status'}>{error||<WebsiteText text={'Loading cars…'}/>}</p></div>}</div>:<><OpeningSequence embedded autoStart={autoStart} key={session} assets={assets} ready={!!assets&&!!setup&&(selectedSound!=='mt32'||!!roland.power)} soundDevice={selectedSound} rolandPower={selectedSound==='mt32'?roland.power:undefined} onRunningChange={gameRunningChanged} displayMode={setup?.displayMode} initiallyMuted={setup?.initiallyMuted} hercules={setup?.hercules} directory={setup?.directory} initialTrack={setup?.track} onBack={()=>setSession(value=>value+1)} backLabel="Restart"/>{error&&<p role="alert">{<WebsiteText text={error}/>}</p>}</>}
    <GlobalScoreStatus key={session}/>
    <WebsiteElement as="section" className="launcher-roland" id="roland" aria-label="Roland MT-32 sound module"><RolandDevicePanel roland={roland}/></WebsiteElement>
   </section>
  </div>

  <section className="stunts-about" id="about" aria-labelledby="about-heading"><div className="about-heading"><span className="rail-kicker"><WebsiteText text={"THE ORIGINAL GAME · 1990"}/></span><h2 id="about-heading"><WebsiteText text={"THE STORY"}/><br/><WebsiteText text={"BEHIND STUNTS."}/></h2><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer"><WebsiteText text={"Source: original manual & credits ↗"}/></a></div><div className="stunts-history"><p><strong><WebsiteText text={"Stunts was created by Distinctive Software"}/></strong><WebsiteText text={", the team behind Test Drive and The Duel: Test Drive II, and published by Brøderbund in 1990. Brad Gour, Kevin Pickell, Don Mattrick and Rob Martyn designed the game. Pickell was its lead programmer, with additional programming by Rick Friesen and Gour; Martyn produced it."}/></p><p><WebsiteText text={"The idea was to put you in charge of both the car and the course. Choose from eleven cars, race against the clock or a computer opponent, then watch your run in replay. The built-in track editor lets you create your own courses with jumps, loops and other stunt pieces."}/></p><p><WebsiteText text={"Its look came from Mike Smith, David Adams, Nicola Swain and Kevin Pickell, with sound by Kris Hatlelid and Michael Sokyrka."}/></p></div></section>
 <WebsiteElement as="section" className="launch-info" aria-label="About this browser edition"><p className="graphics-performance-notice"><strong><WebsiteText text={"IMPORTANT:"}/></strong><WebsiteText text={" When playing in updated graphics mode, please make sure to enable hardware acceleration first for best performance."}/></p><p><strong><WebsiteText text={"Public beta"}/></strong><WebsiteText text={" · Unofficial Stunts browser reconstruction. Not an official release from the original developers or Roland."}/></p><p><WebsiteText text={"Best played on a computer with a keyboard. "}/><a href="mailto:svenanders@lokaas.net?subject=PlayStunts%20bug%20report"><WebsiteText text={"Report a bug"}/></a><WebsiteText text={" — please include your browser, sound/display settings, and steps to reproduce it."}/></p><SaveBackupPanel running={running} assets={assets}/></WebsiteElement>
 <SharedTracksPanel running={running}/>
 <SharedReplaysPanel running={running}/>
 <p className="global-score-note"><WebsiteText text={"Website high scores are separate from your private in-game table. Completed runs are checked against their recorded inputs; using “Continue driving” from a replay makes a run ineligible. Consented offline submissions wait in this browser until they can be uploaded."}/></p>
 </main>;
}
