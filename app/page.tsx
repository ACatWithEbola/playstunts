'use client';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState} from 'react';
import {loadBrowserSetupSelection} from '@/lib/game/browser-setup-selection';
import {nativeLaunchProfile} from '@/lib/game/native-launch-profile';
import OpeningSequence from './OpeningSequence';
import NativeSetupPanel from './NativeSetupPanel';
import {useRolandDevice} from './use-roland-device';
import {RolandDevicePanel} from './RolandDevicePanel';
import StuntsBrand from './StuntsBrand';
import SaveBackupPanel from './SaveBackupPanel';
import Garage from './Garage';
import StuntsBox from './StuntsBox';
import StuntsNavigation from './StuntsNavigation';
import type {Assets} from '@/lib/game/types';
import {ENHANCED_STATIC_ARTWORK} from '@/lib/game/enhanced-static-artwork';

type SavedSetup=Awaited<ReturnType<typeof loadBrowserSetupSelection>>;
const setupKey=(saved:SavedSetup)=>JSON.stringify([saved.directory,saved.selection]);
const soundNames=['No sound','PC speaker','Tandy','AdLib','Sound Blaster','Roland MT-32'];
export default function Home(){
 const roland=useRolandDevice();
 const [running,setRunning]=useState(false);
 const [setup,setSetup]=useState<(ReturnType<typeof nativeLaunchProfile>&{directory:string;track?:number[];soundName:string})|null>(null);
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
   currentSetupKey.current=setupKey(saved);setSetup({...profile,directory:saved.directory,track:saved.track,soundName:soundNames[saved.selection.sound]});setAssets(value as Assets);
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
   <div className="stunts-masthead-brand"><h1><StuntsBrand/></h1><p className="stunts-developer-credit">BY DISTINCTIVE SOFTWARE, THE DEVELOPERS OF <span style={{whiteSpace:'nowrap'}}>TEST DRIVE™</span> &amp; <span style={{whiteSpace:'nowrap'}}>THE DUEL: TEST DRIVE II™</span></p></div>
   <div className="stunts-masthead-art" aria-hidden="true"><Image unoptimized width={790} height={309} onError={event=>{event.currentTarget.style.display="none";}} src="/site/manual-red-car.webp" alt=""/></div>
   <div className="stunts-masthead-copy"><span>WELCOME TO</span><strong>4D SPORTS<br/>DRIVING</strong><p>Choose your car. Build your track.<br/>Take it for a drive.</p></div>
  </header>
  <StuntsNavigation><a className={showroom?undefined:'nav-play'} href="#play" onClick={event=>{event.preventDefault();openHomeSection('play');}}>PLAY</a><a href="#setup" onClick={event=>{event.preventDefault();openHomeSection('setup');}}>SETUP</a><a href="#about" onClick={event=>{event.preventDefault();openHomeSection('about');}}>THE GAME</a><a className={showroom?'nav-play':undefined} href="/?view=cars" onClick={event=>{event.preventDefault();openShowroom();}}>3D CARS</a><a href="#roland" onClick={event=>{event.preventDefault();openHomeSection('roland');}}>MT-32</a><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer">MANUAL ↗</a><a href="#saves" onClick={event=>{event.preventDefault();openHomeSection('saves',true);}}>TRACKS &amp; REPLAYS</a><a href="/faq">FAQ</a><a href="https://github.com/ACatWithEbola/playstunts" target="_blank" rel="noreferrer">GITHUB ↗</a></StuntsNavigation>
  <div className="launcher-grid">
   <aside className="stunts-manual-rail" aria-label="Stunts game box and manual">
    <StuntsBox/>
    <p className="rail-statement">ELEVEN CARS.<br/>SIX OPPONENTS.<br/>YOUR OWN TRACKS.</p>
    <a className="manual-link" href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer">Read the manual <span>↗</span></a>
   </aside>
   <div className="stunts-setup-column"><section className="launcher-station stunts-setup-station" id="setup" aria-labelledby="setup-heading"><h2 id="setup-heading">GAME SETUP</h2><NativeSetupPanel onClosed={setupClosed}/><div className="launcher-settings-state"><p role="status">{settingsNotice||'Saving changed settings restarts the game automatically.'}</p></div></section><section className="launcher-station stunts-shortcuts" aria-labelledby="shortcuts-heading"><h2 id="shortcuts-heading">KEYBOARD SHORTCUTS</h2><dl><dt><kbd>↑</kbd> / <kbd>↓</kbd></dt><dd>Accelerate / brake</dd><dt><kbd>←</kbd> / <kbd>→</kbd></dt><dd>Steer left / right</dd><dt><kbd>A</kbd> / <kbd>Z</kbd></dt><dd>Shift up / down</dd><dt><kbd>Space</kbd> / <kbd>Enter</kbd></dt><dd>Alternate shift keys</dd><dt><kbd>Esc</kbd></dt><dd>Open game menu</dd><dt><kbd>C</kbd></dt><dd>Cycle camera views</dd><dt><kbd>F1</kbd> – <kbd>F4</kbd></dt><dd>Choose camera</dd><dt><kbd>T</kbd></dt><dd>Follow opponent</dd><dt><kbd>D</kbd></dt><dd>Toggle dashboard</dd><dt><kbd>F</kbd></dt><dd>Toggle FPS (Enhanced)</dd><dt><kbd>V</kbd></dt><dd>Cycle chase distance (Enhanced)</dd><dt><kbd>Ctrl</kbd> + <kbd>Arrows</kbd></dt><dd>Move replay camera</dd><dt><kbd>+</kbd> / <kbd>−</kbd></dt><dd>Zoom replay camera</dd><dt><kbd>Arrow keys</kbd></dt><dd>Choose replay control</dd><dt><kbd>Enter</kbd> / <kbd>Space</kbd></dt><dd>Activate replay control</dd><dt><kbd>Shift</kbd> + <kbd>F1</kbd></dt><dd>Open terrain editor</dd></dl></section></div>
   <section className="launcher-station stunts-play-station" id="play" aria-labelledby="game-heading"><h2 id="game-heading">{showroom?'3D CAR SHOWROOM':'PLAY STUNTS IN YOUR BROWSER'}</h2>
    {showroom?<div className="stunts-showroom-inline">{assets?<Garage assets={assets}/>:<div className="launcher-loading"><p role={error?'alert':'status'}>{error||'Loading cars…'}</p></div>}</div>:assets&&(selectedSound!=='mt32'||roland.power)?<OpeningSequence embedded autoStart={autoStart} key={session} assets={assets} soundDevice={selectedSound} rolandPower={selectedSound==='mt32'?roland.power:undefined} onRunningChange={gameRunningChanged} displayMode={setup?.displayMode} initiallyMuted={setup?.initiallyMuted} hercules={setup?.hercules} directory={setup?.directory} initialTrack={setup?.track} onBack={()=>setSession(value=>value+1)} backLabel="Restart"/>:<div className="launcher-loading launcher-game-loading stunts-game-idle"><img className="stunts-idle-art" src={ENHANCED_STATIC_ARTWORK.mainMenu} srcSet={`${ENHANCED_STATIC_ARTWORK.mainMenuMobile} 640w, ${ENHANCED_STATIC_ARTWORK.mainMenu} 1280w`} sizes="(max-width: 700px) calc(100vw - 54px), 960px" width={1280} height={960} loading="eager" fetchPriority="high" alt=""/><div className="stunts-idle-shade"/><p role={error?'alert':'status'}>{error||'Loading Stunts…'}</p>{error&&<button onClick={()=>setSession(value=>value+1)}>Retry</button>}</div>}
    <section className="launcher-roland" id="roland" aria-label="Roland MT-32 sound module"><RolandDevicePanel roland={roland}/></section>
   </section>
  </div>

  <section className="stunts-about" id="about" aria-labelledby="about-heading"><div className="about-heading"><span className="rail-kicker">THE ORIGINAL GAME · 1990</span><h2 id="about-heading">THE STORY<br/>BEHIND STUNTS.</h2><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer">Source: original manual &amp; credits ↗</a></div><div className="stunts-history"><p><strong>Stunts was created by Distinctive Software</strong>, the team behind Test Drive and The Duel: Test Drive II, and published by Brøderbund in 1990. Brad Gour, Kevin Pickell, Don Mattrick and Rob Martyn designed the game. Pickell was its lead programmer, with additional programming by Rick Friesen and Gour; Martyn produced it.</p><p>The idea was to put you in charge of both the car and the course. Choose from eleven cars, race against the clock or a computer opponent, then watch your run in replay. The built-in track editor lets you create your own courses with jumps, loops and other stunt pieces.</p><p>Its look came from Mike Smith, David Adams, Nicola Swain and Kevin Pickell, with sound by Kris Hatlelid and Michael Sokyrka.</p></div></section>
 <section className="launch-info" aria-label="About this browser edition"><p><strong>Public beta</strong> · Unofficial Stunts browser reconstruction. Not an official release from the original developers or Roland.</p><p>Best played on a computer with a keyboard. <a href="mailto:svenanders@lokaas.net?subject=PlayStunts%20bug%20report">Report a bug</a> — please include your browser, sound/display settings, and steps to reproduce it.</p><SaveBackupPanel running={running} assets={assets}/></section>
 </main>;
}
