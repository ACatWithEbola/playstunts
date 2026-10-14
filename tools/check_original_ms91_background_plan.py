"""Original EE76..EEFD flag preparation and combined background region list."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image);r=random.Random(19910225);rows=[]
for index in range(200):
 data=bytearray(65536);banks=[];alignment=[1,2,4,8][index%4]
 for bank in [0xa250,0x9710]:
  rects=[]
  for n in range(15):
   x=r.randrange(300);y=r.randrange(180);rect=[x,x+r.randrange(1,40),y,y+r.randrange(1,40)];rects.append(rect);struct.pack_into('<4h',data,bank+n*8,*rect)
  banks.append(rects)
 if index%3==0:banks[1][5]=banks[0][5][:];struct.pack_into('<4h',data,0x9738,*banks[1][5])
 previous=r.randrange(1024);heading=previous if index%2==0 else r.randrange(1024);last=heading if index%4==0 else previous;detail=index%5;data[0x192]=detail
 for at,value in [(0x9a,0xa250),(0x9708,previous),(0xb0da,last),(0x9ad0,alignment),(0xa1d8,(-alignment)&65535),(0xf006,0),(0xf008,0x800),(0xf010,heading)]:struct.pack_into('<H',data,at,value)
 clip=[0,320,0,200];struct.pack_into('<4h',data,0x800,*clip);u.mem_write(0x60000,bytes(data))
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
 u.emu_start(0xee76,0xeefd,count=1000000);assert u.reg_read(UC_X86_REG_IP)==0xeefd
 after=bytes(u.mem_read(0x60000,65536));count=after[0xae6a];assert count<=45
 rows.append(dict(previous=banks[0],working=banks[1],clip=clip,previousHeading=previous,heading=heading,last=last,detail=detail,alignment=alignment,rectangles=[list(struct.unpack_from('<4h',after,0x9ad6+n*8)) for n in range(count)]))
print(json.dumps(rows))
