"""Original MS91 line/circle/wheel/point dirty bounds after projection."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,Path(sys.argv[1]).read_bytes());r=random.Random(19910225);rows=[]
for kind,start,end in [('line',0x17d86,0x17dab),('circle',0x180b0,0x17dab),('wheel',0x17f12,0x17fc4),('point',0x18146,0x1815c)]:
 for flags in range(256):
  data=bytearray(65536);before=[r.randrange(-400,401) for _ in range(4)];radius=r.randrange(101)
  x,y=r.randrange(-200,401),r.randrange(-200,401);points=[[x,y],[x+radius,y],[x,y+radius],[r.randrange(-200,401),r.randrange(-200,401)]]
  if flags%16 in [0,8]:points[0]=[32767,-32768]
  struct.pack_into('<4h',data,0x1000,*before);struct.pack_into('<HH',data,0x5be0,0x1000,0x7000);struct.pack_into('<H',data,0x658e,0x1000);data[0x6584]=flags
  struct.pack_into('<HH',data,0x656a,0x2000,0x2010);struct.pack_into('<2h',data,0x2000,*points[0]);struct.pack_into('<2h',data,0x2010,*points[3]);struct.pack_into('<H',data,0xf000-0x462,radius)
  u.mem_write(0x60000,bytes(data));u.mem_write(0x71006,struct.pack('<8h',*(max(-32768,min(32767,n)) for p in points for n in p)))
  for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x7000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_SI,radius),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
  u.emu_start(start,end,count=1000);assert u.reg_read(UC_X86_REG_IP)==end-0x10000,(kind,flags,hex(u.reg_read(UC_X86_REG_IP)))
  after=bytes(u.mem_read(0x60000,65536));assert all(data[i]==after[i] for i in range(65536) if not(0x1000<=i<0x1008 or 0xd000<=i<0xf000)),'Unexpected persistent write'
  rows.append(dict(kind=kind,flags=flags,points=points,radius=radius,before=before,after=list(struct.unpack_from('<4h',after,0x1000))))
print(json.dumps(rows))
