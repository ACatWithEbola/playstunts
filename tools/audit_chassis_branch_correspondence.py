"""Complete branch candidate inventory. Alignment alone is not equivalence."""
import argparse,difflib,hashlib,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path)
p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
from capstone.x86 import X86_OP_IMM
d=Cs(CS_ARCH_X86,CS_MODE_16);d.detail=True
def decode(path,start,end):
 image=path.read_bytes();ops=list(d.disasm(image[start:end],start));assert sum(i.size for i in ops)==end-start
 bounds={i.address for i in ops};branches=[]
 for i in ops:
  if i.mnemonic.startswith(('j','loop')):
   assert len(i.operands)==1 and i.operands[0].type==X86_OP_IMM
   assert i.operands[0].imm in bounds
   branches.append(i)
 return ops,branches
old,ob=decode(a.legacy,0x74de,0x8f7c);new,nb=decode(a.modern,0x751c,0x8f4a)
def key(i):
 if i.mnemonic.startswith(('j','loop')) or i.mnemonic in ('call','lcall'):return i.mnemonic
 return (i.mnemonic,re.sub(r'0x[0-9a-f]+','ADDR',i.op_str),tuple(o.imm for o in i.operands if o.type==X86_OP_IMM))
mapping={};paired=[]
for tag,x,y,z,w in difflib.SequenceMatcher(None,[key(i) for i in old],[key(i) for i in new],autojunk=False).get_opcodes():
 if tag=='equal':
  for oi,ni in zip(old[x:y],new[z:w]):mapping[oi.address]=ni.address;paired.append((oi,ni))
agreed=[];pending=[]
for oi,ni in paired:
 if not oi.mnemonic.startswith(('j','loop')):continue
 target=oi.operands[0].imm;modern_target=ni.operands[0].imm
 row={'legacySite':hex(oi.address),'modernSite':hex(ni.address),'branch':oi.mnemonic,'legacyTarget':hex(target),'modernTarget':hex(modern_target),'candidateTarget':hex(mapping[target]) if target in mapping else None}
 (agreed if mapping.get(target)==modern_target else pending).append(row)
paired_old={i.address for i,j in paired};paired_new={j.address for i,j in paired}
unpaired_old=[{'site':hex(i.address),'branch':i.mnemonic,'target':hex(i.operands[0].imm)} for i in ob if i.address not in paired_old]
unpaired_new=[{'site':hex(i.address),'branch':i.mnemonic,'target':hex(i.operands[0].imm)} for i in nb if i.address not in paired_new]
modern_image=a.modern.read_bytes();legacy_image=a.legacy.read_bytes()
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x7596:0x75a7],0x7596)]==[
 ('cmp','word ptr [0x96dc], 0xa'),('jne','0x75a2'),('mov','ax, 0x1e00'),('jmp','0x75a5'),('mov','ax, 0x3c00'),('sub','dx, dx')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[0x756a:0x756e],0x756a)]==[('mov','ax, 0x3c00'),('cdq','')]
classified=[]
cadence=next(row for row in pending if row['legacySite']=='0x7562')
assert cadence['modernSite']=='0x758d' and cadence['legacyTarget']=='0x756a' and cadence['modernTarget']=='0x7596'
pending.remove(cadence);classified.append({**cadence,'classification':'entry into explicitly versioned movement divisor; not target-equivalent legacy constant load'})
for site,target,branch in [('0x759b','0x75a2','jne'),('0x75a0','0x75a5','jmp')]:
 row=next(row for row in unpaired_new if row['site']==site)
 assert row=={'site':site,'branch':branch,'target':target}
 unpaired_new.remove(row);classified.append({**row,'classification':'added10Hz divisor selection with20Hz fallback and common nonnegative highword'})
