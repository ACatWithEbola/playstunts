import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {versionedTd15Resource} from '../lib/game/versioned-td15-resource.ts';
assert.equal(versionedTd15Resource(),undefined);assert.equal(versionedTd15Resource('ms-1990'),undefined);
const bytes=versionedTd15Resource('ms-1991')!;assert.equal(bytes.length,3241);
assert.equal(createHash('sha256').update(bytes).digest('hex'),'45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24');
bytes.fill(0);assert.notEqual(versionedTd15Resource('ms-1991')![0],0);
console.log('Modern TD15 exact3241-byte original checksum and independent copies; omitted/legacy generation retains original catalog');
