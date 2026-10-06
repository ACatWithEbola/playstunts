import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('CRT overlay is static, optional and does not intercept game input',()=>{
 const css=readFileSync(new URL('../app/crt-display.css',import.meta.url),'utf8'),hook=readFileSync(new URL('../app/use-crt-display.ts',import.meta.url),'utf8');
 assert.match(css,/\.crt-screen-on::after/);assert.match(css,/pointer-events:none/);
 assert.doesNotMatch(css,/(?:^|[;{])\s*(?:filter|backdrop-filter|animation|mix-blend-mode)\s*:/);
 assert.doesNotMatch(css,/repeating-linear-gradient\(90deg/,'No coloured crosshatch mask');
 assert.match(hook,/useState\(false\)/);assert.match(hook,/localStorage.setItem/);assert.doesNotMatch(hook,/requestAnimationFrame|setInterval/);
});
