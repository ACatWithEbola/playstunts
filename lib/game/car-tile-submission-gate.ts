/** Supplied D468..D491 and D6D9..D702. Coordinate alternatives are
 * compared independently as bytes, not as two complete coordinate pairs.
 */
export function originalCarMatchesSubmissionTile(car:readonly number[],tile:readonly number[],retainedTile:readonly number[]):boolean{
 return ((car[0]&255)===(tile[0]&255)||(car[0]&255)===(retainedTile[0]&255))&&
 ((car[1]&255)===(tile[1]&255)||(car[1]&255)===(retainedTile[1]&255));
}
