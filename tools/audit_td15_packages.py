"""Read-only Tandy package and exported startup comparison; no emulation/audio."""
import argparse,hashlib,sys,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
paths=[a.legacy,a.modern];before=[hashlib.sha256(x.read_bytes()).hexdigest() for x in paths];resources=[]
for path in paths:
 with zipfile.ZipFile(path) as z:resources.append({n.upper().split('/')[-1]:z.read(n) for n in z.namelist() if not n.endswith('/')})
for name in ['TDENG1.VCE','TDSKIDMS.VCE']:
 assert resources[0][name]==resources[1][name]
 print(name,len(resources[0][name]),'bytes identical',hashlib.sha256(resources[0][name]).hexdigest())
drivers=[x['TD15.DRV'] for x in resources]
assert [len(x) for x in drivers]==[2993,3241]
assert [hashlib.sha256(x).hexdigest() for x in drivers]==['38c79e87a697f6cfa89169c64fb4a4dde742abdb39fc0589f9dd843a0e4b3de9','45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24']
assert drivers[0][0x3f:0x32f]==drivers[1][0x3f:0x32f]
assert drivers[0][0x32f:0x4ff]==drivers[1][0x3a7:0x577]
assert drivers[0][0x510:0x526]==drivers[1][0x5a9:0x5bf]
print('Gain/PC-table prefix unchanged;464-byte tone/sample/noise lookup region relocated +0078 unchanged; tone gain/latch tables relocated +0099 unchanged')
# Tone/volume helpers and two exported stubs are unchanged except for the
# already classified latch-table relocation. Require complete decoding and
# exact relative branch targets, not a byte-similarity percentage.
helpers=[]
for index,(start,end,tone,volume) in enumerate([(0x526,0x579,0x521,0x51c),(0x5bf,0x612,0x5ba,0x5b5)]):
 rows=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str.replace(hex(tone),'tone-latch').replace(hex(volume),'volume-latch')
  if ins.mnemonic.startswith(('j','loop')):
   target=int(ins.op_str,16);assert start<=target<end
   operand=f'local:{target-start}'
  rows.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start;helpers.append(rows)
assert helpers[0]==helpers[1]
print(len(helpers[0]),'tone/volume helper and exported-stub instructions identical after latch relocation; saturation, nibble packing and C0/C1 order unchanged')
ordinary=0
for old_start,old_end,new_start,new_end,targets in [
 (0x6d7,0x6dc,0x73f,0x744,{}),
 (0x6f4,0x71c,0x76b,0x793,{0x6dc:0x744}),
 (0x765,0x784,0x7c1,0x7e0,{0x6f4:0x76b}),
]:
 normalized=[]
 for index,(start,end) in enumerate([(old_start,old_end),(new_start,new_end)]):
  rows=[];covered=0
  for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
   operand=ins.op_str
   if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
    target=int(ins.op_str,16)
    if start<=target<end:operand=f'local:{target-start}'
    else:
     assert target in (targets.values() if index else targets),hex(target)
     operand=f'callback:{target if index else targets[target]}'
   rows.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
  assert covered==end-start;normalized.append(rows)
 assert normalized[0]==normalized[1],hex(old_start)
 ordinary+=len(normalized[0])
print(ordinary,'controller/owner-volume wrapper and no-op callback instructions identical after explicit call relocation')
# Modern volume callback adds a zero-volume PC-speaker gate. Normalize the
# shared prefix and require the exact additional instructions/branch targets.
volume_rows=[]
for index,(start,end,table) in enumerate([(0x6dc,0x6f1,0x516),(0x744,0x759,0x5af)]):
 instructions=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start))
 assert sum(i.size for i in instructions)==end-start
 volume_rows.append([(i.mnemonic,i.op_str.replace(hex(table),'volume-table')) for i in instructions])
assert volume_rows[0]==volume_rows[1]
extra=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[1][0x759:0x768],0x759))
assert sum(i.size for i in extra)==15
assert [(i.mnemonic,i.op_str) for i in extra]==[
 ('cmp','al, 0'),('jne','0x768'),('cmp','si, 5'),('jne','0x768'),
 ('in','al, 0x61'),('and','al, 0xfc'),('out','0x61, al')]
assert drivers[0][0x6f1:0x6f4]==drivers[1][0x768:0x76b]
print('Volume callback shared prefix/epilogue unchanged; modern adds seven instructions disabling both PC-speaker gate bits only for channel5 at zero volume')
divisors=[]
for index,(start,end,field) in enumerate([(0xa06,0xa23,0x50c),(0xa21,0xa3e,0x593)]):
 rows=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str.replace(hex(field),'sample-divisor')
  if ins.mnemonic.startswith('j'):
   target=int(ins.op_str,16);assert start<=target<end;operand=f'local:{target-start}'
  rows.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start;divisors.append(rows)
