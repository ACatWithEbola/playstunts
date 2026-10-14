/** Original1C40B..1C42B replaces the first byte after each marked '[' with
 * '*', in a local resource copy. The tenth (Done) choice is never marked. */
export function markMs91GraphicsChoices(resource:ReadonlyArray<number>,marked:readonly boolean[]):number[]{
 if(marked.length!==9)throw Error('MS91 graphics menu requires nine setting marks');
 const result=Array.from(resource);let offset=0;
 for(let index=0;index<9;index++){
  while(offset<result.length&&result[offset]!==91&&result[offset]!==0)offset++;
  if(offset>=result.length||result[offset]!==91)throw Error('Incomplete MS91 graphics menu');
  if(marked[index])result[offset+1]=42;
  offset++;
 }
 return result;
}
