"""Resource dispatcher code/table partition and explicit new basename prefix."""
import argparse,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
calls={'0x209e, 0x2362':'0x20e5, 0x2364','0x209e, 0x23d1':'0x20e5, 0x23d3','0x30f2, 0x20':'0x3192, 0x1e','0x315d, 0x22':'0x31fd, 0x20','0x2daf, 0xb5e':'0x2e0e, 0xbf6','0x2daf, 0xb86':'0x2e0e, 0xc40','0x2daf, 0xb06':'0x2e0e, 0xb80','0x3059, 0xa':'0x30e3, 0','0x2a46':'0x2c20'}
rows=[];bodies=[]
for index,(image,ranges) in enumerate(zip(images,[[(0x2428,0x24ac),(0x24be,0x24e3)],[(0x24b2,0x2548),(0x255a,0x257f)]])):
 ops=[]
 for start,end in ranges:
  chunk=list(d.disasm(image[0x198d0+start:0x198d0+end],start));assert sum(i.size for i in chunk)==end-start
  ops.extend(i for i in chunk if i.mnemonic!='nop' and not(index and 0x24b8<=i.address<0x24ca))
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic in ('call','lcall') and not index:assert operand in calls;operand=calls[operand]
  elif i.mnemonic.startswith('j') and operand.startswith('0x'):assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=operand.replace('0x24ac','0x2548')
  row.append((i.mnemonic,operand))
 rows.append(row);bodies.append(ops)
assert rows[0]==rows[1],[(x,y) for x,y in zip(*rows) if x!=y]
mapping={x.address:y.address for x,y in zip(*bodies)}
tables=[struct.unpack('<9H',image[0x198d0+at:0x198d0+at+18]) for image,at in zip(images,[0x24ac,0x2548])]
assert all(mapping[x]==y for x,y in zip(*tables))
prefix=[(i.mnemonic,i.op_str) for i in d.disasm(images[1][0x198d0+0x24b8:0x198d0+0x24ca],0x24b8)]
assert prefix==[('mov','ax, 1'),('push','ax'),('push','word ptr [bp + 8]'),('mov','ax, 0x3428'),('push','ax'),('push','cs'),('call','0x12ac'),('add','sp, 6')]
print(json.dumps({'pairedInstructions':len(rows[0]),'dispatchTableEntries':9,'onlyStructuralAddition':'18-byte diagnostic basename prefix','nestedLoaderAndRetryBodiesAccepted':False,'pass':True}))
