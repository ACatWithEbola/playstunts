"""Original rolled-region/clear planning. Driver calls are observed, not drawn."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image);r=random.Random(19910225);rows=[]
active=None;clears=[]
def hook(uc,address,size,user):
 global active
 if address not in [0x25efb,0x25f64]:return
 sp=uc.reg_read(UC_X86_REG_SP);words=struct.unpack('<6H',bytes(uc.mem_read(0x60000+sp,12)))
 if address==0x25efb:active=list(struct.unpack('<4h',bytes(uc.mem_read(0x60000+sp+4,8))))
 else:clears.append(dict(color=words[2],rectangle=active[:]))
 uc.reg_write(UC_X86_REG_SP,(sp+4)&65535);uc.reg_write(UC_X86_REG_CS,words[1]);uc.reg_write(UC_X86_REG_IP,words[0])
u.hook_add(UC_HOOK_CODE,hook)
for index in range(200):
 data=bytearray(65536);banks=[];alignment=[1,2,4,8][index%4]
 for bank in [0xa250,0x9710]:
  rects=[]
  for n in range(15):
   x=r.randrange(300);y=r.randrange(180);rect=[x,x+r.randrange(1,40),y,y+r.randrange(1,40)];rects.append(rect);struct.pack_into('<4h',data,bank+n*8,*rect)
  banks.append(rects)
 base=r.randrange(70,100);delta=r.randrange(-20,21);height=r.randrange(20,41);full=index%3==0;data[0xa1ac]=int(full)
 for at,value in [(0x9a,0xa250),(0x9ad0,alignment),(0xa1d8,(-alignment)&65535),(0xa1d2,height),(0xa2d4,1),(0x9796,2),(0xf008,0x800),(0xf000-0x32,base),(0xf000-0x26,delta&65535)]:struct.pack_into('<H',data,at,value)
 clip=[0,320,10,130];struct.pack_into('<4h',data,0x800,*clip);u.mem_write(0x60000,bytes(data));clears=[];active=None
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
 u.emu_start(0xea54,0xebce,count=1000000);assert u.reg_read(UC_X86_REG_IP)==0xebce
 after=bytes(u.mem_read(0x60000,65536));rows.append(dict(previous=banks[0],working=banks[1],clip=clip,base=base,delta=delta,height=height,full=full,alignment=alignment,sky=list(struct.unpack_from('<4h',after,0x9738)),clearSky=[c['rectangle'] for c in clears if c['color']==1],clearGround=[c['rectangle'] for c in clears if c['color']==2]))
print(json.dumps(rows))