reload=next(row for row in pending if row['legacySite']=='0x75f9')
assert reload['modernSite']=='0x7635' and reload['legacyTarget']=='0x7604' and reload['modernTarget']=='0x7640'
assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[0x7604:0x760c],0x7604)]==[('mov','bx, word ptr [bp + 6]'),('test','word ptr [bx + 0x3e], 0x3ff')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x762c:0x7638],0x762c)]==[('mov','ax, word ptr [bp - 0xfa]'),('neg','ax'),('mov','word ptr [bx + 0x1e], ax'),('jmp','0x7640'),('nop','')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x7640:0x7645],0x7640)]==[('test','word ptr [bx + 0x3e], 0x3ff')]
pending.remove(reload);classified.append({**reload,'classification':'same car-field test after deleted BX reload; taken source block already addresses same car through preserved BX'})
repeat=next(row for row in unpaired_new if row['site']=='0x7db2')
assert repeat=={'site':'0x7db2','branch':'jne','target':'0x7dcc'}
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x7dad:0x7dcc],0x7dad)]==[
 ('cmp','word ptr [0x96dc], 0xa'),('jne','0x7dcc'),('mov','bx, word ptr [bp + 6]'),
 ('mov','ax, word ptr [di + 0x608]'),('add','word ptr [bx + di + 0x4c], ax'),
 ('mov','ax, word ptr [bx + di + 0x4c]'),('cdq',''),('mov','bx, word ptr [bp - 0xde]'),
 ('sub','word ptr [bx + 4], ax'),('sbb','word ptr [bx + 6], dx')]
unpaired_new.remove(repeat);classified.append({**repeat,'classification':'10Hz-only additional signed wheel-position update; other cadence jumps directly to common coordinate conversion'})
retained_pointer=next(row for row in pending if row['legacySite']=='0x8138')
assert retained_pointer['modernSite']=='0x8142' and retained_pointer['legacyTarget']=='0x8310' and retained_pointer['modernTarget']=='0x831a'
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x8138:0x8145],0x8138)]==[('mov','bx, word ptr [bp - 0xde]'),('mov','word ptr [bx + 8], cx'),('mov','word ptr [bx + 0xa], di'),('jmp','0x831a')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[0x8310:0x8319],0x8310)]==[('mov','bx, word ptr [bp - 0xdc]'),('mov','ax, word ptr [bx]'),('mov','dx, word ptr [bx + 2]')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x831a:0x831f],0x831a)]==[('mov','ax, word ptr [bx]'),('mov','dx, word ptr [bx + 2]')]
pending.remove(retained_pointer);classified.append({**retained_pointer,'classification':'removed duplicate point-pointer reload; taken source sets BX to same point before stores and jump'})
cache_entry=next(row for row in pending if row['legacySite']=='0x84e2')
assert cache_entry['modernSite']=='0x84de' and cache_entry['legacyTarget']=='0x84e7' and cache_entry['modernTarget']=='0x84e3'
assert hashlib.sha256(legacy_image[0x84e7:0x8562]).hexdigest()=='753e1310999247c75a5190af83b87a55fb7bfda9e4df46ece839f40f8ba29243'
assert hashlib.sha256(modern_image[0x84e3:0x853a]).hexdigest()=='5712947284a54a4d6ac921e4f280bcea776e6ff80963d5622b8294bad1c4c520'
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x84e3:0x84f5],0x84e3)]==[('mov','al, byte ptr [bp - 0xe8]'),('cwde',''),('mov','cx, ax'),('shl','ax, 1'),('add','ax, cx'),('shl','ax, 1'),('mov','di, ax'),('add','di, word ptr [bp + 6]')]
pending.remove(cache_entry);classified.append({**cache_entry,'classification':'entry now includes hoisted6*wheel cache destination calculation before same three signed32 SAR6 coordinates; full body pinned in cache audit'})
for lo,hi,src,dest in [(0x89a7,0x89bd,0x1be,0x1c4),(0x89bd,0x89d3,0x1ba,0x1c2),(0x89d3,0x89e9,0x1b6,0x1c0)]:
 assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[lo:hi],lo)]==[
  ('mov',f'ax, word ptr [di - {hex(src)}]'),('mov',f'dx, word ptr [di - {hex(src-2)}]'),
  ('mov','cl, 6'),('sar','dx, 1'),('rcr','ax, 1'),('dec','cl'),('jne',hex(lo+10)),('mov',f'word ptr [bp - {hex(dest)}], ax')]
for site,target in [('0x89cd','0x89c7'),('0x89e3','0x89dd')]:
 row=next(row for row in unpaired_old if row['site']==site);assert row['target']==target and row['branch']=='jne'
 unpaired_old.remove(row);classified.append({**row,'classification':'deleted legacy signed32 coordinate SAR6 loop; modern loads previously committed three-word wheel cache instead'})
