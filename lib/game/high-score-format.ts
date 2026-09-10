import {originalGameTime} from './game-time-format.ts';
/** Supplied40a8..41dd. Strings are NUL-terminated, even when an original
 * empty-name template runs into the next field. Do not trim spaces or dots. */
export function originalHighScoreRow(raw:ReadonlyArray<number>){
 if(raw.length!==52)throw Error('Original high-score record requires52 bytes');
 const text=(offset:number)=>{const out:number[]=[];for(let i=offset;i<raw.length&&raw[i];i++)out.push(raw[i]);return out;};
 const frames=raw[50]|raw[51]<<8,time=originalGameTime(frames===65535?0:frames);
 const opponent=text(42),fields=[text(0),text(17),raw[41]===1?[40,...opponent,41]:opponent,Array.from(time,c=>c.charCodeAt(0))],offsets:number[]=[];let offset=0;
 for(const field of fields){offsets.push(offset&255);offset+=field.length+1;}
 return {fields,offsets};
}
