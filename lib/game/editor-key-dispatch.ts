/** Original 0x1d3fe dispatch; action bodies and final redraw gate are external. */
export function dispatchEditorKey(page:number,mode:number,key:number,selected:number){
 key&=65535;
 if(key>=0x3b00&&key<=0x4400&&(key&255)===0){page=(key-0x3b00)/256+1;key=0;}
 let command:string|null=null;
 if(key===32||key===0x5200)mode^=1;
 else if(key===45){if(page>1)page--;}
 else if(key===43){if(page<10)page++;}
 else if(key===0x5400){page=0;selected=0;}
 else command=({13:'activate',67:'validate',99:'validate',18176:'home',18432:'up',19200:'left',19712:'right',20480:'down'} as Record<number,string>)[key]??null;
 return {page,mode,key,selected,selection:0,command};
}
