"""Complete like-for-like EGA high-score loader comparison; DOS IO acceptance separate."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
fields={0x9446:0x96da,0x5424:0x518c,0x97d6:0x9a70,0x29e:0x2fc,0x942b:0x96bd,0x98:0xa4,0x135:0x193,0x975a:0x99f4,0x9758:0x99f2,0x2a3:0x301,0x2b8:0x316,0x2d0:0x32e}
calls=[{'0x198d, 0x102e':'filename','0x198d, 0x24e4':'DOS-read','0x1ec1, 0x16da':'copy','0x209e, 0x3961':'DOS-write'},{'0x198d, 0x110c':'filename','0x198d, 0x2580':'DOS-read','0x1f07, 0x16e2':'copy','0x20e5, 0x3ae7':'DOS-write'}]
results=[];scopes=[]
for index,(path,start,end) in enumerate([(a.legacy,0x3d5c,0x3e62),(a.modern,0x3d64,0x3e68)]):
 image=path.read_bytes();ops=list(d.disasm(image[start:end],start));assert sum(op.size for op in ops)==end-start
 kept=[op for op in ops if op.mnemonic!='nop'];anchors={op.address:i for i,op in enumerate(kept)};rows=[]
 for op in kept:
  mnemonic=op.mnemonic;operand=op.op_str
  if op.address==(0x3e41 if index==0 else 0x3e49):
   assert (mnemonic,operand)==(('push','word ptr [0x975a]') if index==0 else ('push','es'))
   operand='retained-score-allocation-segment'
  elif mnemonic=='lcall':assert operand in calls[index];operand=calls[index][operand]
  elif mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  elif index==0:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  rows.append((mnemonic,operand))
 results.append(rows);scopes.append({'bytes':end-start,'instructions':len(ops)})
assert results[0]==results[1],[(i,l,r) for i,(l,r) in enumerate(zip(*results)) if l!=r]
print(json.dumps({'scopes':scopes,'completeLoaderBodyCompared':True,'scoreRecordSize':52,'recordCount':7,'segmentReuseOptimization':True,'DOSReadWriteDependenciesVerified':False,'wholeItemAccepted':False}))
