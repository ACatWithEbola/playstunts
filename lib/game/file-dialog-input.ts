/** Supplied 1a6b2..1a8cb. Seven visible filenames, with hit0 path, hit1 up,
 * hits2..8 rows and hit9 down. The original Up at the first file edits the path.
 */
export function originalFileDialogInput(input:{names:ReadonlyArray<string>;selected:number;scroll:number;hit:number;buttons:number;key:number}){
 let {selected,scroll,key}=input;const {names,hit,buttons}=input,count=(names.length<<24)>>24,b8=(n:number)=>(n<<24)>>24;
 if(hit!==-1){
  if(hit===0){if(buttons&3){selected=0;scroll=-1;key=0;}}
  else if(hit===1){if(buttons&3){if(selected+scroll!==0)selected=b8(selected-1);if(selected<scroll)scroll=selected;key=0;}}
  else if(hit===9){if(buttons&3){if(selected!==count-1)selected=b8(selected+1);key=0;}}
  else if(scroll+hit-2<count)selected=b8(scroll+hit-2);
 }
 let action:'wait'|'path'|'cancel'|'accept'='wait';
 if(key===13||key===32)action='accept';else if(key===27)action='cancel';
 else if(key===0x4800)selected=b8(selected-1);
 else if(key===0x5000){if(selected!==count-1)selected=b8(selected+1);}
 else if(key>=65&&key<=90||key>=97&&key<=122){
  const lower=String.fromCharCode(key).toLowerCase(),index=count<0?-1:names.findIndex(name=>name[0]?.toLowerCase()===lower);if(index>=0)selected=index;
 }
 if(selected<scroll)scroll=selected;
 if(scroll<0)return {selected,scroll,action:'path' as const};
 while(scroll+6<selected)scroll=b8(scroll+1);
 return {selected,scroll,action};
}
