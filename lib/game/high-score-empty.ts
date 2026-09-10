/** Original 3dde..3e3a: the20-dot name overlaps the car field beginning at17,
 * producing40 consecutive dots, followed by the opponent and empty time. */
export function createOriginalEmptyHighScores(){
 const record=new Uint8Array(52);record.fill(46,0,40);record.set([46,46,47,46,46,46,46],42);record[50]=record[51]=255;
 const file=new Uint8Array(364);for(let i=0;i<7;i++)file.set(record,i*52);return file;
}
