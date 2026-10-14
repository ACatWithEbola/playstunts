"""Complete model-projection instruction inventory; differences are not accepted automatically."""
import argparse,difflib,hashlib,json,re,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
c=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
bounds=[(0x16aa0,0x17a23),(0x172c6,0x1824b)];bodies=[];inventories=[]
body_hashes=['f8408e18841d0a790169dcbf6ee15d450f830d5760cd0f1f979ced6dfbf645da','dba29cc4d6026d591077b6460536e9aea436ff6dba8cd9f5e0f11fd6d6feaae4']
for image,(start,end) in zip(images,bounds):
 assert image[start:start+9]==bytes.fromhex('558bec81ec7c0b5756') and image[end-1]==0xcb
 body=list(c.disasm(image[start:end],start));assert sum(i.size for i in body)==end-start
 anchors={i.address for i in body};branches=[];calls=[]
 for i in body:
  if i.mnemonic.startswith(('j','loop')):
   target=int(i.op_str,16);assert target in anchors,('Unclosed branch',hex(i.address),hex(target));branches.append([hex(i.address),hex(target)])
  elif i.mnemonic in ('call','lcall','ljmp','int'):calls.append([hex(i.address),i.mnemonic,i.op_str])
 bodies.append(body);inventories.append({'start':hex(start),'endExclusive':hex(end),'bytes':end-start,'instructions':len(body),'sha256':hashlib.sha256(image[start:end]).hexdigest(),'directBranches':len(branches),'calls':calls})
 assert inventories[-1]['sha256']==body_hashes[len(inventories)-1],'Unreviewed model-projection body'
def shape(i):return i.mnemonic,re.sub(r'0x[0-9a-f]+|\b[0-9]+\b','#',i.op_str)
matcher=difflib.SequenceMatcher(a=[shape(i)for i in bodies[0]],b=[shape(i)for i in bodies[1]],autojunk=False)
groups=[];operand_changes=0;operand_pairs={};equal_pairs=[];address_map={}
for tag,x0,x1,y0,y1 in matcher.get_opcodes():
 if tag=='equal':
  for old,new in zip(bodies[0][x0:x1],bodies[1][y0:y1]):
   equal_pairs.append((old,new));address_map[old.address]=new.address
   if old.op_str!=new.op_str:
    operand_changes+=1;key=(old.mnemonic,old.op_str,new.op_str);operand_pairs[key]=operand_pairs.get(key,0)+1
  continue
 def rows(body,start,end):return [[hex(i.address),i.mnemonic,i.op_str]for i in body[start:end]]
 groups.append({'kind':tag,'legacy':rows(bodies[0],x0,x1),'modern':rows(bodies[1],y0,y1),'classification':'pending'})
structural={
 ('insert','0x17360'):'descriptor08 gates retained region pointer write; model-region-tracking/render-model-memory',
 ('insert','0x17371'):'alignment NOP; no state mutation',
 ('replace','0x175b2'):'MS91 signed arithmetic halving of bounds vertex; versioned model halving original512-case proof',
 ('replace','0x177c4'):'MS91 signed arithmetic halving of primitive vertex; same original512-case proof',
 ('insert','0x17b94'):'descriptor08 gates polygon bounds writes; original polygon256-case proof',
 ('insert','0x17d86'):'descriptor08 gates line bounds writes; original primitive1024-case proof',
 ('delete','0x175a7'):'removed alignment NOP; no state mutation',
 ('insert','0x17f12'):'descriptor08 gates wheel bounds writes; original primitive1024-case proof',
 ('insert','0x180b0'):'descriptor08 gates circle bounds writes; original primitive1024-case proof',
 ('insert','0x18146'):'descriptor08 gates point bounds writes; original primitive1024-case proof',
 ('delete','0x1793b'):'removed alignment NOP; no state mutation',
}
assert len(groups)==len(structural)==11
for group in groups:
 anchor=(group['modern']or group['legacy'])[0][0];key=(group['kind'],anchor)
 assert key in structural,('Unclassified structural group',group)
 group['classification']=structural[key]
