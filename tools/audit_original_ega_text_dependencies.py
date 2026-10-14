"""Branch-closed helper bodies including out-of-line fatal paths; no execution."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()];results=[]
scopes=[
 (0x3a04,0x3b8a,40,{0x4bc4:0x4ca2,0x4bc5:0x4ca3,0x3a2c:0x3bb2},{'0x209e, 0x13f6':'0x20e5, 0x13f8'},'video-mode capture'),
 (0x4f58,0x50e0,52,{}, {},'retained drawing state'),
 (0x13f6,0x13f8,61,{0x3f26:0x3fd4,0x3f52:0x4000},{'0x209e, 0xe':'0x20e5, 6'},'exit callback registration'),
 (0xa870,0xa9f4,33,{0x5638:0x582c,0x563a:0x582e,0x3f48:0x3dbc,0x3f4a:0x3dbe},{'0x209e, 0xa852':'0x20e5, 0xa9d6'},'drawing page restore'),
 (0xc0d6,0xc262,294,{0x9a42:0x9bc6,0x3f4a:0x3dbe,0x3f48:0x3dbc,0xa852:0xa9d6,0x9a40:0x9bc4,0x563c:0x5830,0x3209:0x32a9,0x56fe:0x58f8,0x571e:0x5918,0x5713:0x590d},
  {'0x209e, 0xa870':'0x20e5, 0xa9f4','0x209e, 0xe':'0x20e5, 6'},'drawing page creation including fatal tails'),
]
for old,new,size,fields,calls,label in scopes:
 rows=[]
 for index,(image,base,start) in enumerate(zip(images,[0x209e0,0x20e50],[old,new])):
  ops=list(d.disasm(image[base+start:base+start+size],start));assert sum(i.size for i in ops)==size
  assert any(i.mnemonic=='retf' for i in ops);anchors={i.address:n for n,i in enumerate(ops)};row=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic=='lcall':
    if not index:assert operand in calls;operand=calls[operand]
   elif i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
   elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
   row.append((i.mnemonic,operand))
  rows.append(row)
 assert rows[0]==rows[1],(label,[(n,x,y) for n,(x,y) in enumerate(zip(*rows)) if x!=y])
 results.append({'helper':label,'bytesPerVersion':size,'instructions':len(rows[0]),'completeBodyMatches':True})
print(json.dumps({'helpers':results,'fatalPresentationAndBIOSExecutionAccepted':False,'wholeItemAccepted':False}))
