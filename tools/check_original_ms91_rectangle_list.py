"""Original MS91 repaint-list insertion oracle, entirely in emulator memory."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes()
assert image[0x18a98:0x18a9b]==bytes.fromhex('558bec')
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
r=random.Random(19910225);rows=[]
for index in range(200):
    alignment=[1,2,4,8][index%4];data=bytearray(65536);struct.pack_into('<HH',data,0x9ad0,alignment,0);struct.pack_into('<H',data,0xa1d8,(-alignment)&65535)
    initial=[]
    # Disjoint initial rectangles, as required of an already merged list.
    for n in range(index%6):
        rect=[n*40,n*40+30,0,40];initial.append(rect);struct.pack_into('<4h',data,0x1000+n*8,*rect)
    data[0x800]=len(initial)
    x=r.randint(-20,220);y=r.randint(-20,60);incoming=[x,x+r.randint(1,80),y,y+r.randint(1,80)]
    struct.pack_into('<4h',data,0x900,*incoming)
    struct.pack_into('<5H',data,0xe000,0xf000,0x1000,0x800,0x1000,0x900)
    u.mem_write(0x60000,bytes(data))
    for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_BP,0xf100),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
    u.emu_start(0x18a98,0x1f000,count=100000)
    assert u.reg_read(UC_X86_REG_IP)==0xf000,'Original insertion did not return'
    after=bytes(u.mem_read(0x60000,65536));count=after[0x800];assert count<=45
    allowed=lambda i:i==0x800 or 0x902<=i<0x904 or 0x1000<=i<0x1000+45*8 or 0xd000<=i<0xe00a
    assert all(data[i]==after[i] for i in range(65536) if not allowed(i)),'Unexpected persistent write'
    output=[list(struct.unpack_from('<4h',after,0x1000+n*8)) for n in range(count)]
    rows.append(dict(initial=initial,incoming=incoming,output=output,alignment=alignment))
print(json.dumps(rows))
