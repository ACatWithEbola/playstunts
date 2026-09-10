/** Supplied 41e6..4259. The seventh physical record is the insertion slot;
 * only the display mapping moves. Equal times remain ahead of the new time. */
export function originalHighScoreInsertion(file:ReadonlyArray<number>,time:number,order:ReadonlyArray<number>,selected:number){
 if(file.length!==364||order.length!==7)throw Error('Original high scores require seven records and display indices');
 const candidate=time&65535,recordTime=(row:number)=>file[row*52+50]|file[row*52+51]<<8;
 const next=Array.from(order);
 if(recordTime(6)<=candidate)return {qualifies:false,order:next,selected:selected&255};
 let insertion=0;
 while(recordTime(insertion)<=candidate){next[insertion]=insertion;insertion++;}
 for(let row=insertion;row<6;row++)next[row+1]=row;
 next[insertion]=6;
 return {qualifies:true,order:next,selected:insertion};
}

/** Supplied 4375..43b9. Saving reorders a separate output buffer; it does
 * not reorder the loaded records or reset the current display mapping. */
export function originalHighScoreSaveBytes(file:ReadonlyArray<number>,order:ReadonlyArray<number>){
 if(file.length!==364||order.length!==7||order.some(i=>!Number.isInteger(i)||i<0||i>6))throw Error('Original high scores require seven records and valid display indices');
 return Uint8Array.from(order.flatMap(i=>Array.from(file.slice(i*52,i*52+52))));
}
