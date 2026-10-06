'use client';
import {useEffect,useState} from 'react';
export const CRT_STORAGE_KEY='stunts-crt-display';
export function useCrtDisplay(){
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{try{setEnabled(localStorage.getItem(CRT_STORAGE_KEY)==='on');}catch{/* Optional preference; storage can be unavailable. */}},[]);
 const toggle=()=>setEnabled(before=>{const next=!before;try{localStorage.setItem(CRT_STORAGE_KEY,next?'on':'off');}catch{}return next;});
 return {enabled,toggle};
}
