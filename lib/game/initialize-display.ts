import {clearOriginalDisplay} from './clear-display.ts';
import {saveOriginalVideoMode} from './save-video-mode.ts';
import {defineOriginalEgaScreenWindows} from './ega-screen-windows.ts';
import {selectOriginalDisplayWindow} from './select-display-window.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
export type OriginalDisplayStartupOperation=OriginalEgaBitmapOperation|{kind:'write-word';offset:number;value:number}|{kind:'read-bios-video-mode'}|{kind:'bios-video-mode';mode:number}|{kind:'bios-background';colour:number}|{kind:'bios-cga-palette';palette:number}|{kind:'bios-ega-palette';offset:number;segment:number};
/** Original CGA26016, TDY25EF8 and EGA26A32 startup. BIOS services and the
 * video aperture are explicit host operations; this runs no DOS code. */
export function* initializeOriginalDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega'):Generator<OriginalDisplayStartupOperation,{error:null|'exit-callbacks'|'page-count'|'window-table'},number>{
 const saved=yield* saveOriginalVideoMode(memory,d);if(saved.error)return saved;
 if(mode==='ega'){
  for(const [index,value] of [[5,0],[1,0],[8,255],[3,0]]){yield {kind:'port-byte',port:0x3ce,value:index};yield {kind:'port-byte',port:0x3cf,value};}
  yield* clearOriginalDisplay(memory,'ega',0);
 }
 memory[0x410]=(memory[0x410]&0xcf)|0x10;
 yield {kind:'bios-video-mode',mode:mode==='cga'?4:mode==='tandy'?9:13};
 if(mode==='ega'){
  yield {kind:'bios-ega-palette',offset:0x5334,segment:d>>>4};
  const defined=yield* defineOriginalEgaScreenWindows(memory,d,320,200,2);if(defined.error)return defined;
  const c=0x209e0,word=(at:number)=>memory[c+at]|(memory[c+at+1]<<8);selectOriginalDisplayWindow(memory,'ega',word(0xc0b6),word(0xc0b8));
 }else{if(mode==='cga')yield {kind:'bios-cga-palette',palette:1};yield {kind:'bios-background',colour:0};}
 return {error:null};
}