cross_pair=next(row for row in pending if row['legacySite']=='0x89b7')
assert cross_pair['modernSite']=='0x8991' and cross_pair['modernTarget']=='0x89d5'
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x898b:0x8993],0x898b)]==[('mov','ax, word ptr [0x9ace]'),('cmp','word ptr [bp - 0xe], ax'),('jne','0x89d5')]
pending.remove(cross_pair);classified.append({**cross_pair,'classification':'independent alignment exception: old first coordinate loop deleted; modern plane-ID mismatch exits to cache commit, not an equivalent branch'})
mode_guard=next(row for row in unpaired_new if row['site']=='0x89b0')
assert mode_guard=={'site':'0x89b0','branch':'je','target':'0x89d5'}
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x89ab:0x89b2],0x89ab)]==[('cmp','byte ptr [0xaab6], 1'),('je','0x89d5')]
unpaired_new.remove(mode_guard);classified.append({**mode_guard,'classification':'mode1 bypasses subsequent plane crossing crash checks and commits wheel cache'})
assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[0x8a01:0x8a17],0x8a01)]==[
 ('cmp','si, -6'),('jge','0x8a0b'),('cmp','ax, 6'),('jg','0x8a17'),
 ('cmp','si, 6'),('jle','0x8a27'),('cmp','word ptr [bp - 0x136], -6'),('jge','0x8a27')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x89b2:0x89c5],0x89b2)]==[
 ('or','si, si'),('jge','0x89ba'),('or','ax, ax'),('jg','0x89c5'),
 ('or','si, si'),('jle','0x89d5'),('cmp','word ptr [bp - 0x138], 0'),('jge','0x89d5')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[0x8a27:0x8a2b],0x8a27)]==[('inc','byte ptr [bp - 0xe6]')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x89d5:0x89f4],0x89d5)]==[
 ('mov','al, byte ptr [bp - 0xe8]'),('cwde',''),('mov','di, ax'),('shl','di, 1'),('add','di, ax'),('shl','di, 1'),
 ('mov','bx, word ptr [bp + 6]'),('push','si'),('lea','di, [bx + di + 0x8c]'),('lea','si, [bp - 0x17c]'),
 ('push','ds'),('pop','es'),('movsw','word ptr es:[di], word ptr [si]'),('movsw','word ptr es:[di], word ptr [si]'),('movsw','word ptr es:[di], word ptr [si]'),('pop','si')]
for site,new_site in [('0x8a04','0x89b4'),('0x8a0e','0x89bc'),('0x8a15','0x89c3')]:
 row=next(row for row in pending if row['legacySite']==site);assert row['modernSite']==new_site
 pending.remove(row);classified.append({**row,'classification':'versioned plane crossing threshold old +/-6 to modern0; accepted exits now include wheel-cache commit before next-wheel loop, not instruction-target equivalence'})
sound_entry=next(row for row in pending if row['legacySite']=='0x8953')
assert sound_entry['modernSite']=='0x8916' and sound_entry['modernTarget']=='0x891c'
pointer_ops={i.address:i for i in new if 0x88de<=i.address<0x891c}
assert pointer_ops[0x88de].op_str=='bx, word ptr [bp + 6]'
for i in pointer_ops.values():
 if i.address in (0x88de,0x88e1):continue
 assert i.mnemonic not in ('call','lcall','int')
 assert not any(i.reg_name(r) in ('bx','bl','bh','di','bp') for r in i.regs_access()[1])
 if i.mnemonic.startswith('j'):assert i.operands[0].imm in set(pointer_ops)|{0x891c,0x892a,0x8f04}
pending.remove(sound_entry);classified.append({**sound_entry,'classification':'car pointer already retained on both sound-argument paths; merge bypasses removed reload and reads relocated car sound flags'})
assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[0x8af3:0x8b09],0x8af3)]==[
 ('mov','si, ax'),('cmp','word ptr [0x9834], 4'),('jl','0x8aff'),('jmp','0x8994'),
 ('or','si, si'),('jle','0x8b06'),('jmp','0x8a27'),('jmp','0x8a17')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x8ad5:0x8aeb],0x8ad5)]==[
 ('mov','si, ax'),('cmp','word ptr [0x9ace], 4'),('jl','0x8ae1'),('jmp','0x8954'),
 ('or','si, si'),('jle','0x8ae8'),('jmp','0x89d5'),('jmp','0x89c5')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x8954:0x895a],0x8954)]==[('mov','ax, word ptr [0x9ace]'),('mov','word ptr [bp - 0xe], ax')]
