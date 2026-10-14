import {test} from 'node:test';
import assert from 'node:assert/strict';
import {replayCompatibilityLabel} from '../lib/game/replay-compatibility-label.ts';
import {faqTranslations} from '../lib/website-faq-translations.ts';
test('every explicit replay engine has its own fully translated compatibility label',()=>{
 for(const [engine,date] of [['ms-1990','13 December 1990'],['bb-1991','12 February 1991'],['ms-1991','25 February 1991']]){
  const label=replayCompatibilityLabel(engine);assert.ok(label.includes(date));
  assert.equal(faqTranslations[label].length,2);assert.ok(faqTranslations[label].every(text=>text.length>20));
 }
 for(const invalid of [undefined,null,'latest','MS91'])assert.throws(()=>replayCompatibilityLabel(invalid));
});
