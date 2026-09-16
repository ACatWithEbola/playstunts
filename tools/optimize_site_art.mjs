import path from 'node:path';
import process from 'node:process';
import {existsSync} from 'node:fs';
import sharp from 'sharp';

const site=process.argv[2];
if(!site)throw Error('Usage: node tools/optimize_site_art.mjs <public/site>');

const convert=async(source,target,options,resize)=>{
 const input=path.join(site,source);if(!existsSync(input))return;
 let image=sharp(input);
 if(resize)image=image.resize(resize.width,resize.height,{fit:'fill'});
 await image.webp(options).toFile(path.join(site,target));
};

await sharp(path.join(site,'manual-cover-spread.png'))
 .extract({left:720,top:350,width:480,height:120})
 .webp({lossless:true,effort:6})
 .toFile(path.join(site,'stunts-wordmark.webp'));
await convert('manual-red-car.png','manual-red-car.webp',{lossless:true,effort:6});
await convert('enhanced-artwork/SDMSEL-scrn-menu-v1.png','enhanced-artwork/SDMSEL-scrn-menu-v1.webp',{quality:92,smartSubsample:true,effort:6});
await convert('enhanced-artwork/SDMSEL-scrn-menu-v1.png','enhanced-artwork/SDMSEL-scrn-menu-display-v1.webp',{quality:92,smartSubsample:true,effort:6},{width:1280,height:960});

for(const [name,width,height] of [
 ['front',360,478],['back',360,478],['left',56,478],['right',56,478],['top',56,360],['bottom',56,360],
])await convert(`stunts-box/Stunts-${name}.jpg`,`stunts-box/Stunts-${name}.webp`,{quality:86,effort:6},{width,height});
