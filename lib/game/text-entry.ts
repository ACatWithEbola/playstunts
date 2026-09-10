export interface OriginalTextEntry {text:string;cursor:number;first:boolean;insert:boolean}
/** Supplied 2c034..2c228. Text is a fixed-width, space-padded byte field.
 * flags2 begins at the left; flags4 preserves the field on the first typed byte.
 * Only ASCII32..122 is accepted. End goes to the padded field's NUL terminator.
 */
export function editOriginalTextEntry(state:OriginalTextEntry,key:number,flags=2){
 let {text,cursor,first,insert}=state;const limit=text.length;
 if(key===13||key===27||key===0x4800||key===0x5000&&!(flags&8)||key===9&&!(flags&16))return {...state,done:true};
 if(key===0x4d00){if(cursor<limit)cursor++;}
 else if(key===0x4b00){if(cursor!==0)cursor--;}
 else if(key===0x4700)cursor=0;
 else if(key===0x4f00)cursor=limit;
 else if(key===0x5200)insert=!insert;
 else if(key===0x5300){if(cursor<limit)text=text.slice(0,cursor)+text.slice(cursor+1)+' ';}
 else if(key===8){if(cursor!==0){cursor--;text=text.slice(0,cursor)+text.slice(cursor+1)+' ';}}
 else if(key>=32&&key<=122&&cursor<limit){
  if(first&&!(flags&4)){cursor=0;text=' '.repeat(limit);}
  const character=String.fromCharCode(key);
  text=insert?(text.slice(0,cursor)+character+text.slice(cursor)).slice(0,limit):text.slice(0,cursor)+character+text.slice(cursor+1);
  if(cursor<limit)cursor++;
 }
 first=false;
 return {text,cursor,first,insert,done:false};
}
