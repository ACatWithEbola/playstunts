"""Inventory complete direct model callees; never infer equivalence from a call address."""
import argparse,hashlib,json,re,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
c=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
pairs=[
 ('model rotation matrix',(0x1696,0x149a),(0x1718,0x14a2)),
 ('matrix multiply',(0x209e,0x3e48),(0x20e5,0x3fce)),
 ('vector transform',(0x209e,0x3d44),(0x20e5,0x3eca)),
 ('matrix transpose',(0x209e,0x3ec8),(0x20e5,0x404e)),
 ('signed absolute',(0x1ec1,0x193c),(0x1f07,0x1944)),
 ('model facing bucket',(0x1696,0x1666),(0x1718,0x166e)),
 ('vector projection',(0x209e,0x382f),(0x20e5,0x39b5)),
 ('clip-code',(0x1000,0x7ae2),(0x1000,0x830a)),
 ('interpolate',(0x209e,0x446a),(0x20e5,0x45f0)),
 ('polygon clipping',(0x1000,0x7b2e),(0x1000,0x8356)),
 ('rectangle bounds',(0x1000,0x7f7a),(0x1000,0x87a2)),
 ('integer hypot',(0x209e,0x1690),(0x20e5,0x1692)),
 ('vector length',(0x209c,0xc),(0x20e3,4)),
 ('scalar perspective projection',(0x209e,0x3bb2),(0x20e5,0x3d38)),
 ('unsigned division',(0x1ec1,0x1d5a),(0x1f07,0x1d62)),
 ('primitive queue',(0x1000,0x7a24),(0x1000,0x824c)),
]
def capture(image,segment,start):
 ops=[];targets=set();has_return=False
 for i in c.disasm(image[segment*16+start:segment*16+start+4096],start):
  ops.append(i)
  if i.mnemonic.startswith(('j','loop')):
   if i.mnemonic=='ljmp':return {'pending':'far/shared tail','at':hex(i.address)}
   if not i.op_str.startswith('0x'):return {'pending':'indirect branch requires explicit table scope','at':hex(i.address),'operand':i.op_str}
   target=int(i.op_str,16)
   if target<start:return {'pending':'backward shared tail','at':hex(i.address),'target':hex(target)}
   targets.add(target)
  has_return|=i.mnemonic in ('ret','retf')
  end=i.address+i.size;next_prologue=image[segment*16+end:segment*16+end+3]==bytes.fromhex('558bec')
  if (i.mnemonic in ('ret','retf')or(has_return and i.mnemonic=='jmp'and next_prologue))and targets<={op.address for op in ops}:
   end=i.address+i.size;raw=image[segment*16+start:segment*16+end]
   return {'start':hex(start),'bytes':len(raw),'instructions':len(ops),'sha256':hashlib.sha256(raw).hexdigest(),'calls':[[hex(op.address),op.mnemonic,op.op_str]for op in ops if op.mnemonic in ('call','lcall','int')],'raw':raw,'ops':ops}
 return {'pending':'no branch-closed return within4096 bytes'}