for site,new_site,classification in [
 ('0x8afc','0x8ade','planeID>=4 reverse-pass exit reenters current-plane snapshot before cache-backed selector; old enters conversion-backed selector'),
 ('0x8b03','0x8ae5','positive reverse plane distance skips crash and reaches modern cache commit before wheel increment; old goes directly to wheel increment')]:
 row=next(row for row in pending if row['legacySite']==site);assert row['modernSite']==new_site
 pending.remove(row);classified.append({**row,'classification':classification})
assert len(classified)==17 and not pending and not unpaired_old and not unpaired_new
operand_groups={}
for oi,ni in paired:
 if oi.mnemonic.startswith(('j','loop')) or oi.op_str==ni.op_str:continue
 key=(oi.mnemonic,oi.op_str,ni.op_str)
 row=operand_groups.setdefault(key,{'instruction':oi.mnemonic,'legacyOperand':oi.op_str,'modernOperand':ni.op_str,'sites':[]})
 row['sites'].append({'legacy':hex(oi.address),'modern':hex(ni.address)})
verified_pose_fields={0x9436:0x96ca,0x9438:0x96cc,0x943e:0x96d2,0x9440:0x96d4,0x9442:0x96d6,0x9444:0x96d8,0x9414:0x96a4,0x9402:0x9692,0x8e0c:0x906a,0x99b0:0xa19a}
pose_pairs=0;pose_sites=0
call_map={
 'lcall 0x1ec1, 0x1c8c':'0x1f07, 0x1c94','lcall 0x1ec1, 0x1d5a':'0x1f07, 0x1d62',
 'lcall 0x1696, 0x149a':'0x1718, 0x14a2','lcall 0x209e, 0x3d44':'0x20e5, 0x3eca',
 'call 0xb55c':'0xbbd6','call 0xb3b2':'0xba32','lcall 0xfcc, 0x8de':'0x105c, 8',
 'call 0xb6ee':'0xbd68','lcall 0x2d94, 0x60':'0x2df4, 0x5c',
 'lcall 0x209e, 0x446a':'0x20e5, 0x45f0','lcall 0x209c, 0xc':'0x20e3, 4',
 'lcall 0x1ec1, 0x1bf0':'0x1f07, 0x1bf8','lcall 0x209e, 0x3ec8':'0x20e5, 0x404e',
 'call 0x74a8':'0x74e6','lcall 0x209e, 0x28':'0x20e5, 0x2a','lcall 0x2d94, 0xa':'0x2df4, 6',
 'call 0xaa92':'0xb178','call 0xae4a':'0xb50e','lcall 0xfcc, 0x246e':'0x105c, 0x194c',
 'call 0xb7f4':'0xbe6e','lcall 0x209e, 0x3b34':'0x20e5, 0x3cba',
 'lcall 0x209e, 0x161e':'0x20e5, 0x1620','lcall 0x209e, 0x3b82':'0x20e5, 0x3d08',
}
call_pairs=0;call_sites=0;seen_calls=set()
for row in operand_groups.values():
 translated=re.sub(r'\[(0x[0-9a-f]+)\]',lambda match:'['+hex(verified_pose_fields.get(int(match[1],16),int(match[1],16)))+']',row['legacyOperand'])
 if translated==row['modernOperand']:
  row['classification']='explicit pose/state global relocation linked to exact initial/final commit audit'
  pose_pairs+=1;pose_sites+=len(row['sites'])
 elif row['instruction'] in ('call','lcall'):
  target=row['instruction']+' '+row['legacyOperand'];assert call_map[target]==row['modernOperand']
  seen_calls.add(target);call_pairs+=1;call_sites+=len(row['sites'])
  row['classification']='explicit retained call mapping linked to item24 complete helper difference audits; argument context separate'
 else:row['classification']='pending contextual operand reconciliation'
