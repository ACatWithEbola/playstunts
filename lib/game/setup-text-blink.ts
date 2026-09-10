/** Reference VGA text timing: bundled wdosbox text draw functions2212/2216
 * use counter bit4 for the cursor. Vertical timer1417 uses the same bit for
 * text attribute blinking, with opposite visibility. The epoch is browser-owned,
 * rather than a captured reference machine's power-on phase. */
export function originalSetupTextBlink(frame:number){
 const counter=Math.floor(frame)&255;
 return {cursorVisible:!!(counter&16),textVisible:!(counter&16)};
}
/** Nominal 400-line VGA timing (25.175MHz / 800 dots / 449 scanlines).
 * Hardware oscillator tolerance and browser scheduling are not emulated. */
export const SETUP_VGA_REFRESH_HZ=25_175_000/(800*449);
