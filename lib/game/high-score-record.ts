const copyText=(record:Uint8Array,offset:number,text:string)=>{
 const value=text.split('\0')[0];
 if(offset+value.length>=record.length)throw Error('High-score string exceeds retained record context');
 for(let i=0;i<value.length;i++)record[offset+i]=value.charCodeAt(i)&255;
 record[offset+value.length]=0;
};
/** Supplied4259..42be. The local record is not cleared: bytes after each
 * terminating NUL retain the caller's stack contents, including name bytes. */
export function prepareOriginalHighScoreRecord(retained:ReadonlyArray<number>,state:{time:number;carName:string;classification:number;opponentSelected:number;opponentCode:string;opponentCarCode:string}){
 if(retained.length!==52)throw Error('Original high-score record requires52 retained bytes');
 const record=Uint8Array.from(retained);record[50]=state.time&255;record[51]=(state.time>>>8)&255;record[0]=0;
 copyText(record,17,state.carName);record[41]=state.classification&255;
 if(state.opponentSelected&255){copyText(record,42,state.opponentCode);record[44]=47;copyText(record,45,state.opponentCarCode);}
 else copyText(record,42,' ');
 return record;
}
/** Supplied4321..4341. The caller copies the edited name even when field
 * entry ends with Escape or timeout; those keys do not cancel this score. */
export function nameOriginalHighScoreRecord(retained:ReadonlyArray<number>,name:string){
 if(retained.length!==52||name.split('\0')[0].length>16)throw Error('Original score name field is16 characters');
 const record=Uint8Array.from(retained);copyText(record,0,name);return record;
}
