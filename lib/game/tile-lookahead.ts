/** Supplied C295..C2A9: select one of eight original lookahead tables from
 * the clip/rotation routine's heading result, retaining the source entry order.
 */
export function originalTileLookahead<T>(heading:number,tables:readonly T[]){
 const index=(heading&1023)>>>7;
 if(tables.length!==8)throw Error('Missing original tile lookahead tables');
 return {index,table:tables[index]};
}
