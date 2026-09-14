/** Build the enhanced track-menu strip from each approved 4K panorama.
 * The original overview uses the third PVS section (offset 512) and preserves
 * that section's environment-specific height immediately above the horizon.
 */
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve(import.meta.dirname,'..');
const backgrounds=path.join(root,'app/work/backgrounds');
const scale=4,horizon=136*scale,left=512*scale,width=320*scale;
const candidates=[
 ['desert','desert-upgraded-background-v1-4096x1024.png',10],
 ['city','city-upgraded-background-v1-4096x1024.png',17],
 ['country','country-upgraded-background-v1-4096x1024.png',15],
];

for(const [environment,source,height] of candidates){
 const output=`${environment}-upgraded-track-overview-v1.png`;
 await sharp(path.join(backgrounds,source))
  .extract({left,top:horizon-height*scale,width,height:height*scale})
  .png()
  .toFile(path.join(backgrounds,output));
 console.log(`${output}: ${width} x ${height*scale}`);
}
