"""Both actual half-size blocks in both original model-projection routines."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
r=random.Random(19910225);values=[-32768,-32767,-3,-2,-1,0,1,2,3,32766,32767]+[r.randrange(-32768,32768)for _ in range(117)]
rows=[]
for engine,path,blocks in [('ms-1990',a.legacy,[(0x16d84,0x16da8),(0x16fae,0x16fd2)]),('ms-1991',a.modern,[(0x175b2,0x175be),(0x177c4,0x177d0)])]:
 image=path.read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
 for start,end in blocks:
  expected_prefix=bytes.fromhex('b90200')if engine=='ms-1990'else bytes.fromhex('d1be')
  assert image[start:start+len(expected_prefix)]==expected_prefix
  for index,value in enumerate(values):
   point=[value,values[(index+1)%len(values)],values[(index+2)%len(values)]]
   u.mem_write(0x60000,bytes(65536));u.mem_write(0x60000+0xe000-0x458,struct.pack('<3h',*point))
   for reg,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xe000),(UC_X86_REG_SP,0xd000)]:u.reg_write(reg,v)
   u.emu_start(start,end,count=100);assert u.reg_read(UC_X86_REG_IP)==end-0x10000
   after=list(struct.unpack('<3h',bytes(u.mem_read(0x60000+0xe000-0x458,6))))
   rows.append({'engine':engine,'start':hex(start),'before':point,'after':after})
 assert path.read_bytes()==image
print(json.dumps(rows))
