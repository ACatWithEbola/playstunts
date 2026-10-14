"""Original MS91 combined region selection, clip, merge and order oracle."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
r=random.Random(19910225);rows=[]
def run(at,data,args):
    struct.pack_into('<'+'H'*(2+len(args)),data,0xe000,0xf000,0x1000,*args);u.mem_write(0x60000,bytes(data))
    for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_BP,0xf100),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
    u.emu_start(at,0x1f000,count=1000000);assert u.reg_read(UC_X86_REG_IP)==0xf000
    return bytearray(u.mem_read(0x60000,65536))
for index in range(200):
    alignment=[1,2,4,8][index%4];data=bytearray(65536);struct.pack_into('<H',data,0x9ad0,alignment);struct.pack_into('<H',data,0xa1d8,(-alignment)&65535)
    flags=[r.randrange(4) for _ in range(15)];data[0x800:0x80f]=bytes(flags);banks=[]
    for bank in [0x1000,0x1100]:
        rects=[]
        for n in range(15):
            x=r.randint(-40,320);y=r.randint(-40,200);rect=[x,x+r.randint(-5,100),y,y+r.randint(1,80)];rects.append(rect);struct.pack_into('<4h',data,bank+n*8,*rect)
        banks.append(rects)
    clip=[index%7,320-index%9,0,200];struct.pack_into('<4h',data,0x900,*clip)
    after=run(0x18e7a,data,[15,0x800,0x1000,0x1100,0x900,0x850,0x2000]);count=after[0x850];assert count<=45
    assert after[0x800:0x80f]==data[0x800:0x80f] and after[0x1000:0x1178]==data[0x1000:0x1178]
    output=[list(struct.unpack_from('<4h',after,0x2000+n*8)) for n in range(count)]
    ordered=run(0x18f72,after,[count,0x2000,0x3000]);order=list(struct.unpack_from('<'+'H'*max(1,count),ordered,0x3000))
    rows.append(dict(flags=flags,current=banks[0],retained=banks[1],clip=clip,rectangles=output,order=order,alignment=alignment))
print(json.dumps(rows))