assert seen_calls==set(call_map)
assert legacy_image[0x74e1:0x74e5]==bytes.fromhex('81ece201') and modern_image[0x751f:0x7523]==bytes.fromhex('81ece401')
stack_pairs=0;stack_sites=0;stack_slot_map={}
for row in operand_groups.values():
 if not row['classification'].startswith('pending'):continue
 # Only identical operations/registers with exactly the verified two-byte
 # local displacement are accounted here. No register/field substitutions.
 translated=re.sub(r'(\[bp(?: \+ \w+)? - )(0x[0-9a-f]+)(\])',lambda match:match[1]+hex(int(match[2],16)+2)+match[3],row['legacyOperand'])
 if translated==row['modernOperand'] and translated!=row['legacyOperand']:
  for old_slot in re.findall(r'\[bp(?: \+ \w+)? - (0x[0-9a-f]+)\]',row['legacyOperand']):
   slot=int(old_slot,16);assert slot<=0x1e2 and slot+2<=0x1e4
   stack_slot_map[hex(slot)]=hex(slot+2)
  row['classification']='explicit two-byte stack-local relocation; operation/register identity retained; content-role proof remains separate'
  stack_pairs+=1;stack_sites+=len(row['sites'])
car_pairs=0;car_sites=0
for row in operand_groups.values():
 if not row['classification'].startswith('pending'):continue
 def shift_car_field(match):
  offset=int(match[2],16)
  return match[1]+hex(offset+24 if 140<=offset<184 else offset)+match[3]
 translated=re.sub(r'(\[bx(?: \+ di)? \+ )(0x[0-9a-f]+)(\])',shift_car_field,row['legacyOperand'])
 if translated==row['modernOperand'] and translated!=row['legacyOperand']:
  row['classification']='car-record field moves24 bytes after inserted body cache; linked to original184/208-byte record codec and full-state captures'
  car_pairs+=1;car_sites+=len(row['sites'])
geometry_fields={0x8d3c:0x8f9a,0x9404:0x9694,0xa46c:0xa702,0x94fe:0x9798,0x7830:0x7a30,0x783e:0x7a3c,0xa802:0xaa9a,
 0x97b7:0x9a4f,0x9834:0x9ace,0x9f32:0xa1ca,0x9f34:0xa1cc,0x9456:0x96ec,0x945e:0x96f8,0x9468:0x9702,
 0x9416:0x96a6,0x9418:0x96aa,0x9417:0x96a7,0x9f86:0xa21a,
 0x9307:0x9595,0x843e:0x863c,0x97d2:0x9a6c,0x97d4:0x9a6e}
geometry_pairs=0;geometry_sites=0
for row in operand_groups.values():
 if not row['classification'].startswith('pending'):continue
 translated=re.sub(r'\[(0x[0-9a-f]+)\]',lambda match:'['+hex(geometry_fields.get(int(match[1],16),int(match[1],16)))+']',row['legacyOperand'])
 if translated==row['modernOperand'] and translated!=row['legacyOperand']:
  row['classification']='explicit collision/landmark global fields linked to wall-entry, selector, plane and landmark helper audits'
  geometry_pairs+=1;geometry_sites+=len(row['sites'])
assert legacy_image[0x32090+0x99a4:0x32090+0x99ba]==modern_image[0x32a90+0xa18e:0x32a90+0xa1a4]
scratch_fields={offset:offset+0x7ea for offset in range(0x99a4,0x99ba,2)}
scratch_pairs=0;scratch_sites=0;alias_pairs=0;alias_sites=0
for row in operand_groups.values():
 if not row['classification'].startswith('pending'):continue
 translated=re.sub(r'\[(0x[0-9a-f]+)\]',lambda match:'['+hex(scratch_fields.get(int(match[1],16),int(match[1],16)))+']',row['legacyOperand'])
 if translated==row['modernOperand'] and translated!=row['legacyOperand']:
  row['classification']='explicit contiguous11-word scratch bank relocation; initial bank bytes identical, operation/register unchanged'
  scratch_pairs+=1;scratch_sites+=len(row['sites']);continue
 # DI is explicitly proven to alias the car pointer in the sound/contacts
 # entry region. Do not extend this rule to other DI-indexed regions.
 if row['sites'] and all(0x88de<=int(site['modern'],16)<0x891c for site in row['sites']):
  translated=re.sub(r'(\[di \+ )(0x[0-9a-f]+)(\])',shift_car_field,row['legacyOperand'])
  if translated==row['modernOperand'] and translated!=row['legacyOperand']:
   row['classification']='DI car alias established by MOV DI,BX at88E1; retained contact bytes shift24 after cache insertion'
   alias_pairs+=1;alias_sites+=len(row['sites'])
