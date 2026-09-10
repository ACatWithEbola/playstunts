/** Supplied628f..6464. Text fragments share one line buffer. Wrapping is
 * strictly below both the portrait boundary and80 characters; a wrapped
 * word loses one leading space. Source paragraph boundaries add no newline. */
export function originalEvaluationText(fragments:ReadonlyArray<ReadonlyArray<number>>,portraitX:number,measure:(bytes:ReadonlyArray<number>)=>number){
 const lines:{text:number[];x:number;y:number}[]=[];let line:number[]=[],word:number[]=[],width=0,y=8;
 const draw=()=>{lines.push({text:[...line],x:8,y});y+=8;};
 for(const fragment of fragments){
  for(const code of fragment){
   if(code===32||code===0){
    const wordWidth=measure(word);
    if(width+wordWidth<portraitX-16&&line.length+word.length<80){line.push(...word);width+=wordWidth;}
    else {draw();line=word[0]===32?word.slice(1):[...word];width=measure(line);}
    word=[32];
   }else word.push(code);
   if(code===0)break;
  }
 }
 if(line.length)draw();
 return lines;
}
