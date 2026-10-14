"""Full like-for-like EGA text helper; hardware/service dependencies separate."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
fields={0x4dd2:0x4eb0,0x9114:0x929c,0x911c:0x92a4,0x9126:0x92ae,
 0x5334:0x5528,0xc0b8:0xc244,0xc0b6:0xc242}
calls={'0x209e, 0x3a04':'0x20e5, 0x3b8a','0x209e, 0x4f58':'0x20e5, 0x50e0',
 '0x209e, 0xc0d6':'0x20e5, 0xc262','0x209e, 0xa852':'0x20e5, 0xa9d6'}
rows=[];branches=0;interrupts=0
for index,(path,segment,start) in enumerate([(a.legacy,0x209e,0x5de6),(a.modern,0x20e5,0x5f6e)]):
 image=path.read_bytes();base=segment*16;ops=list(d.disasm(image[base+start:base+start+760],start))
 assert len(ops)==311 and sum(i.size for i in ops)==760
 anchors={i.address:n for n,i in enumerate(ops)};result=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='lcall':
   if not index:assert operand in calls;operand=calls[operand]
  elif i.mnemonic.startswith(('j','loop')):
   operand='instruction:'+str(anchors[int(operand,16)])
   if not index:branches+=1
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  if not index and i.mnemonic=='int':interrupts+=1
  result.append((i.mnemonic,operand))
 rows.append(result)
assert rows[0]==rows[1],[(n,x,y) for n,(x,y) in enumerate(zip(*rows)) if x!=y]
old=a.legacy.read_bytes();new=a.modern.read_bytes()
assert old[0x32090+0x5334:0x32090+0x5344]==new[0x32a90+0x5528:0x32a90+0x5538]
print(json.dumps({'bytesPerVersion':760,'instructionsPerVersion':311,
 'completeBodyCompared':True,'branchesMatched':branches,'mappedHelperCalls':len(calls),
 'biosInterruptsMatched':interrupts,'paletteBytesMatched':16,'noStructuralChange':True,
 'transitiveHardwareDependenciesAccepted':False,'wholeItemAccepted':False}))
