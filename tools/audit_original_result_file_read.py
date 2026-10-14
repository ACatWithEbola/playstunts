"""Complete read-wrapper dispatch comparison; diagnostic basename prefix separate."""
import argparse,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);results=[];scopes=[]
for index,(path,start,end) in enumerate([(a.legacy,0x24e4,0x254a),(a.modern,0x2580,0x25f8)]):
 image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+end],start));assert sum(op.size for op in ops)==end-start
 if index==1:
  prefix=[op for op in ops if 0x2586<=op.address<0x2598]
  assert [(op.mnemonic,op.op_str) for op in prefix]==[('mov','ax, 1'),('push','ax'),('push','word ptr [bp + 8]'),('mov','ax, 0x3428'),('push','ax'),('push','cs'),('call','0x12ac'),('add','sp, 6')]
 kept=[op for op in ops if op.mnemonic!='nop' and not(index==1 and 0x2586<=op.address<0x2598)]
 anchors={op.address:i for i,op in enumerate(kept)};rows=[]
 for op in kept:
  operand=op.op_str
  if op.mnemonic=='lcall':assert operand==('0x209e, 0x20ba' if index==0 else '0x20e5, 0x20bc');operand='raw-DOS-read'
  elif op.mnemonic=='call':assert operand==('0x2a46' if index==0 else '0x2c20');operand='retry-cancel-prompt'
  elif op.mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  rows.append((op.mnemonic,operand))
 results.append(rows);scopes.append({'bytes':end-start,'instructions':len(ops),'returns':sum(op.mnemonic=='retf' for op in ops)})
assert results[0]==results[1],'Read dispatch changed beyond basename diagnostic prefix'
print(json.dumps({'scopes':scopes,'completeReadDispatchCompared':True,'addedBasenamePrefixBytes':18,'rawReadAndPromptDependenciesVerified':False,'noFileAccess':True,'wholeItemAccepted':False}))
