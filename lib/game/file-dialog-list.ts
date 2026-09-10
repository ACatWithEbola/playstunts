/** Supplied 1aa9c basename copy and 1a42b..1a510 sorting. The DOS enumerator
 * supplies matching extension-bearing names; malformed paths are not a native
 * substitute for the original out-of-bounds memory reads.
 */
export function originalFileDialogNames(paths:ReadonlyArray<string>){
 // Signed indices128..243 write below the array, outside live basename
 // locals. Index244 reaches that helper's saved SI and loop counter.
 if(paths.length>244)throw Error('Original enumeration beyond244 files overwrites live basename stack state');
 const names=paths.map(path=>{
  const start=Math.max(path.lastIndexOf('\\'),path.lastIndexOf(':'))+1,end=path.indexOf('.',start);
  if(end<0)throw Error('Original file enumeration requires an extension');
  return path.slice(start,end);
 });
 // At128..244 the signed count is negative: source1A42B skips sorting.
 // Only slots0..127 are reachable before navigation enters path editing.
 if(names.length>=128)return names;
 for(let i=0;i<names.length-1;i++)for(let j=i+1;j<names.length;j++)if(names[i]>names[j])[names[i],names[j]]=[names[j],names[i]];
 return names;
}