del structural
field_map={n:n+0x1fa for n in [0x59e6,0x59e8,0x59ea,0x59ec,0x59ee,0x59f0,0x5d14,0x5d16,0x636c,0x636e,0x6370,0x6372,0x6374,0x6376,0x6378,0x637a,0x6386,0x6388,0x638a,0x638c,0x638e,0x6390,0x6392,0x6394,0x6396,0x6398,0x639a,0x639c,0x639e]}
field_map.update({0x3270:0x32f8,0x3280:0x3308,0x3290:0x3318,0x3292:0x331a,0x844b:0x8649,0x845c:0x865a,0x8d94:0x8ff2,0x8ea0:0x90fe,0x9466:0x9700,0x9f84:0xa218,0x9fb8:0xa24e,0xa804:0xaa9c,0xaeb8:0xb150})
assert len(set(field_map.values()))==len(field_map)==42
table_proofs=[]
for name,left,right,length in [('primitiveCounts',0x3270,0x32f8,16),('primitiveKinds',0x3280,0x3308,16),('directionalMasks',0x3290,0x3318,128)]:
 old=images[0][0x32090+left:0x32090+left+length];new=images[1][0x32a90+right:0x32a90+right+length]
 assert len(old)==len(new)==length and old==new,(name,'Relocated table content changed')
 table_proofs.append({'name':name,'bytes':length,'sha256':hashlib.sha256(old).hexdigest()})
operand_ledger=[]
dependencies=json.loads(subprocess.check_output([sys.executable,str(Path(__file__).with_name('audit_original_model_dependencies.py')),str(a.legacy),str(a.modern),'--libraries',str(a.libraries)],text=True))
assert dependencies['directDependencies']==16 and all(row['classification'].startswith('complete')for row in dependencies['rows'])
call_map={}
def call_operand(mnemonic,operand):
 return tuple(int(part.strip(),0)for part in operand.split(','))
for row in dependencies['rows']:
 left=[int(n,16)for n in row['legacyEntry']];right=[int(n,16)for n in row['modernEntry']]
 if left[0]in (0x1000,0x1696):key=('call',(left[0]*16+left[1],));value=(right[0]*16+right[1],)
 else:key=('lcall',tuple(left));value=tuple(right)
 assert key not in call_map;call_map[key]=value
for old,new in equal_pairs:
 if old.op_str==new.op_str:continue
 row={'legacy':hex(old.address),'modern':hex(new.address),'classification':'pending'}
 if old.mnemonic.startswith(('j','loop')):
  target=int(old.op_str,16);mapped=address_map.get(target)
  if mapped==int(new.op_str,16):row['classification']='corresponding direct branch destination'
  elif (old.address,new.address,int(new.op_str,16),mapped)in [(0x17391,0x17b8f,0x17b94,0x17b9e),(0x17700,0x17f0e,0x17f12,0x17f1c)]:
   row['classification']='branch enters added descriptor08 polygon/wheel guard; original region proofs'
  else:row['mappedTarget']=None if mapped is None else hex(mapped);row['actualTarget']=new.op_str
 elif old.mnemonic in ('call','lcall'):
  assert call_map[(old.mnemonic,call_operand(old.mnemonic,old.op_str))]==call_operand(new.mnemonic,new.op_str),(hex(old.address),old.op_str,new.op_str)
  row['classification']='complete reconciled callee and transitive math/table dependencies'
 elif old.op_str=='byte ptr [bp - 2], 2'and new.op_str=='byte ptr [bp - 2], 6':
  assert old.mnemonic==new.mnemonic=='test';row['classification']='versioned primitive-sort mask; original1024-case proof'
 else:
  mapped=re.sub(r'0x[0-9a-f]+',lambda m:hex(field_map.get(int(m[0],16),int(m[0],16))),old.op_str)
  assert mapped==new.op_str,('Unclassified non-call/branch operand',hex(old.address),old.op_str,new.op_str)
  row['classification']='explicit injective model/queue scratch or table relocation'
 operand_ledger.append(row)
assert len(operand_ledger)==operand_changes==374
assert a.legacy.read_bytes()==images[0] and a.modern.read_bytes()==images[1]
print(json.dumps({'bodies':inventories,'structuralGroups':groups,'sameShapeOperandChanges':operand_changes,'operandLedger':operand_ledger,'tableProofs':table_proofs,'operandPairs':[{'mnemonic':key[0],'legacy':key[1],'modern':key[2],'count':count}for key,count in operand_pairs.items()],'operandRelocationsNotAssumedEquivalent':True,'wholeItemAccepted':False,'sourceUnchanged':True}))
