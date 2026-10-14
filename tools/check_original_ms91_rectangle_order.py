"""Original MS91 rectangle ordering, silent memory-only oracle."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
r=random.Random(19910225);rows=[]
for index in range(200):
    count=index%46;data=bytearray(65536);rects=[]
    for n in range(count):
        top=r.choice([-32768,-100,0,0,100,32767]);rect=[0,320,top,100];rects.append(rect);struct.pack_into('<4h',data,0x1000+n*8,*rect)
    struct.pack_into('<5H',data,0xe000,0xf000,0x1000,count,0x1000,0x2000)
    u.mem_write(0x60000,bytes(data))
    for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_BP,0xf100),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
    u.emu_start(0x18f72,0x1f000,count=100000);assert u.reg_read(UC_X86_REG_IP)==0xf000
    after=bytes(u.mem_read(0x60000,65536));assert data[0x1000:0x1000+count*8]==after[0x1000:0x1000+count*8]
    order=list(struct.unpack_from('<'+'H'*max(1,count),after,0x2000));rows.append(dict(rects=rects,order=order))
print(json.dumps(rows))
