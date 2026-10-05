const cars=new Set(['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']);
/** These binary formats have no magic signature: validate their actual fields,
 * not the browser MIME type, which varies for original DOS files. */
export function validateTrackEncoding(bytes:Uint8Array){
 if(bytes.length!==1802||bytes[900]>4||Array.from(bytes.slice(901,1801)).some(n=>n>18))throw Error('This is not a supported original Stunts track');
}
export function validateReplayEncoding(bytes:Uint8Array,maxFrames=12000){
 if(bytes.length<0x723)throw Error('This is not an original Stunts replay');
 const count=bytes[22]|bytes[23]<<8,car=String.fromCharCode(...bytes.slice(0,4)),opponent=String.fromCharCode(...bytes.slice(9,13));
 if(!cars.has(car)||bytes[5]>1||bytes[6]>6||(bytes[6]&&!cars.has(opponent))||count<1||count>maxFrames||bytes.length!==0x722+count)throw Error('This is not a supported original Stunts replay');
 validateTrackEncoding(bytes.slice(24,0x722));
}
export function validateBackupGameFile(key:string,bytes:Uint8Array){
 const name=key.split('\\').pop()!;
 if(/^[A-Z0-9_-]{1,8}\.TRK$/.test(name)){validateTrackEncoding(bytes);return;}
 if(/^[A-Z0-9_-]{1,8}\.RPL$/.test(name)){validateReplayEncoding(bytes);return;}
 if(/^[A-Z0-9_-]{1,8}\.HIG$/.test(name)&&bytes.length===364)return;
 if(name==='SETUP.DAT'&&bytes.length>0&&bytes.length<=4096&&Array.from(bytes).every(n=>n===9||n===10||n===13||n>=32&&n<=126))return;
 throw Error('Backup contains an unsupported game file: '+name);
}
