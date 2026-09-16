'use client';
import {useEffect,useState} from 'react';
import {createBrowserMt32Power,type BrowserMt32Power,type BrowserNativeMt32Device} from '@/lib/game/browser-native-mt32-music';
/** Physical device belongs to the page; restarting Stunts does not power-cycle it. */
export function useRolandDevice(){
 const [power,setPower]=useState<BrowserMt32Power>(),[device,setDevice]=useState<BrowserNativeMt32Device>();
 const [powerBusy,setPowerBusy]=useState(false),[powerNotice,setPowerNotice]=useState(''),[gameRunning,setGameRunning]=useState(false);
 const [display,setDisplay]=useState({text:'',midi:false});
 useEffect(()=>{const owned=createBrowserMt32Power();const unsubscribe=owned.subscribe(setDevice);setPower(owned);return()=>{unsubscribe();owned.close();};},[]);
 useEffect(()=>{if(!power||gameRunning)return;const timer=setInterval(()=>{if(power.device){power.output.render(512);power.output.render(512);}},32);return()=>clearInterval(timer);},[power,gameRunning]);
 useEffect(()=>{if(!device){setDisplay({text:'',midi:false});return;}const refresh=()=>setDisplay(device.display());refresh();const timer=setInterval(refresh,100);return()=>clearInterval(timer);},[device]);
 const switchPower=async()=>{if(!power)return;if(device||power.starting){power.powerOff();setPowerBusy(false);setPowerNotice('Roland off · Game controls remain available.');return;}setPowerBusy(true);setPowerNotice('Powering on…');try{if(await power.powerOn())setPowerNotice('Roland on · Restart the game to reload its instruments.');}catch(error){setPowerNotice(String(error));}finally{setPowerBusy(false);}};
 return {power,device,powerBusy,powerNotice,display,setGameRunning,switchPower};
}
