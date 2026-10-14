"""Read-only original chassis dependency inventory, not an execution oracle."""
import argparse, json, sys
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('image',type=Path)
p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16,CS_AC_READ,CS_AC_WRITE
from capstone.x86 import X86_OP_MEM
b=a.image.read_bytes();start,end=0x751c,0x8f4a
prefix=bytes.fromhex('558bec81ece40157568b5e06')
assert b[start:start+len(prefix)]==prefix
assert b[end-6:end]==bytes.fromhex('5e5f8be55dcb')
decoder=Cs(CS_ARCH_X86,CS_MODE_16);decoder.detail=True
ops=list(decoder.disasm(b[start:end],start))
assert sum(i.size for i in ops)==end-start,'Incomplete decoding'
calls=[{'at':hex(i.address),'kind':i.mnemonic,'target':i.op_str} for i in ops if i.mnemonic in ('call','lcall')]
assert calls
dependency_names={
 '0x105c, 0x194c':'landmark-boundary-builder',
 '0x105c, 8':'surface-selector',
 '0x1718, 0x14a2':'combined-axis-rotation',
 '0x1f07, 0x1bf8':'signed-long-divide',
 '0x1f07, 0x1c94':'long-multiply',
 '0x1f07, 0x1d62':'unsigned-long-divide',
 '0x20e3, 4':'vector-length',
 '0x20e5, 0x1620':'signed-fixedpoint-product',
 '0x20e5, 0x2a':'atan',
 '0x20e5, 0x3cba':'sine',
 '0x20e5, 0x3d08':'cosine',
 '0x20e5, 0x3eca':'matrix-transform',
 '0x20e5, 0x404e':'matrix-transpose',
 '0x20e5, 0x45f0':'segment-intersection',
 '0x2df4, 0x5c':'rotation-Y',
 '0x2df4, 6':'rotation-X',
 '0x74e6':'far-matrix-copy-wrapper',
 '0xa990':'car-contact',
 '0xab00':'suspension',
 '0xb178':'collision-sound-dispatch',
 '0xb50e':'car-overlap',
 '0xba32':'crash-handler',
 '0xbbd6':'plane-movement',
 '0xbd68':'plane-distance',
 '0xbe6e':'particle-generator',
}
actual_targets={row['target'] for row in calls}
assert actual_targets==set(dependency_names),('Chassis dependency inventory changed',actual_targets^set(dependency_names))
dependency_registry=[{'target':target,'name':name,
 'callsites':[row['at'] for row in calls if row['target']==target],
 'acceptanceStatus':'requires evidence reconciliation; naming is not verification'}
 for target,name in dependency_names.items()]
globals={};indirect=[]
for instruction in ops:
 for operand in instruction.operands:
  if operand.type!=X86_OP_MEM:continue
  mem=operand.mem
  if mem.base or mem.index:
   indirect.append({'at':hex(instruction.address),'instruction':instruction.mnemonic+' '+instruction.op_str})
   continue
  key=mem.disp&65535
  row=globals.setdefault(key,{'offset':hex(key),'reads':0,'writes':0,'unknownAccess':0,'widths':set(),'sites':[]})
  row['reads']+=bool(operand.access&CS_AC_READ)
  row['writes']+=bool(operand.access&CS_AC_WRITE)
  row['unknownAccess']+=not operand.access
  row['widths'].add(operand.size);row['sites'].append(hex(instruction.address))
for row in globals.values():row['widths']=sorted(row['widths'])
assert globals and indirect
print(json.dumps({'start':hex(start),'endExclusive':hex(end),'bytes':end-start,'instructions':len(ops),'calls':calls,'dependencyRegistry':dependency_registry,'uniqueDependencies':len(dependency_registry),'absoluteGlobals':[globals[key] for key in sorted(globals)],'indirectMemorySites':indirect,'dependencyScope':'direct routine only; transitive callees and pointer contents still required','executionVerified':False},indent=2))
