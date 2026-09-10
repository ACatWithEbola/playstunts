/** Original duration update 0x2b200, independent of elapsed wall-clock time. */
export function stepVoiceDuration(before:Uint8Array,ownerReleaseFlag:number){
 if(before.length!==46)throw Error('Original voice record must be 46 bytes');
 const record=before.slice(),view=new DataView(record.buffer),remaining=view.getUint32(12,true);
 view.setUint32(8,(view.getUint32(8,true)+1)>>>0,true);
 view.setUint32(12,(remaining-1)>>>0,true);
 const releaseChannels:number[]=[];
 if(remaining===0){releaseChannels.push(record[0x2c]);record[1]=2;record[0x16]=ownerReleaseFlag!==0?3:4;}
 return {record,releaseChannels};
}
