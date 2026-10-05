import {analyzeRoute} from '../physics/route-analysis.ts';
import {scanStart} from '../physics/start-scan.ts';
import {scoreHash} from '../game/global-score-format.ts';
import {validateTrackEncoding} from '../game/upload-validation.ts';
import type {NativeDemoData} from '../game/native-demo-runtime.ts';
export async function validateSharedTrack(value:unknown,data:NativeDemoData){
 const v=value as {name?:unknown;bytes?:unknown};
 if(!v||typeof v.name!=='string'||!/^[A-Z0-9_-]{1,8}$/.test(v.name)||!Array.isArray(v.bytes)||v.bytes.length!==1802||v.bytes.some(n=>!Number.isInteger(n)||n<0||n>255))throw Error('Use a valid original .TRK file and a name of 1–8 letters, numbers, underscores or hyphens');
 const raw=v.bytes as number[];
 validateTrackEncoding(Uint8Array.from(raw));
 if(scanStart(raw).error)throw Error('Track needs exactly one original start/finish line');
 const analyzed=analyzeRoute(raw,data.records,data.vectors,data.samples,data.objects,undefined,{sample:false});
 if(!analyzed.route||analyzed.route.error||!analyzed.route.count)throw Error('Track must have a complete drivable route');
 return {name:v.name,hash:await scoreHash(Uint8Array.from(raw)),bytes:Uint8Array.from(raw)};
}
