/** Original 0x1d753..0x1d75c, after the changed-track prompt. */
export function editorLoadChoice(result:number):'save'|'load'{return (result&65535)===0?'save':'load';}
/** Original 0x1d71c gate: unchanged tracks open the file picker directly. */
export function editorLoadRequest(modified:number):'prompt'|'load'{return (modified&255)?'prompt':'load';}
