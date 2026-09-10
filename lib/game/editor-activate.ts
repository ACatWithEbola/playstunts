/** Original Enter dispatch at 0x1d536; stops before each action body. */
export function editorActivate(mode:number,cursor:number[],redraw:number){
 if((mode&255)===0)return {command:'place',redraw};
 const column=cursor[0]&255,row=(cursor[1]<<24)>>24;
 if(row<6)return {command:'select',redraw};
 const command=row===6?'page':row===7?'horizon':row===8?(column===0?'load':'new'):(column===0?'save':'done');
 return {command,redraw:1};
}
