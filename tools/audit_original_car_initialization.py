"""Complete car-start instruction inventory, linked to retained-state runtime corpus."""
import argparse,difflib,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);bodies=[]
for path,start,end in [(a.legacy,0x8f7c,0x9178),(a.modern,0x8f4a,0x9100)]:
 ops=list(d.disasm(path.read_bytes()[start:end],start));assert sum(op.size for op in ops)==end-start
 assert not any(op.mnemonic in ('call','lcall','int') for op in ops)
 bounds={op.address for op in ops}
 for op in ops:
  if op.mnemonic.startswith(('j','loop')):assert int(op.op_str,16) in bounds
 bodies.append(ops)
key=lambda op:(op.mnemonic,re.sub(r'0x[0-9a-f]+','ADDR',op.op_str))
groups=[];operands=[]
for tag,x,y,z,w in difflib.SequenceMatcher(None,list(map(key,bodies[0])),list(map(key,bodies[1])),autojunk=False).get_opcodes():
 old,new=bodies[0][x:y],bodies[1][z:w]
 if tag=='equal':
  operands.extend({'instruction':left.mnemonic,'legacy':left.op_str,'modern':right.op_str,'sites':[hex(left.address),hex(right.address)]} for left,right in zip(old,new) if left.op_str!=right.op_str and not left.mnemonic.startswith(('j','loop')))
 else:
  classification='pending'
  if tag=='delete':
   assert all((op.mnemonic=='add' and op.op_str=='bx, word ptr [bp - 6]') or (op.mnemonic=='mov' and op.op_str in ['bx, word ptr [bp + 6]','ax, word ptr [bp + 0xc]','dx, word ptr [bp + 0xe]','ax, word ptr [bp + 0x14]','dx, word ptr [bp + 0x16]','ax, word ptr [bx + 0x22]','ax, word ptr [bx + 0x30]','ax, word ptr [bx + 0x34]','ax, word ptr [bx + 0x38]']) for op in old),[(op.mnemonic,op.op_str) for op in old]
   classification='retained-register optimization;528 full-state original/native cases'
  elif tag=='insert':
   assert new[0].address in (0x9030,0x908f)
   classification='arithmetic-shift start coordinates and repeated wheel/body-cache copies;528 original/native cases'
  elif old[0].address==0x8f7f:
   assert [(op.mnemonic,op.op_str) for op in old]==[('sub','sp, 6')]
   assert [(op.mnemonic,op.op_str) for op in new]==[('sub','sp, 0xe')]
   classification='additional local coordinate/cache pointer storage'
  elif old[0].address==0x90ea:
   assert new[0].address==0x9073
   classification='wheel-loop pointer retained in local/register instead of repeated base reload;528 full-state cases'
  assert classification!='pending',(tag,hex(old[0].address) if old else None,hex(new[0].address) if new else None)
  groups.append({'tag':tag,'legacyStart':hex(old[0].address) if old else None,'modernStart':hex(new[0].address) if new else None,'classification':classification})
assert len(operands)==17
for row in operands:
 def relocate(match):
  value=int(match[0],16);assert 0xa4<=value<=0xb7
  return hex(value+24)
 assert re.sub(r'0x[0-9a-f]+',relocate,row['legacy'])==row['modern']
 row['classification']='car tail shifts24 bytes after inserted body cache; complete208-byte runtime comparison'
print(json.dumps({'completeBodiesDecoded':True,'instructionCounts':list(map(len,bodies)),'transitiveCalls':0,'changedGroups':groups,'retainedOperandCandidates':operands,'operandRelocationsClassified':True,'wholeItemAccepted':False}))