rows=[]
shared=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_chassis_structure.py')),str(a.legacy),str(a.modern),'--libraries',str(a.libraries)],text=True))
upstream={row['legacyTarget']:row for row in shared['upstreamWallHelperMappings']}
assert upstream['0x1696, 0x149a']['allIdentifiedTransitiveCodeAndLookupDependenciesEquivalent']
assert upstream['0x209c, 0xc']['hypotBodyEquivalent']and upstream['0x209c, 0xc']['atanCodeTableAndLookupEquivalent']
assert shared['wallArithmeticHelpers']['completeBodiesByteIdentical']and any(row['name']=='long-multiply'and row['bytes']==52 and row['callsOrInterrupts']is False for row in shared['wallArithmeticHelpers']['helpers'])
shared_calls={'0x1ec1, 0x193c':'0x1f07, 0x1944','0x1ec1, 0x1c8c':'0x1f07, 0x1c94','0x209e, 0x1690':'0x20e5, 0x1692','0x209e, 0x28':'0x20e5, 0x2a','0x209e, 0x3b82':'0x20e5, 0x3d08','0x209e, 0x3b34':'0x20e5, 0x3cba'}
leaf_fields={0x4b88:0x4c66,0x4b8a:0x4c68,0x4b8c:0x4c6a,0x4b8e:0x4c6c,0x59cc:0x5bc6,0x59ce:0x5bc8,0x59d0:0x5bca,0x59d2:0x5bcc,0xa804:0xaa9c,0x59f2:0x5bec,0x845c:0x865a,0x9fb8:0xa24e,0x5d14:0x5f0e,0x8d94:0x8ff2,0x8ea0:0x90fe,0x9466:0x9700,0x636c:0x6566}
assert len(set(leaf_fields.values()))==len(leaf_fields)
for name,left,right in pairs:
 results=[capture(image,*entry)for image,entry in zip(images,[left,right])]
 identical=all('raw'in r for r in results)and results[0]['raw']==results[1]['raw']
 differences=[]
 if all('ops'in r for r in results)and len(results[0]['ops'])==len(results[1]['ops']):
  anchors=[{i.address:n for n,i in enumerate(result['ops'])}for result in results]
  for old,new in zip(results[0]['ops'],results[1]['ops']):
   if old.mnemonic.startswith(('j','loop'))and old.op_str.startswith('0x')and new.op_str.startswith('0x'):
    if anchors[0].get(int(old.op_str,16))==anchors[1].get(int(new.op_str,16)):continue
   if (old.mnemonic,old.op_str)!=(new.mnemonic,new.op_str):differences.append({'legacy':[hex(old.address),old.mnemonic,old.op_str],'modern':[hex(new.address),new.mnemonic,new.op_str]})
 relocated_leaf=name in ['vector projection','clip-code','scalar perspective projection','primitive queue']
 shared_body=name in ['model facing bucket','polygon clipping','integer hypot','vector length']
 if relocated_leaf:
  assert all('ops'in r and not r['calls']for r in results)and len(results[0]['ops'])==len(results[1]['ops'])
  for diff in differences:
   old,new=diff['legacy'],diff['modern'];assert old[1]==new[1]
   mapped=re.sub(r'0x[0-9a-f]+',lambda m:hex(leaf_fields.get(int(m[0],16),int(m[0],16))),old[2])
   assert mapped==new[2],('Unclassified leaf difference',name,diff)
 if shared_body:
  assert all('ops'in r for r in results)and len(results[0]['ops'])==len(results[1]['ops'])
  for diff in differences:
   old,new=diff['legacy'],diff['modern'];assert old[1]==new[1]
   if old[1]=='lcall':assert shared_calls.get(old[2])==new[2],('Unproven transitive call',name,diff)
   else:
    fields={0x63a0:0x659a,0x63a2:0x659c,0x63a4:0x659e,0x63a6:0x65a0}
    mapped=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),old[2]);assert mapped==new[2],('Unclassified shared-body operand',name,diff)
 for r in results:r.pop('raw',None);r.pop('ops',None)
 leaf=identical and all(not r['calls'] for r in results)
 classification='complete byte-identical branch-closed leaf'if leaf else'complete branch-closed leaf under explicit projection/clip/queue field mapping'if relocated_leaf else'pending reconciliation'
 if shared_body:classification='complete corresponding body with refreshed shared math/code/lookup dependencies'
 if name=='model rotation matrix':
  assert left==(0x1696,0x149a)and right==(0x1718,0x14a2)
  classification='complete384-byte rotation dispatch/code/table and transitive axis/lookup proof from refreshed chassis audit'
 rows.append({'name':name,'legacyEntry':[hex(n)for n in left],'modernEntry':[hex(n)for n in right],'bodies':results,'byteIdentical':identical,'relocatedBranchNormalizedDifferences':differences,'classification':classification})
assert a.legacy.read_bytes()==images[0]and a.modern.read_bytes()==images[1]
print(json.dumps({'directDependencies':len(rows),'rows':rows,'wholeItemAccepted':False,'sourceUnchanged':True}))
