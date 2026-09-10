'use client';
import {Mt32Panel} from './work/native-mt32-check/panel';
import type {useRolandDevice} from './use-roland-device';
import './work/native-mt32-check/panel.css';
export function RolandDevicePanel({roland}:{roland:ReturnType<typeof useRolandDevice>}){
 const {power,device,display,powerBusy,powerNotice,switchPower}=roland;
 return <><Mt32Panel device={device} lcd={display.text} midiLight={display.midi} powered={!!device}/><div className="mt32-controls mt32-external-controls"><div className="mt32-power"><i className={device?'lit':''}/><button className="mt32-power-switch" disabled={!power} title={!power?'Preparing Roland power controls':undefined} aria-label={device||powerBusy?'Power off':'Power on'} aria-pressed={!!device} onClick={()=>void switchPower()}>{powerBusy?'…':device?'ON':'OFF'}</button><span>POWER</span></div></div>{(powerNotice||!power)&&<p role="status">{powerNotice||'Preparing Roland power controls…'}</p>}</>;
}
