'use client';
import {useEffect,useState,type RefObject} from 'react';
import {browserTouchDrivingInput,type TouchDrivingAction} from '@/lib/game/touch-driving-input';
import {useWebsiteLocale} from './WebsiteLanguage';
import {translateWebsite} from '@/lib/website-languages';
const controls:Array<[TouchDrivingAction,string,string]>=[['left','←','Steer left'],['accelerate','↑','Accelerate'],['right','→','Steer right'],['brake','↓','Brake'],['gearUp','Gear +','Shift up'],['gearDown','Gear −','Shift down'],['menu','Menu','Open game menu'],['confirm','Enter','Confirm selection'],['dashboard','D','Toggle dashboard'],['camera','C','Cycle camera views']];
export default function TouchDrivingControls({canvas}:{canvas:RefObject<HTMLCanvasElement|null>}){
 const locale=useWebsiteLocale();
 const [held,setHeld]=useState<TouchDrivingAction[]>([]);
 useEffect(()=>{const element=canvas.current;if(!element)return;const input=browserTouchDrivingInput(element);const unsubscribe=input.subscribe(()=>setHeld(controls.filter(([action])=>input.held(action)).map(([action])=>action)));return()=>{unsubscribe();input.clear();};},[canvas]);
return <div className="touch-driving-controls" role="group" aria-label={translateWebsite('Touch driving controls',locale)}>{controls.map(([action,label,title])=><button data-touch-action={action} key={action} type="button" aria-label={translateWebsite(title,locale)} aria-pressed={held.includes(action)} onClick={event=>{if(event.detail!==0||!canvas.current)return;canvas.current.focus({preventScroll:true});const input=browserTouchDrivingInput(canvas.current);input.press(action,-1);input.release(-1);}} onPointerDown={event=>{event.preventDefault();const element=canvas.current;if(!element)return;element.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);browserTouchDrivingInput(element).press(action,event.pointerId);}} onPointerUp={event=>{if(canvas.current)browserTouchDrivingInput(canvas.current).release(event.pointerId);}} onPointerCancel={event=>{if(canvas.current)browserTouchDrivingInput(canvas.current).release(event.pointerId);}} onLostPointerCapture={event=>{if(canvas.current)browserTouchDrivingInput(canvas.current).release(event.pointerId);}}>{translateWebsite(label,locale)}</button>)}</div>;
}
