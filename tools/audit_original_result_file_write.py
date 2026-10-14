"""Complete DOS write wrapper comparison; no file or interrupt execution."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);results=[];messages=[]
for index,(path,base,start,data_base,message) in enumerate([(a.legacy,0x209e0,0x3961,0x32090,0x4bb4),(a.modern,0x20e50,0x3ae7,0x32a90,0x4c92)]):
 image=path.read_bytes();ops=list(d.disasm(image[base+start:base+start+163],start));assert sum(op.size for op in ops)==163 and ops[-1].mnemonic=='retf'
 anchors={op.address:i for i,op in enumerate(ops)};rows=[]
 for op in ops:
  operand=op.op_str
  if op.mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  elif op.mnemonic=='lcall':assert operand==('0x209e, 0xe' if index==0 else '0x20e5, 6');operand='fatal-message-callback'
  elif operand==f'ax, {hex(message)}':operand='ax, byte-identical-write-error-message'
  else:assert op.mnemonic!='call'
  rows.append((op.mnemonic,operand))
 results.append(rows);messages.append(image[data_base+message:data_base+message+256].split(b'\0')[0])
assert results[0]==results[1],'DOS write body has unclassified difference'
assert messages[0]==messages[1],'Write error message changed'
print(json.dumps({'completeWriteWrapperBytes':163,'instructions':len(results[0]),'DOSRequestsAndBranchesEquivalent':True,'errorMessageIdentical':True,'fatalPresentationVerified':False,'noFileAccess':True}))
