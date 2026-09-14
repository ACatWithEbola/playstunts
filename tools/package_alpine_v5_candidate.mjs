/** Package the imagegen candidate against the original Stunts section envelope.
 * This is an offline candidate builder; it does not change active asset imports.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'app/work/backgrounds');
const rawName = 'alpine-upgraded-v5-generated-master.png';
const sourcePath = process.argv[2] || path.join(out, rawName);
const rawPath = path.join(out, rawName);
if (sourcePath !== rawPath) await fs.copyFile(sourcePath, rawPath, fs.constants.COPYFILE_EXCL);
const resources = JSON.parse(await fs.readFile(path.join(root, 'public/game/menu-panorama-art.json'), 'utf8')).find(entry => entry.source === 'ALPINE.PVS').resources;
const palette = JSON.parse(await fs.readFile(path.join(root, 'public/game/track-materials.json'), 'utf8')).palette;
const original = await sharp(path.join(out, 'alpine-original-panorama.png')).ensureAlpha().raw().toBuffer({resolveWithObject: true});
const generated = await sharp(rawPath).removeAlpha().raw().toBuffer({resolveWithObject: true});
const W = 4096, H = 1024, scale = 4, horizon = 136, sourceBase = 380;
const names = ['scen', 'sce2', 'sce3', 'sce4'];
const skyline = new Uint16Array(1024);
const layout = [];
let offset = 0, originalResourceDifference = 0, originalSkyBelowEnvelope = 0;
for (const name of names) {
  const bytes = resources[name], width = bytes[0] | bytes[1] << 8, height = bytes[2] | bytes[3] << 8;
  const top = horizon - height;
  for (let x = 0; x < width; x++) {
    let y = 0;
    while (y < height && bytes[16 + y * width + x] === 117) y++;
    skyline[offset + x] = top + y;
    for (let yy = y; yy < height; yy++) if (bytes[16 + yy * width + x] === 117) originalSkyBelowEnvelope++;
    for (let yy = 0; yy < height; yy++) {
      const originalAt = ((top + yy) * 1024 + offset + x) * 4;
      const paletteAt = bytes[16 + yy * width + x] * 3;
      for (let c = 0; c < 3; c++) if (original.data[originalAt + c] !== palette[paletteAt + c]) originalResourceDifference++;
    }
  }
  layout.push({name, offset, width, height, top});
  offset += width;
}
if (offset !== 1024 || originalResourceDifference) throw new Error('Original resource layout does not match the composition reference.');
const {width: sw, height: sh} = generated.info, src = generated.data;
const isCyan = (r, g, b) => b > 100 && b > r + 18 && g > r + 18;
const srcTops = new Uint16Array(sw);
let rejectedSourceSkySamples = 0;
for (let x = 0; x < sw; x++) {
  let y = 0;
  for (; y < sourceBase; y++) {
    const p = (y * sw + x) * 3;
    if (!isCyan(src[p], src[p + 1], src[p + 2])) break;
  }
  srcTops[x] = y;
}
// Fit one vertical mapping for the entire panorama. A separate fit per column
// would bend the interior facets into the original pixel steps.
let sumDepth = 0, sumGeneratedDepth = 0, sumDepthSquared = 0, sumProduct = 0;
for (let x = 0; x < 1024; x++) {
  const depth = horizon - skyline[x];
  const generatedDepth = sourceBase - srcTops[Math.floor((x + 0.5) * sw / 1024)];
  sumDepth += depth; sumGeneratedDepth += generatedDepth;
  sumDepthSquared += depth * depth; sumProduct += depth * generatedDepth;
}
const textureScale = (1024 * sumProduct - sumDepth * sumGeneratedDepth) / (1024 * sumDepthSquared - sumDepth * sumDepth);
const textureOffset = (sumGeneratedDepth - textureScale * sumDepth) / 1024;
// Restrict colour lookup to solid source terrain, avoiding interpolated cyan rims.
function sourceColor(x, y) {
  x = Math.max(0, Math.min(sw - 1, x));
  y = Math.max(srcTops[x], Math.min(sh - 1, y));
  let at = (y * sw + x) * 3;
  while (isCyan(src[at], src[at + 1], src[at + 2]) && y < sourceBase) {
    y++; at = (y * sw + x) * 3; rejectedSourceSkySamples++;
  }
  return [src[at], src[at + 1], src[at + 2]];
}
function sample(x, y) {
  const xx = Math.floor(x), yy = Math.floor(y), fx = x - xx, fy = y - yy;
  const a = sourceColor(xx, yy), b = sourceColor(xx + 1, yy), c = sourceColor(xx, yy + 1), d = sourceColor(xx + 1, yy + 1);
  return a.map((_, i) => Math.round((a[i] * (1 - fx) + b[i] * fx) * (1 - fy) + (c[i] * (1 - fx) + d[i] * fx) * fy));
}
const rgba = Buffer.alloc(W * H * 4), preview = Buffer.alloc(W * H * 4);
const originalSky = [...original.data.subarray(0, 3)];
const originalGround = [...original.data.subarray((200 * 1024) * 4, (200 * 1024) * 4 + 3)];
for (let x = 0; x < W; x++) {
  const top = skyline[Math.floor(x / scale)] * scale;
  const gx = Math.max(0, Math.min(sw - 1, (x + 0.5) * sw / W - 0.5));
  for (let y = 0; y < H; y++) {
    const at = (y * W + x) * 4;
    const backdrop = y < horizon * scale ? originalSky : originalGround;
    preview.set([...backdrop, 255], at);
    if (y < top || y >= horizon * scale) continue;
    const gy = sourceBase - textureOffset - (horizon - (y + 0.5) / scale) * textureScale;
    const color = sample(gx, gy);
    rgba.set([...color, 255], at);
    preview.set([...color, 255], at);
  }
}
const panoramaName = 'alpine-upgraded-background-game-v5-candidate.png';
const previewName = 'alpine-upgraded-background-v5-candidate-preview.png';
await sharp(rgba, {raw: {width: W, height: H, channels: 4}}).png().toFile(path.join(out, panoramaName));
await sharp(preview, {raw: {width: W, height: H, channels: 4}}).png().toFile(path.join(out, previewName));
const sectionDir = path.join(out, 'alpine-upgraded-sections-v5-candidate');
await fs.mkdir(sectionDir, {recursive: true});
let skylineDifferences = 0, alphaHoles = 0, detachedPixels = 0, cyanSurfacePixels = 0, opaquePixels = 0;
for (let x = 0; x < W; x++) {
  let first = H;
  for (let y = 0; y < H; y++) {
    const at = (y * W + x) * 4, alpha = rgba[at + 3];
    if (alpha) {
      opaquePixels++;
      if (first === H) first = y;
      if (isCyan(rgba[at], rgba[at + 1], rgba[at + 2])) cyanSurfacePixels++;
      if (y < skyline[Math.floor(x / scale)] * scale || y >= horizon * scale) detachedPixels++;
    } else if (y >= skyline[Math.floor(x / scale)] * scale && y < horizon * scale) alphaHoles++;
  }
  if (first !== skyline[Math.floor(x / scale)] * scale) skylineDifferences++;
}
const files = [];
for (const section of layout) {
  const name = `ALPINE-${section.name.toUpperCase()}-V5-CANDIDATE.png`;
  const filePath = path.join(sectionDir, name);
  await sharp(rgba, {raw: {width: W, height: H, channels: 4}}).extract({left: section.offset * scale, top: section.top * scale, width: section.width * scale, height: section.height * scale}).png().toFile(filePath);
  const bytes = await fs.readFile(filePath);
  files.push({...section, filename: path.relative(out, filePath), pixelWidth: section.width * scale, pixelHeight: section.height * scale, sha256: crypto.createHash('sha256').update(bytes).digest('hex')});
}
const report = {
  candidate: 'v5', mode: 'Built-in imagegen edit, followed by deterministic resource-envelope packaging',
  generatedMaster: {filename: rawName, width: sw, height: sh},
  panorama: {filename: panoramaName, width: W, height: H, alphaValues: [0, 255], skyTransparent: true, groundTransparent: true},
  preview: {filename: previewName, width: W, height: H, sky: originalSky, ground: originalGround},
  sourceHorizon: horizon, outputHorizon: horizon * scale, sourceTextureBase: sourceBase,
  textureMapping: {verticalScalePerOriginalPixel: textureScale, verticalOffset: textureOffset, perColumnDistortion: false},
  validation: {originalResourceDifference, skylineDifferences, alphaHoles, detachedPixels, cyanSurfacePixels, opaquePixels, originalSkyBelowEnvelope, rejectedSourceSkySamples},
  sections: files,
  limitations: ['Generated surface facets are interpretive; exact internal snow, rock, and tree shapes are not guaranteed.', 'Original pixel skyline is preserved at exactly 4x; this intentionally retains four-pixel boundary steps.', 'The generated master is 2172x724, so no claim of native 4096x1024 generated detail is made.', 'This is an unintegrated candidate; no active imports, existing images, deployment, or publishing were changed.'],
};
await fs.writeFile(path.join(out, 'alpine-v5-candidate-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
