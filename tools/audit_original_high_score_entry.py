"""Entire original entry body; cadence prefix is the only structural change."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
fields={0x9758:0x99f2,0x5424:0x518c,0x5422:0x518a,0x9446:0x96da,
 0x8e6e:0x9090,0x9424:0x96b6,0xaed0:0xb168,0x8475:0x8673,
 0x2f5:0x353,0x9798:0x9a30,0x9796:0x9a2e,0x4ec2:0x50b2,0xa44e:0xa6e4}
calls={'0x1ec1, 0x16da':'0x1f07, 0x16e2','0x198d, 0x19d4':'0x198d, 0x1ad4',
 '0x3e62':'0x3e68','0x198d, 0x208a':'0x198d, 0x2108',
 '0x198d, 0x1e0':'0x198d, 0x1e4','0x198d, 0x194e':'0x198d, 0x1a4e',
 '0x198d, 0x1b26':'0x198d, 0x1c1e','0x436c':'0x4380'}
rows=[];scopes=[];branches=0;call_count=0
for index,(path,start,size) in enumerate([(a.legacy,0x41de,398),(a.modern,0x41e8,408)]):
 image=path.read_bytes();ops=list(d.disasm(image[start:start+size],start));assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
 if index:
  prefix=[i for i in ops if 0x41f0<=i.address<0x41fa]
  assert [(i.mnemonic,i.op_str) for i in prefix]==[('cmp','word ptr [0x96dc], 0xa'),('jne','0x41fa'),('shl','word ptr [bp + 6], 1')]
 kept=[i for i in ops if not(index and 0x41f0<=i.address<0x41fa)]
 assert len(kept)==150;anchors={i.address:n for n,i in enumerate(kept)};result=[]
 for i in kept:
  operand=i.op_str
  if i.mnemonic in ('call','lcall'):
   if not index:assert operand in calls;operand=calls[operand];call_count+=1
  elif i.mnemonic.startswith(('j','loop')):
   operand='instruction:'+str(anchors[int(operand,16)])
   if not index:branches+=1
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  result.append((i.mnemonic,operand))
 rows.append(result);scopes.append({'bytes':size,'instructions':len(ops)})
assert rows[0]==rows[1],[(n,x,y) for n,(x,y) in enumerate(zip(*rows)) if x!=y]
save_fields={0x5424:0x518c,0x9758:0x99f2,0x975a:0x99f4,
 0x97d6:0x9a70,0x2f7:0x355,0x942b:0x96bd,0x98:0xa4,0x135:0x193}
save_calls={'0x198d, 0x102e':'0x198d, 0x110c','0x209e, 0x3961':'0x20e5, 0x3ae7'}
save_rows=[]
for index,(path,start) in enumerate([(a.legacy,0x436c),(a.modern,0x4380)]):
 image=path.read_bytes();ops=list(d.disasm(image[start:start+141],start))
 assert sum(i.size for i in ops)==141 and ops[-1].mnemonic=='retf'
 anchors={i.address:n for n,i in enumerate(ops)};result=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='lcall':
   if not index:assert operand in save_calls;operand=save_calls[operand]
  elif i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(save_fields.get(int(m[0],16),int(m[0],16))),operand)
  result.append((i.mnemonic,operand))
 save_rows.append(result)
assert save_rows[0]==save_rows[1]
print(json.dumps({'scopes':scopes,'completeEntryBodyCompared':True,
 'onlyStructuralChange':'10Hz candidate word doubling before qualification',
 'pairedBranches':branches,'mappedCalls':call_count,'complete141ByteSaveBodyCompared':True,
 'transitiveDialogDrawingAndSaveAcceptance':False,'wholeItemAccepted':False}))
