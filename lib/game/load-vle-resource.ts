/** Original single-pass VLE resource loading into caller-allocated DOS memory.
 * Packed bytes are staged at the high end before expansion; their surviving
 * tail remains observable to the supplied game's out-of-range resource reads.
 */
export function loadVleResource(before:Uint8Array,allocationBase:number,packed:Uint8Array){
 if(packed.length<6||packed[0]!==2)throw Error('This loader requires an original single-pass VLE resource');
 const size=packed[1]+packed[2]*256+packed[3]*65536,resourceParagraphs=Math.ceil(size/16),allocatedParagraphs=resourceParagraphs+4;
 const stagingAddress=allocationBase+(allocatedParagraphs-Math.ceil(packed.length/16))*16;
 if(!size||allocationBase<0||allocationBase%16||allocationBase+allocatedParagraphs*16>before.length||stagingAddress<allocationBase)throw Error('Original resource allocation is outside memory');
 const widths=packed[4]&127,additive=!!(packed[4]&128);if(!widths||widths>16||5+widths>packed.length)throw Error('Unsupported original VLE alphabet');
 const counts=packed.subarray(5,5+widths),alphabetStart=5+widths,alphabetSize=counts.reduce((a,b)=>a+b,0),streamStart=alphabetStart+alphabetSize;
 if(streamStart>packed.length)throw Error('Truncated original VLE alphabet');
 const tables:Map<number,number>[]=[];let code=0,letter=alphabetStart;
 for(const count of counts){const table=new Map<number,number>();for(let i=0;i<count;i++)table.set(code+i,packed[letter++]);tables.push(table);code=(code+count)*2;}
 const memory=before.slice();memory.set(packed,stagingAddress);let bit=streamStart*8,previous=0;
 for(let index=0;index<size;index++){
  let code=0,value:number|undefined;
  for(const table of tables){if(bit>=packed.length*8)throw Error('Truncated original VLE stream');code=code*2+((packed[bit>>>3]>>>(7-(bit&7)))&1);bit++;value=table.get(code);if(value!==undefined)break;}
  if(value===undefined)throw Error('Invalid original VLE code');
  previous=additive?(previous+value)&255:value;memory[allocationBase+index]=previous;
 }
 return {memory,resource:memory.subarray(allocationBase,allocationBase+size),stagingAddress,resourceParagraphs,allocatedParagraphs};
}
