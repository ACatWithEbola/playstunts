/** Actual main2800 -> Track38AC -> editor1C434 -> cleanup1E7E0 frames.
 * The caller supplies its main frame; this does not choose a DOS startup SP.
 */
export function originalEditorCleanupFrame(mainFrameBP:number){
 if(!Number.isInteger(mainFrameBP)||mainFrameBP<0||mainFrameBP>65535)throw Error('Original main frame must be a 16-bit word');
 // Main locals/saved registers, Track argument and far call/prologue.
 const track=(mainFrameBP-0x16-2-4-2)&65535;
 // Track locals/saved registers, editor far call/prologue.
 const editor=(track-0x1a-4-2)&65535;
 // Editor locals/saved registers, cleanup far call/prologue.
 return (editor-0x94-4-2)&65535;
}
