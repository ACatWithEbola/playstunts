"""Original local body-point preparation, before matrix transform/selection."""
import argparse,sys,struct,random,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
images=[a.legacy.read_bytes(),a.modern.read_bytes()];machines=[]
for image in images:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);machines.append(m)
r=random.Random(19910225)
for case in range(1024):
 wheel=case%4;height=r.randrange(-32768,32768);point=[r.randrange(-32768,32768) for _ in range(3)]
 for index,m in enumerate(machines):
  m.mem_write(0x60000,bytes(65536));m.mem_write(0x68008,struct.pack('<H',0x1000))
  m.mem_write(0x68000-(0xe6 if index==0 else 0xe8),bytes([wheel]))
  m.mem_write(0x610ca,struct.pack('<h',height));m.mem_write(0x610d2+6*wheel,struct.pack('<3h',*point))
  for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0x8000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0x1357),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(0x8a35 if index==0 else 0x8a02,0x8a63 if index==0 else 0x8a31,count=100)
  local=0x68000-(0x1c4 if index==0 else 0x1c6)
  assert bytes(m.mem_read(local,6))==struct.pack('<HHH',point[0]&65535,(height<<6)&65535,point[2]&65535)
  assert m.reg_read(UC_X86_REG_BX)==0x1000 and m.reg_read(UC_X86_REG_SI)==0x1357
  assert m.reg_read(UC_X86_REG_SP)==0xf000
  if index:assert m.reg_read(UC_X86_REG_DI)==wheel*6
assert [a.legacy.read_bytes(),a.modern.read_bytes()]==images
print('1024 paired local body-point preparations pass; allfour wheel slots; signedheight/coordinates; modern retains6*wheel in DI; BX/SI/SP preserved')
print('Hashes:',*[hashlib.sha256(b[s:e]).hexdigest() for b,s,e in zip(images,[0x8a35,0x8a02],[0x8a63,0x8a31])])
