/** Bundled Munt Part::setBend integer equation, not a complete voice model. */
export function mt32PitchBendUnits(value,range){
 if(!Number.isInteger(value)||value<0||value>16383||!Number.isInteger(range)||range<0||range>24)throw Error('Invalid explicit Roland bend value/range');
 return ((value-8192)*(range*683))>>14;
}