assert divisors[0]==divisors[1]
assert drivers[1][0xa3e:0xa43]==drivers[1][0xa43:0xa48]==drivers[0][0xae2:0xae7]
print(len(divisors[0]),'direct-divisor callback instructions identical after field relocation; modern export45 and export48 are exact no-op stubs')
# Export headers are executable near jumps, not pointer words.
exports=[]
for driver in drivers:
 instructions=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(driver[:0x3f],0))
 assert len(instructions)==21 and all(i.size==3 and i.mnemonic=='jmp' for i in instructions)
 targets=[int(i.op_str,16) for i in instructions];assert all(0x3f<=t<len(driver) for t in targets)
 exports.append(targets)
assert exports[1]==[0x612,0x642,0x647,0x669,0x73f,0x793,0x744,0x76b,0x788,0x78e,0x793,0x7c1,0x7e0,0x841,0xa21,0xa3e,0xa43,0xba5,0xc91,0x60d,0x609]
print('All21 modern exported jumps pinned to original entries; legacy note/pitch export45 is replaced by a no-op, independently of ongoing voice callback39')
frequency=[]
for index,(start,end) in enumerate([(0x784,0x7e5),(0x7e0,0x841)]):
 rows=[];covered=0
 for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
  operand=ins.op_str
  if ins.mnemonic.startswith('j'):
   target=int(ins.op_str,16);assert start<=target<end
   operand=f'local:{target-start}'
  rows.append((ins.address-start,ins.mnemonic,operand));covered+=ins.size
 assert covered==end-start;frequency.append(rows)
differences=[(old,new) for old,new in zip(*frequency) if old!=new]
assert len(frequency[0])==len(frequency[1])
assert differences==[((9,'jb','local:40'),(9,'jb','local:64'))]
print('Entire frequency callback decoded: exactly one changed branch; channel0 routes to PC conversion instead of the retained but unreachable sample block')
status=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[1][0xc91:0xca9],0xc91))
assert sum(i.size for i in status)==24
assert [(i.mnemonic,i.op_str) for i in status]==[
 ('push','bp'),('mov','bp, sp'),('mov','ax, 1'),('cmp','word ptr [bp + 6], 0'),
 ('jne','0xca7'),('cmp','byte ptr cs:[0x595], 0'),('je','0xca7'),
 ('xor','ax, ax'),('pop','bp'),('retf','')]
print('Complete modern sample-status callback decoded: zero only for active channel0; other channels return one')
for index,(start,end) in enumerate([(0x579,0x5c2),(0x612,0x642)]):
 instructions=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start))
 assert sum(i.size for i in instructions)==end-start
 assert instructions[-2].mnemonic=='mov' and instructions[-2].op_str=='ax, 6'
 interrupts=[i.op_str for i in instructions if i.mnemonic=='int']
 if index==0:assert interrupts==['0x21','0x21']
 else:
  assert interrupts==[]
  assert any(i.mnemonic=='out' and i.op_str=='0xc4, al' for i in instructions)
 print(('Legacy','Modern')[index],len(instructions),'startup instructions fully decoded; six returned channels')
assert before==[hashlib.sha256(x.read_bytes()).hexdigest() for x in paths]
modern_code=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[1][0x5bf:],0x5bf))
assert sum(i.size for i in modern_code)==len(drivers[1])-0x5bf
boundaries={i.address for i in modern_code}
for ins in modern_code:
 if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
  if ins.op_str.startswith('0x'):assert int(ins.op_str,16) in boundaries,(hex(ins.address),ins.op_str)
changed_regions=[
 (0x669,0x73f,'note','bece8cc46d27d831b733ce8deb7a144289a3855dcc60c66def7f63827d0cedce'),
 (0x793,0x7c1,'stop','0e3d7f0ec425bb6d24f041c5e3a8c523f99384c94c755ec832b5ff29c7279901'),
 (0x841,0xa21,'voice','0d48a72cf9770dbc7b698a9337d16bc1234aa535307fab35bd9336bcacbd925f'),
 (0xa48,0xa66,'sample-stop','49000b0ea753ee33c1265fa298a0ba4c7e9eaacb9cd1a2a60fc128b6c000616c'),
 (0xa66,0xba5,'sample-irq','1a69f6ca11d48f62be0a53f7e1b8e8db23e36cb5e397ffe31f623b1b1fe31226'),
 (0xba5,0xc91,'sample-start','c222648a1f9b21d2122d2fb378b85aa2b32c1cc80826c78368861631ee71bfbc'),
]
for start,end,label,digest in changed_regions:
 assert hashlib.sha256(drivers[1][start:end]).hexdigest()==digest
 assert start in boundaries and end in boundaries
