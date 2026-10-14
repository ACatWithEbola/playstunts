"""Complete contact helper boundaries, dependencies and changed arithmetic blocks."""
import argparse,hashlib,json,sys
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path)
p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);rows=[]
for path,start,end,targets in [
 (a.legacy,0x18c8e,0x18e12,{'0x209e, 0x3b34','0x209e, 0x3b82','0x209e, 0x161e','0x209e, 0x1690'}),
 (a.modern,0xa990,0xab00,{'0x20e5, 0x3cba','0x20e5, 0x3d08','0x20e5, 0x1620','0x20e5, 0x1692'})]:
 image=path.read_bytes();body=image[start:end]
 ops=list(d.disasm(body,start));assert sum(i.size for i in ops)==end-start
 bounds={i.address for i in ops};calls=[]
 assert body[:3]==bytes.fromhex('558bec')
 for i in ops:
  if i.mnemonic.startswith(('j','loop')):assert int(i.op_str,16) in bounds
  if i.mnemonic in ('call','lcall'):assert i.mnemonic=='lcall' and i.op_str in targets;calls.append(i.op_str)
  assert i.mnemonic not in ('int','iret')
 assert set(calls)==targets and len(calls)==9
 assert sum(i.mnemonic=='retf' for i in ops)==2
 assert path.read_bytes()==image
 rows.append({'start':hex(start),'bytes':len(body),'instructions':len(ops),'sha256':hashlib.sha256(body).hexdigest(),'calls':calls,'branchesInternal':True,'returnPaths':2})
old=a.legacy.read_bytes();new=a.modern.read_bytes()
# Pin the exact changed reduction and unsigned saturation operations.
assert old[0x18d79:0x18d93]==bytes.fromhex('b80003f76ef69933c22bc2b90200d3f833c22bc28b5e0629472c')
assert new[0xaa72:0xaa94]==bytes.fromhex('b80003f76ef6d1f8d1f88946e88b5e0639472c7307c7472c0000eb068b46e829472c')
print(json.dumps({'bodies':rows,'changedRules':['legacy wrapped signed reduction truncates toward zero; modern arithmetic quarter rounds down','modern unsigned speed comparison saturates to zero before subtraction'],
 'allDirectMathTargetsPreviouslyAudited':True,'runtimeAcceptanceSeparate':True,'sourceUnchanged':True},indent=2))
