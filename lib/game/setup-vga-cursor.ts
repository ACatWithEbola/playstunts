/** SETUP's three BIOS cursor requests on the reference VGA 8x16 text mode.
 * The supplied reference wdosbox function770 (INT10_SetCursorShape) applies
 * the BIOS compatibility conversion: 0607 -> scanlines13..14 and 0407 ->8..15.
 * This profile does not claim other video BIOSes use the same cursor shape. */
export function originalSetupVgaCursor(shape:number,blinkVisible=true){
 switch(shape&65535){
  case 0x2000:return {start:30,end:0,visible:false};
  case 0x0607:return {start:13,end:14,visible:blinkVisible};
  case 0x0407:return {start:8,end:15,visible:blinkVisible};
  default:throw Error('Unverified SETUP cursor request: '+shape.toString(16));
 }
}