print(f'Entire modern code: {len(modern_code)} instructions/{len(drivers[1])-0x5bf} bytes fully decoded; all direct code branches land on instruction boundaries; six changed component bodies hash pinned')
print('Coverage limit: full decode/hash identity does not by itself prove semantic parity; legacy changed-body classification and modern data/state inventory still require explicit coverage')
modern_partition=[
 (0,0x3f,'21 exported jumps'),(0x3f,0x23f,'gain products'),
 (0x23f,0x32f,'PC pitch'),(0x32f,0x3a7,'sample playback rates'),
 (0x3a7,0x497,'PSG pitch'),(0x497,0x557,'sample pitch'),
 (0x557,0x567,'noise pitch'),(0x567,0x577,'velocity gains'),
 (0x577,0x596,'note, sample pointers, IRQ vectors, PIT/PIC, active state'),
 (0x596,0x5a6,'signed differential deltas'),
 (0x5a6,0x5a9,'differential phase, accumulator, previous output'),
 (0x5a9,0x5af,'six channel velocities'),(0x5af,0x5b5,'six channel gains'),
 (0x5b5,0x5ba,'volume latch'),(0x5ba,0x5bf,'tone latch'),
 (0x5bf,0xca9,'executable code'),
]
assert modern_partition[0][0]==0 and modern_partition[-1][1]==len(drivers[1])
assert all(previous[1]==following[0] for previous,following in zip(modern_partition,modern_partition[1:]))
assert drivers[1][0x596:0x5a6]==bytes(x&255 for x in [-34,-21,-13,-8,-5,-3,-2,-1,0,1,2,3,5,8,13,21])
initial_state=bytearray(drivers[1][0x577:0x596]);assert initial_state[0x58c-0x577:0x58e-0x577]==bytes([0x9c,0x2e])
initial_state[0x58c-0x577:0x58e-0x577]=bytes(2);assert not any(initial_state)
assert not any(drivers[1][0x5a6:0x5b5])
print('Modern driver partition covers all3241 bytes without gaps or overlaps: header, lookup tables, state, signed decoder deltas, latches and fully decoded code; initial PIT divisor2E9C and remaining zero state verified')
legacy_code=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[0][0x526:],0x526))
assert sum(i.size for i in legacy_code)==len(drivers[0])-0x526
legacy_boundaries={i.address for i in legacy_code}
for ins in legacy_code:
 if ins.mnemonic=='call' or ins.mnemonic.startswith(('j','loop')):
  if ins.op_str.startswith('0x'):assert int(ins.op_str,16) in legacy_boundaries,(hex(ins.address),ins.op_str)
legacy_partition=[(0,0x3f,'exports'),(0x3f,0x23f,'gain'),(0x23f,0x32f,'PC pitch'),
 (0x32f,0x41f,'PSG pitch'),(0x41f,0x4df,'sample pitch'),(0x4df,0x4ef,'noise'),
 (0x4ef,0x4ff,'velocity gain'),(0x4ff,0x510,'note,BIOS vector/sample state,silent byte'),
 (0x510,0x516,'velocities'),(0x516,0x51c,'gains'),(0x51c,0x521,'volume latch'),
 (0x521,0x526,'tone latch'),(0x526,0xbb1,'code')]
assert legacy_partition[0][0]==0 and legacy_partition[-1][1]==len(drivers[0])
assert all(x[1]==y[0] for x,y in zip(legacy_partition,legacy_partition[1:]))
assert not any(drivers[0][0x4ff:0x50f]) and drivers[0][0x50f]==128
legacy_irq=[i for i in legacy_code if 0xae7<=i.address<0xb33]
assert [(i.mnemonic,i.op_str) for i in legacy_irq if i.mnemonic in ('int','ljmp','iret')]==[
 ('int','0x1a'),('iret',''),('ljmp','cs:[0x500]')]
assert [(i.mnemonic,i.op_str) for i in legacy_irq[:2]]==[('cmp','ax, 0x91fb'),('jne','0xb2e')]
legacy_start=[i for i in legacy_code if 0xb33<=i.address<0xba6]
assert [(i.mnemonic,i.op_str) for i in legacy_start if i.mnemonic=='int']==[('int','0x1a'),('int','0x1a')]
assert [(i.mnemonic,i.op_str) for i in legacy_start if i.mnemonic=='div']==[('div','word ptr [bp + 0xc]')]
legacy_status=[i for i in legacy_code if 0xba6<=i.address<0xbb1]
assert [(i.mnemonic,i.op_str) for i in legacy_status]==[
 ('push','bp'),('mov','bp, sp'),('mov','ah, 0x81'),('int','0x1a'),('xor','ah, ah'),('pop','bp'),('retf','')]
print(f'Legacy full coverage: {len(legacy_code)} instructions/{len(drivers[0])-0x526} code bytes and complete2993-byte partition; INT15 AX91FB completion chains saved vector, sample start/status use BIOS INT1A rather than modern IRQ0/DAC state')
print('TD15 differs: legacy installs INT15 BIOS sample callback; modern startup has direct C4 DAC control and no vector install. Sample transfer/control and remaining callbacks still require audit; packages unchanged.')