indexed_stack_pairs=0;indexed_stack_sites=0
for row in operand_groups.values():
 if not row['classification'].startswith('pending') or '[di - ' not in row['legacyOperand']:continue
 translated=re.sub(r'(\[di - )(0x[0-9a-f]+)(\])',lambda match:match[1]+hex(int(match[2],16)+2)+match[3],row['legacyOperand'])
 if translated!=row['modernOperand']:continue
 definitions=[]
 for site in row['sites']:
  for ops,anchor in [(old,int(site['legacy'],16)),(new,int(site['modern'],16))]:
   definition=None
   for i in reversed([i for i in ops if i.address<anchor]):
    if i.mnemonic in ('call','lcall','int') or i.mnemonic.startswith(('j','loop')):break
    writes=[i.reg_name(reg) for reg in i.regs_access()[1]]
    if 'bp' in writes:break
    if 'di' in writes:
     if i.mnemonic=='add' and i.op_str=='di, bp':definition=i.address
     break
   if definition is None:break
   # No incoming branch may skip the definition within its straight-line use.
   if any(i.mnemonic.startswith(('j','loop')) and definition<i.operands[0].imm<=anchor and not definition<=i.address<=anchor for i in ops):break
   definitions.append(hex(definition))
  else:continue
  break
 if len(definitions)==2*len(row['sites']):
  row['classification']='indexed stack displacement+2 with independently traced DI+=BP definitions and no incoming bypass/write/call'
  row['baseDefinitions']=definitions;indexed_stack_pairs+=1;indexed_stack_sites+=len(row['sites'])
landmark_pairs=0;landmark_sites=0
assert legacy_image[0x32090+0x122:0x32090+0x126]==modern_image[0x32a90+0x180:0x32a90+0x184]
landmark_displacements={'0x5854':'0x55bc','0x57c2':'0x552a','0x540e':'0x5176'}
for row in operand_groups.values():
 if not row['classification'].startswith('pending'):continue
 translated=re.sub(r'(\[bx - )(0x[0-9a-f]+)(\])',lambda match:match[1]+landmark_displacements.get(match[2],match[2])+match[3],row['legacyOperand'])
 translated=translated.replace('[bx + 0x122]','[bx + 0x180]')
 if translated==row['modernOperand'] and translated!=row['legacyOperand']:
  row['classification']='explicit landmark helper table displacement; retained opcode/registers and identical two-height bank'
  landmark_pairs+=1;landmark_sites+=len(row['sites'])
bx_stack=next(row for row in operand_groups.values() if row['legacyOperand']=='word ptr [bx - 0x14]' and row['modernOperand']=='word ptr [bx - 0x16]')
assert bx_stack['instruction']=='push' and len(bx_stack['sites'])==1
for ops,anchor in [(old,0x856f),(new,0x8547)]:
 preceding=[i for i in ops if i.address<anchor][-3:]
 assert [(i.mnemonic,i.op_str) for i in preceding]==[('mov','bx, di'),('shl','bx, 1'),('add','bx, bp')]
 definition=preceding[-1].address
 assert not any(i.mnemonic.startswith(('j','loop')) and definition<i.operands[0].imm<=anchor and not definition<=i.address<=anchor for i in ops)
bx_stack['classification']='BX stack alias explicitly2*DI+BP in both originals; local displacement14 to16 follows verified two-byte relocation'
fall_bank=struct.pack('<4h',21,21,15,15)
assert legacy_image[0x32090+0x5aa:0x32090+0x5b2]==modern_image[0x32a90+0x608:0x32a90+0x610]==fall_bank
fall_operand=next(row for row in operand_groups.values() if row['legacyOperand']=='ax, word ptr [di + 0x5aa]' and row['modernOperand']=='ax, word ptr [di + 0x608]')
assert fall_operand['instruction']=='mov' and fall_operand['sites']==[{'legacy':'0x7d8e','modern':'0x7d98'}]
fall_operand['classification']='exact unchanged four-wheel fall increment bank21/21/15/15 relocated5AA to608; same indexed load'
assert [(i.mnemonic,i.op_str) for i in d.disasm(legacy_image[0x8942:0x896b],0x8942)]==[
 ('cmp','byte ptr [0x9f26], 0'),('jne','0x896b'),('cmp','byte ptr [bp + 0xe], 0'),('je','0x8956'),
 ('push','word ptr [0x8b3a]'),('jmp','0x895a'),('nop',''),('push','word ptr [0x8472]'),
 ('mov','bx, word ptr [bp + 6]'),('mov','al, byte ptr [bx + 0xb7]'),('sub','ah, ah'),('push','ax'),('push','cs'),('call','0xaa92'),('add','sp, 4')]
