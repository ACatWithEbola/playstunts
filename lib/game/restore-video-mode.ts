import {clearOriginalDisplay} from './clear-display.ts';
import type {OriginalDisplayStartupOperation} from './initialize-display.ts';
/** Original2440C restores the equipment byte both before and after BIOS mode
 * selection. A monochrome equipment flag additionally invokes the mode's clear. */
export function* restoreOriginalVideoMode(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega'):Generator<OriginalDisplayStartupOperation,void,number>{
 memory[0x410]=memory[d+0x4bc5];yield {kind:'bios-video-mode',mode:memory[d+0x4bc4]};memory[0x410]=memory[d+0x4bc5];
 if((memory[0x410]&0x30)===0x30)yield* clearOriginalDisplay(memory,mode,0);
 yield {kind:'bios-background',colour:0};
}
