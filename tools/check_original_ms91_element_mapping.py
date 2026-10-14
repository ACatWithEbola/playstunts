"""Exhaustive isolated original helper check; no live data writes."""
import argparse,sys,struct,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
b=a.image.read_bytes();base=0x105c0;start=0x38c2;end=0x39e1
assert b[base+start:base+start+6]==bytes.fromhex('558bec8a4606')
ops=list(Cs(CS_ARCH_X86,CS_MODE_16).disasm(b[base+start:base+end],start))
assert sum(i.size for i in ops)==end-start
boundaries={i.address for i in ops}
for i in ops:
 assert i.mnemonic not in ('call','lcall','int')
 if i.mnemonic.startswith('j'):assert int(i.op_str,16) in boundaries
groups={7:[(4,182),(14,186),(24,190),(39,194),(59,194),(98,194)],8:[(5,183),(15,187),(25,191),(36,195),(56,195),(95,195)],9:[(4,184),(14,188),(24,192),(38,196),(58,196),(97,196)],10:[(5,185),(15,189),(25,193),(37,197),(57,197),(96,197)]}
mapping={k:dict(v) for k,v in groups.items()}
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,b)
checked=0;nonzero={}
for kind in range(256):
 for element in range(256):
  m.mem_write(0x7f000,struct.pack('<4H',0x1000,0,kind,element))
  for reg,value in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(base+start,0x1000,count=1000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004
  result=m.reg_read(UC_X86_REG_AX);expected=mapping.get(kind,{}).get(element,0)
  assert result==expected,(kind,element,result,expected)
  if result:nonzero[f'{kind}:{element}']=result
  checked+=1
assert a.image.read_bytes()==b
print(json.dumps({'checked':checked,'nonzero':nonzero,'pass':True,'sourceUnchanged':True,'helperBytes':end-start,'sha256':hashlib.sha256(b[base+start:base+end]).hexdigest()}))
