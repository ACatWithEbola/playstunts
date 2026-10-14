import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {versionedPc15Resource} from '../lib/game/versioned-pc15-resource.ts';
const hashes={'PC15.DRV':'4edc71e9bd56885ff8a48d7d4595c6e3a9450274ddf17580adb49d2b86353d67','PCENG1.VCE':'27355dbdc664b08803b95b9bbd06c6c7417f776ee6f57ab9f57191f6b73b5362'};
for(const [name,hash] of Object.entries(hashes)){
 for(const engine of [undefined,'ms-1990','bb-1991'] as const)assert.equal(versionedPc15Resource(name,engine),undefined);
 const bytes=versionedPc15Resource('C:\\'+name.toLowerCase(),'ms-1991')!;assert.ok(bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 bytes.fill(0);assert.equal(createHash('sha256').update(versionedPc15Resource(name,'ms-1991')!).digest('hex'),hash,'Every lookup must return an independent asset copy');
}
assert.equal(versionedPc15Resource('AD15.DRV','ms-1991'),undefined);
console.log('MS1991 PC15 driver/voice resources match original SHA256; copy-isolated, no legacy/other-driver override');
