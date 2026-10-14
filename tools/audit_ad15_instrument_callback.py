"""Bounded AdLib instrument callback/code-table relocation comparison."""
import argparse,sys,zipfile,hashlib,struct,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
paths=[a.legacy,a.modern];hashes=[hashlib.sha256(p.read_bytes()).hexdigest() for p in paths];drivers=[]
for path in paths:
 with zipfile.ZipFile(path) as z:drivers.append(z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='AD15.DRV')))
rows=[]
for index,(start,end,table,calls) in enumerate([(0x4f,0xd9,0x853,{0x78c:'opl-write',0x537:'operator',0x67d:'controller'}),(0x6b,0xf5,0x870,{0x7c7:'opl-write',0x585:'operator',0x6cb:'controller'})]):
 normalized=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str.replace(hex(table),'operator-register-table')
  if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
   target=int(ins.op_str,16);operand=calls.get(target,f'local:{target-start}')
  normalized.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start;rows.append(normalized)
assert rows[0]==rows[1]
assert drivers[0][0x853:0x865]==drivers[1][0x870:0x882]
assert hashes==[hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]
helpers=[]
for index,(start,end,table,writer) in enumerate([(0x537,0x67d,0x853,0x78c),(0x585,0x6cb,0x870,0x7c7)]):
 normalized=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str.replace(hex(table),'operator-register-table')
  if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
   target=int(ins.op_str,16)
   assert start<=target<end or target==writer,hex(target)
   operand='opl-write' if target==writer else f'local:{target-start}'
  normalized.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start
 helpers.append(normalized)
assert helpers[0]==helpers[1]
controller=[]
for index,(start,end,table,operator,pitch,volume,writer) in enumerate([
 (0x67d,0x6a1,0x6a1,0x853,0x895,0x8dd,0x78c),
 (0x6cb,0x6ef,0x6ef,0x870,0x8b2,0x8fa,0x7c7)]):
 decoded=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str.replace(hex(table),'controller-jump-table')
  if ins.mnemonic.startswith('j'):
   target=int(ins.op_str,16);assert start<=target<end;operand=f'local:{target-start}'
  decoded.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start;controller.append(decoded)
assert controller[0]==controller[1]
# These ten bytes are five pointers, not executable instructions.
old_targets=struct.unpack_from('<5H',drivers[0],0x6a1)
new_targets=struct.unpack_from('<5H',drivers[1],0x6ef)
assert tuple(t+0x4e for t in old_targets)==new_targets
assert all(0x537<=t<0x67d for t in old_targets)
assert drivers[0][0x895:0x8dd]==drivers[1][0x8b2:0x8fa]
assert drivers[0][0x8dd:0x955]==drivers[1][0x8fa:0x972]
controller_helpers=[]
for index,(start,end,operator,pitch,volume,writer) in enumerate([
 (0x6ab,0x779,0x853,0x895,0x8dd,0x78c),
 (0x6f9,0x7c7,0x870,0x8b2,0x8fa,0x7c7)]):
 decoded=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str
  for address,label in [(operator,'operator-table'),(pitch,'pitch-table'),(volume,'volume-table')]:operand=operand.replace(hex(address),label)
  if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
   target=int(ins.op_str,16);assert start<=target<end or target==writer
   operand='opl-write' if target==writer else f'local:{target-start}'
  decoded.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start;controller_helpers.append(decoded)
assert controller_helpers[0]==controller_helpers[1]
status=[]
for index,(start,end,portbase,writer) in enumerate([(0x7e8,0x853,0x955,0x78c),(0x805,0x870,0x972,0x7c7)]):
 decoded=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str.replace(hex(portbase),'opl-portbase')
  if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
   target=int(ins.op_str,16);assert start<=target<end or target==writer
   operand='opl-write' if target==writer else f'local:{target-start}'
  decoded.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start;status.append(decoded)
assert status[0]==status[1]
with zipfile.ZipFile(paths[1]) as z:
 mt=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='MT15.DRV'))
assert drivers[1][0x4f6:0x528]==mt[0x195:0x1c7]
# Ordinary exported callbacks moved by001C. Their external references have
# separately bounded relocation classes; matching a call does not audit its body.
def modern_reference(address):
 if 0x4da<=address<0x779:return address+0x4e
 if address==0x78c:return 0x7c7
 if 0x7e8<=address<0x853:return address+0x1d
 if 0x960<=address<len(drivers[0]):return address+0x11e
 raise AssertionError(f'Unclassified external reference {address:04x}')
ordinary_count=0
for start,end in [(0x3f,0x4f),(0xd9,0xef),(0xef,0x1d3),(0x1d3,0x1f7),(0x1f7,0x234),(0x234,0x2aa),(0x2aa,0x3a4),(0x3a4,0x3cd),(0x3cd,0x42d),(0x42d,0x43b),(0x43b,0x479),(0x479,0x48c),(0x48c,0x4d6),(0x4d6,0x4da),(0x4da,0x537)]:
 delta=0x4e if start==0x4da else 0x1c;normalized=[]
 for index in range(2):
  first,last=start+delta*index,end+delta*index;rows=[];covered=0
  for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][first:last],first):
   operand=ins.op_str
   if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
    target=int(ins.op_str,16)
    operand=f'local:{target-first}' if first<=target<last else f'external:{modern_reference(target) if index==0 else target}'
   else:
    for old,new,label in [(0x853,0x870,'operator-table'),(0x957,0x974,'velocities'),(0xbc9,0xce7,'driver-result')]:operand=operand.replace(hex(new if index else old),label)
   rows.append((ins.address-first,ins.mnemonic,operand));covered+=ins.size
  assert covered==last-first;normalized.append(rows)
 assert normalized[0]==normalized[1],f'callback {start:04x}'
 ordinary_count+=len(normalized[0])
