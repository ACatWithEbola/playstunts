'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {mt32PanelMasterVolume,mt32PanelPartVolume,mt32PanelTimbre,mt32PanelChannelsOneToEight,mt32PanelReset,mt32PanelReverb,mt32PanelTune,mt32PanelTuneTenths,mt32PanelVolumeFromDial,mt32PanelVolumeStep,mt32PanelDialMoved,mt32PanelSelectionStep,mt32PanelSelectionTimbre} from '@/lib/game/mt32-panel-parameters';
export interface Device {resetGeneration?():number;resetControllers():void;unitID():number;setUnitID(value:number):void;panelWrite(writes:number[][]):void;sound(group:number,number:number):{group:string;name:string};patchName(part:number):string;read(address:number,length:number):Uint8Array;write(writes:number[][]):void;mainDisplay():void}
type Mode='master'|'part'|'group'|'sound'|'channels'|'reset'|'reverb'|'tune'|'unit';
/** Physical controls edit Roland RAM. Munt overrides intentionally remain separate. */
export function FrontControls({device,onDisplay,onCursor}:{device:Device|undefined;onDisplay:(text:string|null)=>void;onCursor:(cell:number|null)=>void}){
 const [part,setPart]=useState(0),[mode,setMode]=useState<Mode>('master'),[dial,setDial]=useState(255),[reverb,setReverb]=useState(5);
 const observedReset=useRef<number|undefined>(undefined);
 const drag=useRef<{x:number;y:number;value:number}|null>(null);
 const lastVolumeRaw=useRef(255),soundIndices=useRef(Array(8).fill(0) as number[]);
 const pickup=useRef(false),masterHeld=useRef(false),chordUsed=useRef(false);
 useEffect(()=>{
  // Only release globally: key presses belong to the focused physical panel.
  const up=(event:KeyboardEvent)=>{if(event.key.toLowerCase()==='m')masterHeld.current=false;};const blur=()=>{masterHeld.current=false;};
  window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  return()=>{window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
 },[]);
 useEffect(()=>{observedReset.current=device?.resetGeneration?.();setMode('master');setPart(0);setReverb(5);soundIndices.current.fill(0);pickup.current=false;masterHeld.current=false;onDisplay(null);onCursor(null);},[device,onDisplay,onCursor]);
 const catalog=useMemo(()=>device?Array.from({length:128},(_,i)=>({...device.sound(i>>6,i&63),bank:i>>6,number:i&63})):[],[device]);
 const families=useMemo(()=>[...new Set(catalog.map(sound=>sound.group))],[catalog]);
 const patch=()=>device?.read(3*16384+part*16,2)??new Uint8Array(2);
 const current=(nextMode=mode,nextPart=part)=>device?.read(nextMode==='master'?0x10*16384+22:3*16384+nextPart*16+8,1)[0]??100;
 const show=(nextMode:Mode,nextPart:number,value:number)=>{
  onCursor(nextMode==='part'?16:nextMode==='group'?1:nextMode==='sound'?9:null);
  if(nextMode==='unit'){onDisplay('** Unit number  :'.padEnd(17)+String((device?.unitID()??16)+1).padStart(3));return;}
  if(nextMode==='tune'){const value=device?.read(0x10*16384,1)[0]??74;onDisplay('Master Tune :'+(mt32PanelTuneTenths[value]/10).toFixed(1)+'Hz');return;}
  if(nextMode==='reverb'){onDisplay('** Reverb mode  :'.padEnd(17)+String(reverb).padStart(3));return;}
  if(nextMode==='reset'){onDisplay('** All Reset OK? [1]');return;}
  if(nextMode==='channels'){onDisplay('Channel 1 to 8 ? [1]');return;}
  if(nextMode==='master'){device?.mainDisplay();onDisplay(null);return;}
  if(nextMode==='group'||nextMode==='sound'){
   const bytes=device?.read(3*16384+nextPart*16,2)??new Uint8Array(2),sound=device?.sound(bytes[0],bytes[1]);
   onDisplay(String(nextPart+1)+(nextMode==='group'?'>':'|')+(sound?.group??'').padEnd(7).slice(0,7)+(nextMode==='sound'?'>':'|')+(device?.patchName(nextPart)??'').padEnd(10));return;
  }
  onDisplay((nextPart===8?'Rhythm Part ':String(nextPart+1)+'|'+(device?.patchName(nextPart)??'').padEnd(10).slice(0,10))+'|vol>'+String(value).padStart(3));
 };
 useEffect(()=>{if(!device)return;const timer=setInterval(()=>{const next=device.resetGeneration?.();if(next!==observedReset.current){observedReset.current=next;setReverb(5);}if(mode!=='master')show(mode,part,current());},100);return()=>clearInterval(timer);},[device,mode,part,reverb]);
 const select=(nextMode:Mode,nextPart=part)=>{if(nextMode==='reset'||nextMode==='channels')device?.resetControllers();setMode(nextMode);setPart(nextPart);pickup.current=mt32PanelVolumeFromDial(dial)<=current(nextMode,nextPart)+2;lastVolumeRaw.current=dial;show(nextMode,nextPart,current(nextMode,nextPart));};
 const pressPart=(index:number)=>{
  if(mode==='reset'&&!masterHeld.current){
   if(device&&index===0){const volume=device.read(0x10*16384+22,1)[0];device.panelWrite([...mt32PanelReset(),...mt32PanelMasterVolume(volume)]);setReverb(5);}select('master');return;
  }
  if(mode==='channels'&&!masterHeld.current){if(device&&index===0){const volume=device.read(0x10*16384+22,1)[0];device.panelWrite([...mt32PanelReset(),...mt32PanelMasterVolume(volume),...mt32PanelChannelsOneToEight()]);setReverb(5);}select('master');return;}
  if(masterHeld.current){chordUsed.current=true;if(index===8){select('reset');return;}if(index===4){select('channels');return;}if(index<3){select('part',index+5);return;}return;}
  select('part',index);
 };
 const turn=(next:number)=>{
  if(mode==='channels'||mode==='reset')return;
  if(mode==='unit'||mode==='tune'||mode==='reverb'){setDial(next);if(!mt32PanelDialMoved(lastVolumeRaw.current,next))return;lastVolumeRaw.current=next;}
  if(mode==='unit'){setDial(next);device?.setUnitID(Math.floor(next/8));return;}
  if(mode==='tune'){setDial(next);device?.panelWrite(mt32PanelTune(next>>1));return;}
  if(mode==='reverb'){const index=Math.min(10,Math.floor(next/25));setDial(next);setReverb(index);device?.panelWrite(mt32PanelReverb(index));return;}
  if(mode==='group'||mode==='sound'){
   const bytes=patch(),family=device?.sound(bytes[0],bytes[1]).group,group=bytes[0]>=2?bytes[0]+15:families.indexOf(family??'');
   setDial(next);
   if(group>=0){
    const result=mt32PanelSelectionStep(mode,lastVolumeRaw.current,next,group,soundIndices.current[part]);
    lastVolumeRaw.current=result.lastRaw;soundIndices.current[part]=result.sound;
    if(result.write){const chosen=mt32PanelSelectionTimbre(result.group,result.sound);device?.panelWrite(mt32PanelTimbre(part,chosen.bank,chosen.number));}
   }
   return;
  }
  const result=mt32PanelVolumeStep(lastVolumeRaw.current,next,current(),pickup.current);pickup.current=result.engaged;lastVolumeRaw.current=result.lastRaw;setDial(next);
  if(result.write)device?.panelWrite(mode==='master'?mt32PanelMasterVolume(result.value):mt32PanelPartVolume(part,result.value));show(mode,part,result.value);
 };
 return <fieldset className="mt32-front-controls" disabled={!device} onKeyDown={event=>{if(event.key.toLowerCase()==='m'){masterHeld.current=true;event.preventDefault();}else if(/^[1-5]$/.test(event.key)&&masterHeld.current){pressPart(Number(event.key)-1);event.preventDefault();}}} onKeyUp={event=>{if(event.key.toLowerCase()==='m')masterHeld.current=false;}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))masterHeld.current=false;}}><legend>PART</legend><div className="mt32-part-buttons">{[0,1,2,3,4,8].map(index=><div className="mt32-part-key" key={index}><button aria-label={index===8?'Rhythm':'Part '+(index+1)} aria-pressed={mode!=='master'&&part===index} onClick={()=>pressPart(index)}/><span>{index===8?'RHYTHM':index+1}</span></div>)}</div><div className="mt32-function-buttons"><div className="mt32-function-key"><span>SOUND GROUP</span><button aria-label="Sound Group" onClick={()=>{if(masterHeld.current){chordUsed.current=true;select('tune');}else if(part!==8)select('group');}}/></div><div className="mt32-function-key"><span>VOLUME</span><button aria-label="Volume" onClick={()=>{if(masterHeld.current){chordUsed.current=true;select('reverb');}else select('part');}}/></div><div className="mt32-function-key"><span>SOUND</span><button aria-label="Sound" onClick={()=>{if(masterHeld.current){chordUsed.current=true;select('unit');}else if(part!==8)select('sound');}}/></div><div className="mt32-function-key"><span>MASTER VOLUME</span><button aria-label="Master Volume" onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);masterHeld.current=true;chordUsed.current=false;}} onPointerUp={()=>{masterHeld.current=false;}} onPointerCancel={()=>{masterHeld.current=false;}} onLostPointerCapture={()=>{masterHeld.current=false;}} onClick={()=>{masterHeld.current=false;if(!chordUsed.current)select('master');chordUsed.current=false;}}/></div></div><label className="mt32-select-dial">SELECT / VOLUME<input aria-label="Select / Volume dial" type="range" min="0" max="255" value={dial} onChange={event=>turn(Number(event.target.value))} onPointerDown={event=>{event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,value:dial};}} onPointerMove={event=>{const start=drag.current;if(start)turn(Math.max(0,Math.min(255,Math.round(start.value+(event.clientX-start.x+start.y-event.clientY)/2))));}} onPointerUp={event=>{drag.current=null;event.currentTarget.releasePointerCapture(event.pointerId);}} onPointerCancel={()=>{drag.current=null;}}/><span className="mt32-knob" aria-hidden="true" style={{transform:`rotate(${dial*270/255-135}deg)`}}/></label></fieldset>;
}
