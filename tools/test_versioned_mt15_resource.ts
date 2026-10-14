import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
const bytes=versionedMt15Resource('ms-1991')!;
assert.equal(bytes.length,1750);
assert.equal(createHash('sha256').update(bytes).digest('hex'),'f29d81f12bbb993764c2409da5afdc1ef161cd5605b6fca8527999954d216242');
assert.equal(versionedMt15Resource(),undefined);assert.equal(versionedMt15Resource('ms-1990'),undefined);
bytes[0]^=255;assert.notEqual(versionedMt15Resource('ms-1991')![0],bytes[0]);
console.log('Isolated MS1991 MT15 resource matches original SHA256, independent copies and no legacy/default override');