assert [(i.mnemonic,i.op_str) for i in d.disasm(modern_image[0x8905:0x892a],0x8905)]==[
 ('cmp','byte ptr [0xa1c0], 0'),('jne','0x892a'),('cmp','byte ptr [bp + 0xe], 0'),('je','0x8918'),
 ('push','word ptr [0x8d98]'),('jmp','0x891c'),('push','word ptr [0x8670]'),
 ('mov','al, byte ptr [bx + 0xcf]'),('sub','ah, ah'),('push','ax'),('push','cs'),('call','0xb178'),('add','sp, 4')]
audio_fields={0x9f26:0xa1c0,0x8b3a:0x8d98,0x8472:0x8670}
audio_operand_pairs=0
for row in operand_groups.values():
 if not row['classification'].startswith('pending'):continue
 translated=re.sub(r'\[(0x[0-9a-f]+)\]',lambda match:'['+hex(audio_fields.get(int(match[1],16),int(match[1],16)))+']',row['legacyOperand'])
 if translated==row['modernOperand'] and translated!=row['legacyOperand']:
  assert all(0x8942<=int(site['legacy'],16)<0x896b and 0x8905<=int(site['modern'],16)<0x892a for site in row['sites'])
  row['classification']='complete sound-dispatch caller has same zero flag gate, selected-car handle argument and relocated sound flag byte; removed reload independently verified'
  audio_operand_pairs+=1
collision_caller=[]
caller_fields={0x5854:0x55bc,0xa8c2:0xab5a,0x6cf4:0x6a66,0x7540:0x7740,0x592:0x5f0,0xae4a:0xb50e}
for index,(image,lo,hi) in enumerate([(legacy_image,0x8d34,0x8dbe),(modern_image,0x8d14,0x8d9e)]):
 ops=list(d.disasm(image[lo:hi],lo));assert sum(i.size for i in ops)==hi-lo
 normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:
   operand=re.sub(r'\[bp - (0x[0-9a-f]+)\]',lambda match:'[bp - '+hex(int(match[1],16)+2)+']',operand)
   operand=re.sub(r'0x[0-9a-f]+',lambda match:hex(caller_fields.get(int(match[0],16),int(match[0],16))),operand)
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16)
   if target==lo+0xc0:operand='caller-next-object'
   else:assert lo<=target<hi;operand='local:'+str(target-lo)
  normalized.append((i.address-lo,i.mnemonic,operand))
 collision_caller.append(normalized)
assert collision_caller[0]==collision_caller[1]
collision_operand_pairs=0
for row in operand_groups.values():
 if not row['classification'].startswith('pending'):continue
 translated=re.sub(r'0x[0-9a-f]+',lambda match:hex(caller_fields.get(int(match[0],16),int(match[0],16))),row['legacyOperand'])
 if translated==row['modernOperand'] and translated!=row['legacyOperand']:
  assert all(0x8d34<=int(site['legacy'],16)<0x8dbe and 0x8d14<=int(site['modern'],16)<0x8d9e for site in row['sites'])
  row['classification']='complete138-byte indexed collision caller matches explicit resource/marker/dimension/helper relocations; allocation pointer contents separate'
  collision_operand_pairs+=1
transition_context=[]
for index,(image,lo,hi) in enumerate([(legacy_image,0x8b0d,0x8b36),(modern_image,0x8aef,0x8b18)]):
 ops=list(d.disasm(image[lo:hi],lo));assert sum(i.size for i in ops)==41
 normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:
   operand=re.sub(r'(\[bx \+ )(0x[0-9a-f]+)(\])',shift_car_field,operand)
   operand=operand.replace('[bp - 0x11a]','[bp - 0x11c]').replace('[0x9092]','[0x92f0]')
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16)==lo+33;operand='contact-count-commit'
  normalized.append((i.address-lo,i.mnemonic,operand))
 transition_context.append(normalized)
