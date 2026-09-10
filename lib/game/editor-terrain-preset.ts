/** Original clear/copy loops 0x1d6ad..0x1d6be and 0x1d6de..0x1d6f4. */
export function applyEditorTerrainPreset(track:number[],terrainPreset:number[]){
 if(track.length<901||terrainPreset.length!==901)throw Error('Original preset operation requires 901-byte buffers');
 const cleared=[...track];cleared.fill(0,0,900);
 return {track:cleared,terrain:[...terrainPreset]};
}
