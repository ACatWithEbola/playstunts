/** Original 0x1d548..0x1d571; marker bytes remain uninterpreted here. */
export function editorPaletteTile(pages:number[][],page:number,row:number,column:number){
 return pages[page][row*6+column];
}
