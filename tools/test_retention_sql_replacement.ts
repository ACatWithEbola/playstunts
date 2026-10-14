import assert from 'node:assert/strict';
import {replaceRetentionSQL} from '../lib/server/retention-sql-replacement.ts';
assert.equal(replaceRetentionSQL('before TARGET after','TARGET','scoped'),'before scoped after');
for(const [source,target] of [['changed template','TARGET'],['TARGET TARGET','TARGET'],['anything','']])assert.throws(()=>replaceRetentionSQL(source,target,'scoped'),/requires review/);
console.log('Retention scope insertion rejects missing, repeated and empty template markers');
