"""Separate cursor bitmap entry code from embedded dispatch-pointer tables."""
import argparse,json,re,sys,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()];results=[]
for old,new,table_old,table_new,label in [(0x4548,0x46ce,0x4588,0x470e,'AND cursor bitmap'),(0x8352,0x84da,0x8392,0x851a,'OR cursor bitmap')]:
 fields={table_old:table_new,0x6788:0x6910,0x626a:0x63f2,0x629c:0x6424};rows=[]
 for index,(image,base,start) in enumerate(zip(images,[0x209e0,0x20e50],[old,new])):
  ops=list(d.disasm(image[base+start:base+start+64],start));assert sum(i.size for i in ops)==64
  assert len(ops)==26 and ops[12].mnemonic=='jmp' and ops[-1].mnemonic=='jmp'
  row=[]
  for i in ops:
   operand=i.op_str if index else re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),i.op_str)
   row.append((i.mnemonic,operand))
  rows.append(row)
 assert rows[0]==rows[1],(label,[(x,y) for x,y in zip(*rows) if x!=y])
 tables=[struct.unpack('<16H',image[base+at:base+at+32]) for image,base,at in zip(images,[0x209e0,0x20e50],[table_old,table_new])]
 deltas={y-x for x,y in zip(*tables)}
 assert deltas=={new-old},(label,deltas)
 kernels=[]
 for old_target,new_target in sorted(set(zip(*tables))):
  bodies=[]
  for image,base,start in zip(images,[0x209e0,0x20e50],[old_target,new_target]):
   ops=[];targets=set()
   for i in d.disasm(image[base+start:base+start+2048],start):
    assert i.mnemonic not in ('call','lcall','ljmp','int'),(hex(start),hex(i.address),i.mnemonic,i.op_str)
    ops.append(i)
    if i.mnemonic=='jmp' and int(i.op_str,16)<start:
     target=int(i.op_str,16)
     assert image[base+target:base+target+7]==bytes.fromhex('5f5e1f8be55dcb')
     break
    if i.mnemonic.startswith(('j','loop')):targets.add(int(i.op_str,16))
    if i.mnemonic in ('ret','retf') and targets<={op.address for op in ops}:break
   assert ops[-1].mnemonic in ('ret','retf','jmp') and targets<={op.address for op in ops}
   bodies.append(ops)
  rows=[]
  kernel_fields={at:at+0x188 for at in [0x6134,0x613a,0x613c,0x6144,0x9114,0x911c,0x911e,0x9120,0x9122,0x9124,0x9126]}
  for index,ops in enumerate(bodies):
   anchors={i.address:n for n,i in enumerate(ops)};row=[]
   for i in ops:
    operand=i.op_str
    if i.mnemonic.startswith(('j','loop')):
     target=int(operand,16);operand='instruction:'+str(anchors[target]) if target in anchors else 'verified-shared-epilogue'
    elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(kernel_fields.get(int(m[0],16),int(m[0],16))),operand)
    row.append((i.mnemonic,operand))
   rows.append(row)
  assert rows[0]==rows[1],(hex(old_target),[(x,y) for x,y in zip(*rows) if x!=y])
  kernels.append({'old':hex(old_target),'modern':hex(new_target),'instructions':len(rows[0]),'bytes':sum(i.size for i in bodies[0]),'completeBodyMatches':True})
 results.append({'helper':label,'entryCodeBytes':64,'entryInstructions':26,'pointerTableBytes':32,'mappedKernelPointers':16,'completeEntriesAndTablesMatch':True,'kernels':kernels})
background_fields={0x9126:0x92ae,0x911c:0x92a4,0x9114:0x929c,0x71d4:0x704c,0x6eec:0x6d64}
rows=[]
for index,(image,base,start) in enumerate(zip(images,[0x209e0,0x20e50],[0x8e60,0x8fe8])):
 ops=list(d.disasm(image[base+start:base+start+311],start))
 assert len(ops)==128 and sum(i.size for i in ops)==311 and ops[-1].mnemonic=='retf'
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  assert i.mnemonic not in ('call','lcall','int','ljmp')
  operand=i.op_str
  if i.mnemonic.startswith(('j','loop')):
   assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(background_fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row)
assert rows[0]==rows[1]
assert images[0][0x209e0+0x8e2c:0x209e0+0x8e3c]==images[1][0x20e50+0x8fb4:0x20e50+0x8fc4]
print(json.dumps({'helpers':results,'backgroundCaptureBytes':311,'backgroundCaptureInstructions':128,'backgroundCaptureCompleteBodyMatches':True,'backgroundMaskBytesMatch':16,'sharedDispatcherAndKernelExecutionNotInferred':True,'pass':True}))
