"""Execute complete original callback registration; no hardware or service doubles."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[]
for engine,path,cs,entry,table in [('ms-1990',a.legacy,0x209e,0x1884,0x4092),('ms-1991',a.modern,0x20e5,0x1886,0x4140)]:
 image=path.read_bytes()
 for occupied in range(5):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  before=bytearray([0xaa]*24)
  for index in range(occupied):struct.pack_into('<2H',before,index*4,0x1111+index,0x2222+index)
  struct.pack_into('<H',before,occupied*4+2,0)
  m.mem_write(0x60000+table,bytes(before));m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,0x1234,0x5678))
  for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(cs*16+entry,0x1000,count=1000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
  expected=before[:];struct.pack_into('<2H',expected,occupied*4,0x1234,0x5678);struct.pack_into('<H',expected,occupied*4+6,0)
  after=bytes(m.mem_read(0x60000+table,24));assert after==expected
  rows.append({'engine':engine,'occupied':occupied,'before':list(before),'after':list(after)})
 assert path.read_bytes()==image
with a.output.open('x') as f:json.dump(rows,f)
print('Ten original callback registrations match first-empty-slot and next-segment clearing; no service doubles or hardware')
