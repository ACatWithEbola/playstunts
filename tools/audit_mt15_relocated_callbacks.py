"""Compare bounded original MT15 callbacks, resolving relocated branch targets."""
import argparse,hashlib,sys,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
paths=[a.legacy,a.modern];hashes=[hashlib.sha256(x.read_bytes()).hexdigest() for x in paths];drivers=[]
for path in paths:
 with zipfile.ZipFile(path) as z:drivers.append(z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='MT15.DRV')))
blocks=[('initialize',(0x3d0,0x3f3),(0x400,0x423)),('silence',(0x3f8,0x421),(0x428,0x451)),('voice-update',(0x584,0x667),(0x5d7,0x6ba)),('command-transport',(0x191,0x1d8),(0x1c7,0x20e)),('read-transport',(0x1d8,0x1fd),(0x20e,0x233)),('write-transport',(0x1fd,0x248),(0x233,0x27e)),('parameter-transport',(0x248,0x27c),(0x27e,0x2b2))]
maps=[{0x191:'command',0x1fd:'data',0x27c:'sysex',0x3f8:'silence'},{0x1c7:'command',0x233:'data',0x2b2:'sysex',0x428:'silence'}]
for name,*ranges in blocks:
 normalized=[]
 for index,(start,end) in enumerate(ranges):
  rows=[];covered=0
  for ins in Cs(CS_ARCH_X86,CS_MODE_16).disasm(drivers[index][start:end],start):
   operand=ins.op_str
   if ins.mnemonic=='call' or ins.mnemonic.startswith('j'):
    target=int(operand,16)
    operand=maps[index].get(target,f'local:{target-start}')
   rows.append((ins.address-start,ins.mnemonic,operand))
   covered+=ins.size
  assert covered==end-start,'Incomplete decode '+name
  assert rows and rows[-1][1] in ['retf','ret','jmp'];normalized.append(rows)
 assert normalized[0]==normalized[1],name
 print(name,len(normalized[0]),'instructions match with explicit relocation mapping')
assert hashes==[hashlib.sha256(x.read_bytes()).hexdigest() for x in paths]
print('Seven bounded MT15 callbacks/transport helpers match; other entries and runtime timing not covered; archives unchanged')
