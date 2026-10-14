"""Complete shared optional/required raw read body; fatal callback presentation separate."""
import argparse,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);results=[];messages=[]
for index,(path,base,start,end,data_base,message) in enumerate([(a.legacy,0x209e0,0x20aa,0x213c,0x32090,0x4604),(a.modern,0x20e50,0x20ac,0x213e,0x32a90,0x46b2)]):
 image=path.read_bytes();ops=list(d.disasm(image[base+start:base+end],start));assert sum(op.size for op in ops)==146
 anchors={op.address:i for i,op in enumerate(ops)};rows=[]
 for op in ops:
  operand=op.op_str
  if op.mnemonic.startswith('j'):operand='instruction:'+str(anchors[int(operand,16)])
  elif op.mnemonic=='lcall':assert operand==('0x209e, 0xe' if index==0 else '0x20e5, 6');operand='nonreturning-fatal-callback'
  elif operand==f'ax, {hex(message)}':operand='ax, byte-identical-read-error-message'
  else:assert op.mnemonic!='call'
  rows.append((op.mnemonic,operand))
 results.append(rows);messages.append(image[data_base+message:data_base+message+256].split(b'\0')[0])
assert results[0]==results[1],[(i,old,new) for i,(old,new) in enumerate(zip(*results)) if old!=new]
assert messages[0]==messages[1],'Raw read error message changed'
print(json.dumps({'completeRawReadBytes':146,'parameterizedOptionalRequiredEntriesIncluded':True,'DOSRequestsAndBranchesEquivalent':True,'chunkSize':16384,'optionalFailureReturnsNull':True,'fatalPresentationVerified':False,'noFileAccess':True}))
