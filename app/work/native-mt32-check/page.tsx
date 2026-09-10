'use client';
import {useEffect,useRef,useState} from 'react';
import {createControlledOriginalMt32Music} from '@/lib/game/controlled-mt32-music';
import {uploadOriginalMt32Patches} from '@/lib/game/mt32-system-exclusive';
import {createBrowserMt32RaceAudio} from '@/lib/game/browser-mt32-race-audio';
import './panel.css';
import {Mt32Panel} from './panel';
import {settleMt32Startup} from '@/lib/game/mt32-startup-settle';
import {loadBrowserMt32Output} from '@/lib/game/browser-mt32-output';
export default function RolandCheck(){
 const [status,setStatus]=useState('Powering on…'),[playing,setPlaying]=useState(false),[powered,setPowered]=useState(true);
 const [settings,setSettings]=useState<number[]>([]),[volume,setVolume]=useState(100),[lcd,setLcd]=useState(''),[midiLight,setMidiLight]=useState(false);
 const volumeValue=useRef(100),lastScore=useRef('titl'),generation=useRef(0),songGeneration=useRef(0);
 const device=useRef<Awaited<ReturnType<typeof loadBrowserMt32Output>>|undefined>(undefined);
 const contextRef=useRef<AudioContext|undefined>(undefined);
 const preparation=useRef<Promise<void>|undefined>(undefined);
 const runtime=useRef<ReturnType<typeof createControlledOriginalMt32Music>|undefined>(undefined);
 const audioRef=useRef<ReturnType<typeof createBrowserMt32RaceAudio>|undefined>(undefined);
 const cleanup=useRef<()=>void>(()=>{});
 const volumeControl=useRef<(value:number)=>void>(()=>{});
 const changeSetting=(id:number,value:number)=>{device.current?.set(id,value);if(device.current)setSettings(device.current.settings());};
 const stop=()=>{songGeneration.current++;runtime.current=undefined;device.current?.write(Array.from({length:16},(_,ch)=>[[0x330,0xb0+ch],[0x330,123],[0x330,0]]).flat());setPlaying(false);setStatus('Powered on · Ready');};
 const powerOff=()=>{generation.current++;songGeneration.current++;cleanup.current();cleanup.current=()=>{};preparation.current=undefined;device.current=undefined;runtime.current=undefined;audioRef.current=undefined;contextRef.current=undefined;volumeControl.current=()=>{};setPowered(false);setSettings([]);setPlaying(false);setLcd('');setMidiLight(false);setStatus('Powered off');};
 async function powerOn(){
  powerOff();const run=generation.current;setPowered(true);setStatus('Powering on…');
  const controller=new AbortController();let output:Awaited<ReturnType<typeof loadBrowserMt32Output>>|undefined,timer:ReturnType<typeof setInterval>|undefined,closed=false;
  const dispose=()=>{if(closed)return;closed=true;controller.abort();clearInterval(timer);audioRef.current?.close();const context=contextRef.current;if(context&&context.state!=='closed')void context.close().catch(()=>{});output?.close();};cleanup.current=dispose;
  try{
   output=await loadBrowserMt32Output(controller.signal);if(run!==generation.current){output.close();return;}device.current=output;setSettings(output.settings());setStatus('Powered on · Ready');
   const refresh=()=>{if(run!==generation.current||!output)return;try{if(audioRef.current&&contextRef.current?.state==='running')audioRef.current.pump();else if(!audioRef.current){output.render(400);output.render(400);}const display=output.display();setLcd(display.text);setMidiLight(display.midi);}catch(error){powerOff();setStatus(String(error));}};
   // Advance the silent device clock as well, so its startup LCD can complete.
   const display=output.display();setLcd(display.text);timer=setInterval(refresh,25);
  }catch(error){if(run===generation.current){powerOff();setStatus(String(error));}}
 }
 useEffect(()=>{void powerOn();return()=>{generation.current++;songGeneration.current++;cleanup.current();};},[]);
 async function play(name:string){
  const output=device.current;if(!output)return;lastScore.current=name;stop();const song=++songGeneration.current,run=generation.current;setStatus('Loading music…');
  try{
   let context=contextRef.current;if(!context){context=new AudioContext();contextRef.current=context;}await context.resume();
   const data=await Promise.all(['original-resources/MT32.PLB','mt32-music-'+name+'-seed.json'].map(async path=>{const response=await fetch('/game/'+path);if(!response.ok)throw Error('Could not load '+path);return response.arrayBuffer();}));
   if(run!==generation.current||song!==songGeneration.current)return;
   const seed=JSON.parse(new TextDecoder().decode(data[1])),patch=new Uint8Array(data[0]);
   if(!preparation.current)preparation.current=(async()=>{
   const upload=uploadOriginalMt32Patches(Uint8Array.from(seed.driver),(_,at)=>patch[at],0,0);let step=upload.next();const writes:number[][]=[];while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=upload.next(0);}output.write(writes);
   await settleMt32Startup(output,()=>run!==generation.current);
   })();
   await preparation.current;
   if(run!==generation.current||song!==songGeneration.current)return;
   runtime.current=createControlledOriginalMt32Music(seed);
   if(!audioRef.current){audioRef.current=createBrowserMt32RaceAudio(context,output,seed.initialWrites,()=>runtime.current?.tick().writes??[]);volumeControl.current=audioRef.current.setVolume;audioRef.current.setVolume(volumeValue.current/100);}else audioRef.current.write(seed.initialWrites);
   setPlaying(true);setStatus('Playing '+({titl:'title music',slct:'menu music',vict:'victory music',over:'game-over music'}[name]??name)+' · Roland MT-32');
  }catch(error){if(run===generation.current&&song===songGeneration.current){stop();setStatus(String(error));}}
 }
 return <main className="game-shell"><a href="/">← Back to game</a><h1>Roland MT-32 sound check</h1><p>Original Stunts music and instruments, played through the reconstructed sound driver and Munt.</p><Mt32Panel key={generation.current} device={device.current} lcd={lcd} midiLight={midiLight} powered={powered}/><div className="mt32-controls mt32-external-controls"><label className="mt32-volume">PLAYBACK VOLUME<input aria-label="Playback volume" type="range" min="0" max="100" value={volume} onChange={event=>{const value=Number(event.target.value);volumeValue.current=value;setVolume(value);volumeControl.current(value/100);}}/><output>{volume}%</output></label><div className="mt32-power"><i className={powered?'lit':''}/><button className="mt32-power-switch" aria-label={powered?'Power off':'Power on'} aria-pressed={powered} onClick={()=>powered?powerOff():void powerOn()}>{powered?'ON':'OFF'}</button><span>POWER</span></div></div><div className="mt32-score-buttons">{[['titl','Title'],['slct','Menu'],['vict','Victory'],['over','Game over']].map(([name,label])=><button key={name} disabled={!powered||!settings.length} onClick={()=>void play(name)}>{label}</button>)}<button onClick={()=>{stop();}} disabled={!playing}>Stop</button></div><p role="status">{status}</p><details className="mt32-settings"><summary>Using the front panel</summary><p>Drag the dial horizontally or vertically. You can also focus it and use the arrow keys. Small movements may not change the volume immediately, as on the original device.</p><p>For two-button functions, first focus a panel button, then hold the M key while clicking the second button. M represents holding MASTER VOLUME.</p><ul><li>M + PART 1, 2 or 3: select parts 6, 7 or 8.</li><li>M + VOLUME: reverb.</li><li>M + SOUND GROUP: master tuning.</li><li>M + SOUND: unit number. The default is 17; changing it can prevent game settings from reaching the device.</li><li>M + PART 5, release M, then PART 1: reset the device and receive on channels 1–8, with rhythm still on 10.</li><li>M + RHYTHM, release M, then PART 1: reset. PART 2–5 cancel the full reset. Entering either confirmation releases notes and resets MIDI controllers.</li></ul><p>The original overflow-to-another-device function is not implemented yet.</p></details><details className="mt32-settings"><summary>Munt settings</summary><p>Settings stay active while powered on. Power cycling restores the device defaults.</p><fieldset disabled={!powered||!settings.length}><div className="mt32-setting-grid">{[[0,'Reverb enabled'],[1,'Reverse stereo'],[6,'Original MT-32 reverb circuit']].map(([id,label])=><label key={id}><input type="checkbox" checked={!!settings[Number(id)]} onChange={e=>changeSetting(Number(id),Number(e.target.checked))}/>{label}</label>)}{[[2,'Synth output gain'],[3,'Reverb output gain']].map(([id,label])=><label key={id}>{label}<input type="range" min="0" max="2" step="0.05" value={settings[Number(id)]??1} onChange={e=>changeSetting(Number(id),Number(e.target.value))}/><output>{(settings[Number(id)]??1).toFixed(2)}</output></label>)}<label>DAC mode<select value={settings[4]??0} onChange={e=>changeSetting(4,Number(e.target.value))}>{['Nice','Pure digital','First generation','Second generation'].map((name,i)=><option value={i} key={name}>{name}</option>)}</select></label><label>MIDI transfer delay<select value={settings[5]??0} onChange={e=>changeSetting(5,Number(e.target.value))}>{['Immediate','Short messages only','All messages'].map((name,i)=><option value={i} key={name}>{name}</option>)}</select></label>{Array.from({length:10},(_,i)=>{const id=i+7,value=settings[id]??255;return <label key={id}>{i===0?'Master volume':i===9?'Rhythm volume':'Part '+i+' volume'}<select value={value>100?255:0} onChange={e=>changeSetting(id,Number(e.target.value)===255?255:100)}><option value={255}>Follow game</option><option value={0}>Override</option></select><input aria-label={(i===0?'Master':i===9?'Rhythm':'Part '+i)+' volume override'} type="range" min="0" max="100" disabled={value>100} value={value>100?100:value} onChange={e=>changeSetting(id,Number(e.target.value))}/><output>{value>100?'Game controlled':value+'%'}</output></label>;})}</div><button onClick={()=>{setVolume(100);volumeValue.current=100;void powerOn();}}>Restore device defaults</button></fieldset></details><p><a href="/work/native-mt32-game-check">Try Roland in Stunts →</a></p><p>The main Setup connection is still being verified.</p><a href="/work/native-display-check">Try the display modes →</a><p><a href="/game/mt32-local/COPYING.LESSER.txt">Munt license</a> · <a href="/game/mt32-local/synth-source.tar.gz">Synthesizer source</a></p></main>;
}