startup=[]
for index,(start,end,portbase,success,loop,removed) in enumerate([
 (0x960,0x9bc,0x955,0x997,0x9af,0x960),
 (0xa7e,0xada,0x972,0xab2,0xacd,0xab2)]):
 rows=[];covered=0;omitted=[]
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  covered+=ins.size
  if ins.address==removed:
   assert ins.mnemonic=='call' and int(ins.op_str,16)==(0x3f if index else 0x779)
   omitted.append(ins);continue
  operand=ins.op_str.replace(hex(portbase),'opl-portbase')
  if ins.mnemonic=='call':
   target=int(ins.op_str,16);operand=f'external:{modern_reference(target) if index==0 else target}'
  elif ins.mnemonic.startswith(('j','loop')):
   target=int(ins.op_str,16);assert target in [success,loop]
   operand='detect-success' if target==success else 'silence-loop'
  rows.append((ins.mnemonic,operand))
 assert covered==end-start and len(omitted)==1;startup.append(rows)
assert startup[0]==startup[1]
tails=[]
for index,(start,end,fields,portbase,irq) in enumerate([
 (0x9bc,0xbb9,0xbb9,0x955,0xb10),
 (0xada,0xcd7,0xcd7,0x972,0xc2e)]):
 rows=[];covered=0;changed_wait=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str;covered+=ins.size
  if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
   target=int(operand,16)
   operand=f'local:{target-start}' if start<=target<end else f'external:{modern_reference(target) if index==0 else target}'
  elif 'cs:' in operand:
   def storage(match):
    address=int(match.group(),16)
    if address==portbase:return 'opl-portbase'
    assert fields<=address<len(drivers[index]),hex(address)
    return f'storage:{address-fields}'
   operand=re.sub(r'0x[0-9a-f]+',storage,operand)
  if ins.address==start+260:
   assert ins.mnemonic=='mov' and ins.op_str==f'word ptr [si], {hex(irq)}';operand='word ptr [si], sample-irq'
  if ins.address==start+362:
   assert ins.mnemonic=='mov' and ins.op_str==('cx, 0xa' if index else 'cx, 5')
   operand='cx, versioned-status-read-count';changed_wait+=1
  rows.append((ins.address-start,ins.mnemonic,operand))
 assert covered==end-start and changed_wait==1;tails.append(rows)
assert tails[0]==tails[1]
assert drivers[0][0x853:0x955]==drivers[1][0x870:0x972]
assert drivers[0][0xbb9:]==drivers[1][0xcd7:]
header=[]
for index in range(2):
 rows=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][:0x3f],0):
  operand=ins.op_str
  if ins.mnemonic=='jmp':
   target=int(operand,16)
   if index==0:target=target+0x1c if 0x3f<=target<0x4da else modern_reference(target)
   operand=str(target)
  rows.append((ins.address,ins.mnemonic,operand));covered+=ins.size
 assert covered==0x3f;header.append(rows)
assert header[0]==header[1]
assert drivers[0][0x955:0x960]==drivers[1][0x972:0x97d]
assert drivers[1][0x97d:0xa7e]==bytes(257)
changed=[
 (0,0x779,0x78c,'04d3215ff69c9f15c3a7ef4fb153154a5ea3acd106f1c8a60fed015227271469'),
 (0,0x78c,0x7e8,'343be28d6ce1b36e7d3f2bd777258d21ec88183d4dd80670468895bdf34d87ba'),
 (1,0x3f,0x5b,'36585440fff8e16af71d4e2ef6ffab26bbc599fff8e2e487844da2728cbc2e82'),
 (1,0x7c7,0x805,'5cf5f8f0e09d48125dd35da3af6db0ff2678e71588863180691c7eb6ee518f2a')]
for index,start,end,digest in changed:
 code=drivers[index][start:end];instructions=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(code,start))
 assert sum(ins.size for ins in instructions)==len(code) and instructions[-1].mnemonic=='ret'
 assert hashlib.sha256(code).hexdigest()==digest,'Changed helper differs from classified original'
# Partition every driver byte, including data, padding and newly inserted cache.
boundaries=[
 [0,0x3f,0x537,0x67d,0x6a1,0x6ab,0x779,0x78c,0x7e8,0x853,0x955,0x960,0x9bc,0xbb9,len(drivers[0])],
 [0,0x3f,0x5b,0x4f6,0x528,0x585,0x6cb,0x6ef,0x6f9,0x7c7,0x805,0x870,0x972,0x97d,0xa7d,0xa7e,0xada,0xcd7,len(drivers[1])]]
for index,points in enumerate(boundaries):
 assert points==sorted(set(points)) and sum(b-a for a,b in zip(points,points[1:]))==len(drivers[index])
assert hashes==[hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]
print(f'AD15 instrument callback/operator region ({len(helpers[0])} instructions),controller dispatcher ({len(controller[0])}),pitch/volume helpers ({len(controller_helpers[0])}),status/detection ({len(status[0])}),five-pointer table and192-byte lookup tables match after explicit relocations; full startup/OPL hardware timing still separate')
print(f'Fifteen callback/reset regions ({ordinary_count} instructions),header,258-byte lookup tables and284-byte sample storage match; sample tail ({len(tails[0])} instructions) differs only in mapped references and status-read count5→10; modern PIT delay equals MT15; startup replaces legacy initial PIT setup with post-detection cache initialization')
print(f'All {len(drivers[0])}/{len(drivers[1])} driver bytes classified as compared code/data,explicit changed helpers,cache or padding; this is static difference classification, not hardware-time or browser acceptance proof')