assert transition_context[0]==transition_context[1]
counter=next(row for row in operand_groups.values() if row['legacyOperand']=='word ptr [0x9092]')
counter['classification']='complete41-byte player-only ground-to-air transition counter context equivalent under car/local/global relocations'
for image,start,field,yes,no in [(legacy_image,0x8b8a,'0x9424','0x8b94','0x8c5c'),(modern_image,0x8b6c,'0x96b6','0x8b76','0x8c3c')]:
 assert [(i.mnemonic,i.op_str) for i in d.disasm(image[start:start+10],start)]==[('cmp',f'byte ptr [{field}], 0'),('jne',yes),('jmp',no)]
opponent_gate=next(row for row in operand_groups.values() if row['legacyOperand']=='byte ptr [0x9424], 0')
opponent_gate['classification']='explicit nonzero two-car-interaction gate; same branch ordering into opponent collision path, verified in opponent and mixed-car captures'
assert not any(row['classification'].startswith('pending') for row in operand_groups.values())
print(json.dumps({'legacyBranches':len(ob),'modernBranches':len(nb),'allBranchTargetsInternalAndAligned':True,
 'candidateDestinationAgreement':len(agreed),'pendingDestinations':pending,
 'unpairedLegacyBranches':unpaired_old,'unpairedModernBranches':unpaired_new,'explicitlyClassifiedExceptions':classified,
 'alignedOperandInventory':list(operand_groups.values()),'alignedOperandInventoryIsNotEquivalence':True,
 'poseOperandReconciliation':{'classifiedPairs':pose_pairs,'classifiedSites':pose_sites},
 'callOperandReconciliation':{'classifiedPairs':call_pairs,'classifiedSites':call_sites,'pendingPairs':len(operand_groups)-pose_pairs-call_pairs},
 'stackOperandReconciliation':{'classifiedPairs':stack_pairs,'classifiedSites':stack_sites,'slotMap':stack_slot_map,'pendingPairs':len(operand_groups)-pose_pairs-call_pairs-stack_pairs,'contentRoleEquivalenceClaimed':False},
 'carFieldOperandReconciliation':{'classifiedPairs':car_pairs,'classifiedSites':car_sites,'pendingPairs':len(operand_groups)-pose_pairs-call_pairs-stack_pairs-car_pairs},
 'geometryOperandReconciliation':{'classifiedPairs':geometry_pairs,'classifiedSites':geometry_sites,'pendingPairs':len(operand_groups)-pose_pairs-call_pairs-stack_pairs-car_pairs-geometry_pairs},
 'scratchOperandReconciliation':{'classifiedPairs':scratch_pairs,'classifiedSites':scratch_sites,'carAliasPairs':alias_pairs,'carAliasSites':alias_sites,'pendingPairs':len(operand_groups)-pose_pairs-call_pairs-stack_pairs-car_pairs-geometry_pairs-scratch_pairs-alias_pairs},
 'indexedStackReconciliation':{'classifiedPairs':indexed_stack_pairs,'classifiedSites':indexed_stack_sites,'pendingPairs':sum(row['classification'].startswith('pending') for row in operand_groups.values())},
 'landmarkOperandReconciliation':{'classifiedPairs':landmark_pairs,'classifiedSites':landmark_sites,'pendingPairs':sum(row['classification'].startswith('pending') for row in operand_groups.values())},
 'audioCallerOperandReconciliation':{'classifiedPairs':audio_operand_pairs,'pendingPairs':sum(row['classification'].startswith('pending') for row in operand_groups.values())},
 'collisionCallerOperandReconciliation':{'classifiedPairs':collision_operand_pairs,'bytesPerVersion':138,'pendingPairs':sum(row['classification'].startswith('pending') for row in operand_groups.values()),'resourcePointerContentsRequireAllocationEvidence':True},
 'retainedOperandInventoryComplete':True,'layoutReconciliationIsNotFullSemanticProof':True,
 'exceptionClassificationComplete':True,'candidateAgreementRequiresSemanticContext':True,'fullBranchAuditComplete':False},indent=2))
