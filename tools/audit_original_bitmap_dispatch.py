"""Bitmap dispatcher code/data partition; indirect callee acceptance separate."""
import argparse,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()];ops=[]
ranges=[(0x624d,0x6768),(0x67c8,0x7c1f)]
for index,image in enumerate(images):
 base=[0x209e0,0x20e50][index];delta=0x188*index;body=[]
 for start,end in ranges:
  part=list(d.disasm(image[base+start+delta:base+end+delta],start+delta));assert sum(i.size for i in part)==end-start;body+=part
 ops.append(body)
old_table=struct.unpack_from('<48H',images[0],0x209e0+0x6768);new_table=struct.unpack_from('<48H',images[1],0x20e50+0x68f0)
assert all(x+0x188==y for x,y in zip(old_table,new_table))
assert set(old_table)<={i.address for i in ops[0]} and set(new_table)<={i.address for i in ops[1]}
assert images[0][0x209e0+0x7c20:0x209e0+0x7c40]==images[1][0x20e50+0x7da8:0x20e50+0x7dc8]
assert images[0][0x209e0+0x7c1f]==images[1][0x20e50+0x7da7]==0
fields={at:at+0x188 for at in [0x6768,0x6788,0x9114,0x911c,0x911e,0x9120,0x9122,0x9124,0x9126,0x610c,0x611c,0x612c,0x6130,0x6134,0x613a,0x613c,0x6144,0x589e,0x7c20,0x7c30,0x7d09]}
fields.update({0x563a:0x582e,0x5638:0x582c,0x6eec:0x6d64,0xb220:0xb3a4,0xb286:0xb40a,0xb2ec:0xb470,0xbe56:0xbfe2,0xbedc:0xc068,0xbf62:0xc0ee,0x209e:0x20e5})
rows=[];branches=0;indirect=[]
for index,body in enumerate(ops):
 anchors={i.address:n for n,i in enumerate(body)};row=[]
 for i in body:
  operand=i.op_str
  if i.mnemonic.startswith(('j','loop')):
   if operand.startswith('word ptr'):
    if not index:indirect.append(hex(i.address))
   else:operand='instruction:'+str(anchors[int(operand,16)]);branches+=int(not index)
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row)
assert rows[0]==rows[1],[(n,x,y) for n,(x,y) in enumerate(zip(*rows)) if x!=y][:20]
print(json.dumps({'candidateSpanBytes':0x7c40-0x624d,'codeInstructionsPerVersion':len(ops[0]),
 'dispatchPointersMatched':48,'immutableMaskBytesMatched':32,'directBranchesMatched':branches,
 'indirectJumpSites':indirect,'externalTail':'209E:7D09 /20E5:7E91',
 'codeAndEmbeddedTablesMatch':True,'indirectCalleesAndExternalTailAccepted':False,'wholeItemAccepted':False}))
