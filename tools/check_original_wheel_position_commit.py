"""Compare original three-axis wheel commits, without executing race handlers."""
import argparse, sys, struct, random, hashlib
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('legacy', type=Path);p.add_argument('modern', type=Path)
p.add_argument('--libraries', type=Path, required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16
from unicorn.x86_const import *
images=[a.legacy.read_bytes(),a.modern.read_bytes()]
machines=[]
for image in images:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);machines.append(m)
rng=random.Random(19910225)
for case in range(1024):
 wheel=case%4
 coords=[rng.randrange(-2147483648,2147483648) for _ in range(3)]
 if case<32:coords=[[-2147483648,-65,-64,-1,0,63,64,2147483647][case//4]]*3
 outputs=[]
 for index,m in enumerate(machines):
  m.mem_write(0x60000,bytes(65536))
  m.mem_write(0x68006,struct.pack('<H',0x1000))
  m.mem_write(0x68000-(0xe6 if index==0 else 0xe8),bytes([wheel]))
  m.mem_write(0x68000-(0xdc if index==0 else 0xde),struct.pack('<H',0x2000))
  m.mem_write(0x62000,struct.pack('<iii',*coords))
  for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x8000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(0x84e7 if index==0 else 0x84e3,0x8562 if index==0 else 0x853a,count=1000)
  outputs.append(bytes(m.mem_read(0x61074+wheel*6,6)))
 expected=struct.pack('<HHH',*[(v>>6)&65535 for v in coords])
 assert outputs==[expected,expected],(case,coords,outputs,expected)
assert [a.legacy.read_bytes(),a.modern.read_bytes()]==images
print('1024 paired original wheel commits passed: all four wheels, three signed32 axes, signed boundaries; source images unchanged')
print('Pinned blocks:',*[hashlib.sha256(image[s:e]).hexdigest() for image,s,e in zip(images,[0x84e7,0x84e3],[0x8562,0x853a])])
