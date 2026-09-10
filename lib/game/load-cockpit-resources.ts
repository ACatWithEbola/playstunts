import {prepareNativeCockpitResources} from './prepare-cockpit-resources.ts';
import {loadSelectedNativePvsBank,type NativePvsFileHost} from './load-selected-pvs-bank.ts';
/** Successful original14a60 mode0 path through1bcf8 and the PVS loaders.
 * Retains the actual nested filename-frame positions relative to this caller.
 * File-service failures still belong to the original retry/error-dialog caller. */
export async function loadNativeCockpitResources(host:NativePvsFileHost,d:number,callerFramePointer:number){
 await prepareNativeCockpitResources({...host,
  loadBank:(kind,nameOffset)=>loadSelectedNativePvsBank(host,d,nameOffset,(callerFramePointer-(kind===3?0x58:0x44))&65535,kind===3),
 },d);
}
