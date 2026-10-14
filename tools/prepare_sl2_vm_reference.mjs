import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// Prepares scratch only. Does not launch emulator, attach a disk or select app timing.
const input=process.argv[2];assert.ok(input,'Supply verified firmware scratch directory');
const firmware=resolve(input);
const specs=[['8079047.hu1','7fe228566de37a2f06ca6703a9f1280fd75db2f2d0e0e635b7c3b1e214680866'],['8079048.hu2','160116f3ad6788af7faa7a5f12de636de58ea18e2021ddba242ac1e801a927af']];
const parts=specs.map(([name,hash])=>{const bytes=readFileSync(join(firmware,name));assert.equal(bytes.length,262144);assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);return [name,bytes];});
const scratch=mkdtempSync(join(tmpdir(),'playstunts-sl2-vm-'));
const vm=join(scratch,'vm'),roms=join(scratch,'roms');
mkdirSync(vm);mkdirSync(join(roms,'machines','tandy1000sl2'),{recursive:true});
for(const [name,bytes] of parts)writeFileSync(join(roms,'machines','tandy1000sl2',name),bytes,{flag:'wx'});
// Explicit experimental configuration, not asserted original SL/2 clock selection.
writeFileSync(join(vm,'86box.cfg'),'[Machine]\nmachine = tandy1000sl2\ncpu_family = 8086\ncpu_speed = 8000000\ncpu_multi = 1\nmem_size = 640\n\n[Video]\ngfxcard = internal\n',{flag:'wx'});
const global=join(scratch,'global.cfg');writeFileSync(global,'',{flag:'wx'});
const args=['-P',vm,'-O',global,'-R',roms,'-L',join(scratch,'reference.log')];
const manifest={scope:'Prepared isolated experimental 8086/8MHz VM; not launched or measured',scratch,firmware,executable:'/Applications/86Box.app/Contents/MacOS/86Box',args,guestDisk:null,productionChanged:false};
writeFileSync(join(scratch,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
console.log(JSON.stringify(manifest,null,2));
