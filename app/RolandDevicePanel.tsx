'use client';
import {useEffect,useState} from 'react';
import {Mt32Panel} from './work/native-mt32-check/panel';
import type {useRolandDevice} from './use-roland-device';
import {mt32PanelTune,mt32PanelTuneTenths} from '@/lib/game/mt32-panel-parameters';
import './work/native-mt32-check/panel.css';
export function RolandDevicePanel({roland}:{roland:ReturnType<typeof useRolandDevice>}){
 const {power,device,display,powerBusy,powerNotice,switchPower}=roland;
 const [settings,setSettings]=useState({reverb:true,amount:100,swap:false,tune:64});
 useEffect(()=>{
  if(!device)return;
  const refresh=()=>{const values=device.settings(),tune=device.read(0x10*16384,1)[0];setSettings({reverb:!!values[0],amount:Math.round(values[3]*100),swap:!!values[1],tune});};
  refresh();const timer=setInterval(refresh,500);return()=>clearInterval(timer);
 },[device]);
 const change=(key:'reverb'|'amount'|'swap',value:number)=>{
  if(!device)return;
  device.set(key==='reverb'?0:key==='amount'?3:1,key==='amount'?value/100:value);
  setSettings(previous=>({...previous,[key]:key==='amount'?value:!!value}));
 };
 const tune=(value:number)=>{if(!device)return;device.panelWrite(mt32PanelTune(value));setSettings(previous=>({...previous,tune:value}));};
 return <><Mt32Panel device={device} lcd={display.text} midiLight={display.midi} powered={!!device}/>
 <div className="mt32-effects-viewport"><div className="mt32-controls mt32-external-controls mt32-sound-controls" aria-label="Roland sound controls">
  <div className="mt32-sound-control mt32-power"><span>POWER</span><button className="mt32-sound-button" disabled={!power} aria-label={device||powerBusy?'Power off':'Power on'} aria-pressed={!!device} onClick={()=>void switchPower()}><i/>{powerBusy?'…':device?'ON':'OFF'}</button></div>
  <div className="mt32-sound-control"><span>REVERB</span><button className="mt32-sound-button" disabled={!device} aria-label="Reverb" aria-pressed={settings.reverb} onClick={()=>change('reverb',Number(!settings.reverb))}><i/>{settings.reverb?'ON':'OFF'}</button></div>
  <label className="mt32-sound-control mt32-sound-slider"><span>REVERB AMOUNT</span><div><input aria-label="Reverb amount" type="range" min="0" max="200" step="1" value={settings.amount} disabled={!device||!settings.reverb} onChange={event=>change('amount',Number(event.target.value))}/><output>{settings.amount}%</output></div></label>
  <div className="mt32-sound-control"><span>SWAP L/R</span><button className="mt32-sound-button" disabled={!device} aria-label="Swap left and right" aria-pressed={settings.swap} onClick={()=>change('swap',Number(!settings.swap))}><i/>{settings.swap?'ON':'OFF'}</button></div>
  <label className="mt32-sound-control mt32-sound-slider"><span>MASTER TUNE</span><div><input aria-label="Master tuning" type="range" min="0" max="127" step="1" value={settings.tune} aria-valuetext={(mt32PanelTuneTenths[settings.tune]/10).toFixed(1)+' Hz'} disabled={!device} onChange={event=>tune(Number(event.target.value))}/><output>{(mt32PanelTuneTenths[settings.tune]/10).toFixed(1)}<small> Hz</small></output></div></label>
 </div></div>{(powerNotice||!power)&&<p role="status">{powerNotice||'Preparing Roland power controls…'}</p>}</>;
}
