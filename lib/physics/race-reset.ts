/** Original 0x92bc..0x9311, buffer begins at DS:8c06.
 * Duplicate the starting vector, reset race counters, retain the intervening bytes.
 */
export function resetRaceFields(before:Uint8Array){
 const out=before.slice();
 for(const offset of [6,12,18])out.set(before.subarray(0,6),offset);
 out.fill(0,0x1c,0x32);
 return out;
}
