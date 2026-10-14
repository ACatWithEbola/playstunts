"""Complete clipped/unclipped rectangle code, excluding following data banks."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
fields={at:at+0x188 for at in [0x9114,0x911c,0x911e,0x9120,0x9122,0x9124,0x9126]}
fields.update({0x5322:0x5516,0x532a:0x551e,0x6eec:0x6d64})
rows=[];branches=0
for index,(image,base,start,end) in enumerate([(images[0],0x209e0,0x589e,0x5b73),(images[1],0x20e50,0x5a26,0x5cfb)]):
 ops=list(d.disasm(image[base+start:base+end],start));assert sum(i.size for i in ops)==end-start==725 and ops[-1].mnemonic=='jmp'
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  assert i.mnemonic not in ('call','lcall','ljmp','int')
  operand=i.op_str
  if i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)]);branches+=int(not index)
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row)
assert rows[0]==rows[1],[(n,x,y) for n,(x,y) in enumerate(zip(*rows)) if x!=y][:10]
assert images[0][0x32090+0x5322:0x32090+0x5332]==images[1][0x32a90+0x5516:0x32a90+0x5526]
print(json.dumps({'codeBytesPerVersion':725,'instructionsPerVersion':len(rows[0]),'directBranchesMatched':branches,
 'bothEntryPointsCovered':True,'colourMaskBytesMatched':16,'noTransitiveCalls':True,
 'completeCodeBodiesMatch':True,'hardwareExecutionAccepted':False,'wholeItemAccepted':False}))
