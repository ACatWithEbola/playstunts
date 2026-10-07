import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {websiteTranslations,translateWebsite} from '../lib/website-languages.ts';
const unchanged=new Set(['STUNTS','Stunts','Play Stunts','PLAYSTUNTS.COM','GitHub','GitHub ↗','GITHUB ↗','4D SPORTS','DRIVING','4D SPORTS DRIVING','4D Sports Driving','4D Sports Driving 1.1, Dec 13','TEST DRIVE™','THE DUEL: TEST DRIVE II™','FPS','AVG','1% LOW','MPH','RPM','Hz','Roland MT-32','AdLib','Tandy','Sound Blaster','PC speaker','Ctrl','Esc','main','feature/global-highscores','MS 1990','.TRK','.RPL','playstunts.com']);
const required=new Set<string>(),unwrapped:string[]=[];
const decode=(s:string)=>s.replace(/&amp;/g,'&').replace(/&nbsp;/g,'\u00a0');
function add(s:string){s=decode(s.trim());if(/[A-Za-z]{2}/.test(s)&&!unchanged.has(s))required.add(s);}
function literal(n:ts.Node){if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))add(n.text);else if(ts.isTemplateExpression(n))add(n.head.text+n.templateSpans.map((p,i)=>`{${i}}`+p.literal.text).join(''));else if(ts.isConditionalExpression(n)){literal(n.whenTrue);literal(n.whenFalse);}else if(ts.isBinaryExpression(n))literal(n.right);}
const excluded=new Set(['WebsiteLanguage.tsx','ReferenceHome.tsx','NativeDrive.tsx','CockpitArtwork.tsx','CockpitCrash.tsx','CockpitInstruments.tsx','StuntsBrand.tsx','layout.tsx']);
function scan(dir:string){for(const e of readdirSync(dir,{withFileTypes:true})){const file=join(dir,e.name);if(e.isDirectory()&&!['api','work'].includes(e.name))scan(file);else if(e.isFile()&&file.endsWith('.tsx')&&!excluded.has(e.name)){const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);function visit(n:ts.Node){if(ts.isJsxText(n)&&/[A-Za-z]{2}/.test(decode(n.text)))unwrapped.push(`${file}: ${n.text.trim()}`);if(ts.isJsxAttribute(n)&&['text','question','title','aria-label','placeholder','alt','backLabel'].includes(n.name.getText(source))&&n.initializer){if(ts.isStringLiteral(n.initializer))add(n.initializer.text);else if(ts.isJsxExpression(n.initializer)&&n.initializer.expression)literal(n.initializer.expression);}if(ts.isCallExpression(n)&&/^(setMessage|setStatus|setError|setAssessmentMessage|setSettingsNotice)$/.test(n.expression.getText(source))&&n.arguments[0])literal(n.arguments[0]);ts.forEachChild(n,visit);}visit(source);}}}
scan('app');
for(const file of ['app/OpeningSequence.tsx','app/NativeSetupPanel.tsx','app/page.tsx','app/Garage.tsx']){const src=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);function visit(n:ts.Node){if(ts.isCallExpression(n)&&n.expression.getText(src)==='useState'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0])&&/\s/.test(n.arguments[0].text))literal(n.arguments[0]);ts.forEachChild(n,visit);}visit(src);}
// Website status events originate in the game adapter, but are displayed outside
// the original game. Assert their translations without changing that adapter.
for(const file of ['lib/game/browser-global-scores.ts','lib/server/route-display.ts']){const src=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);function visit(n:ts.Node){if(ts.isCallExpression(n)&&n.expression.getText(src)==='notice'&&n.arguments[0])literal(n.arguments[0]);if(ts.isPropertyAssignment(n)&&['label','detail'].includes(n.name.getText(src)))literal(n.initializer);ts.forEachChild(n,visit);}visit(src);}
const missing=[...required].filter(key=>!websiteTranslations[key]);
if(process.argv.includes('--inventory')){console.log(JSON.stringify(missing,null,2));process.exit(0);}
assert.deepEqual(unwrapped,[],'New website JSX copy must use WebsiteText');
assert.deepEqual(missing,[],'Add Spanish and Italian for every new website message');
for(const [key,translations] of Object.entries(websiteTranslations)){assert.equal(translations.length,2);for(const translated of translations){assert.ok(translated.trim(),key);assert.deepEqual([...key.matchAll(/\{\d+\}/g)].map(x=>x[0]).sort(),[...translated.matchAll(/\{\d+\}/g)].map(x=>x[0]).sort(),key);}}
assert.equal(translateWebsite('Marco','es'),'Marco');assert.equal(translateWebsite('DEFAULT.TRK','it'),'DEFAULT.TRK');assert.equal(translateWebsite('Checked 13:45','es'),'Comprobado a las 13:45');assert.equal(translateWebsite('PLAY','en'),'PLAY');
console.log(`Website languages: ${required.size} messages covered, both languages complete.`);
