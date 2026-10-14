"""Bounded original executable clipping oracle. Does not change source assets."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes()
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
r=random.Random(19910225);rows=[]
for index in range(1000):
    data=bytearray(65536);rect=0x100;clip=[0x200,0x100,0x102,0x104,0x106][index%5]
    for at in range(0x100,0x208,2):struct.pack_into('<h',data,at,r.randint(-32768,32767))
    if index%3==0:
        struct.pack_into('<4h',data,rect,-100,100,-100,100)
        if clip==0x200:struct.pack_into('<4h',data,clip,-50,50,-50,50)
    before=bytes(data)
    # Far return sentinel then cdecl arguments, DS=SS for the original code.
    struct.pack_into('<4H',data,0xe000,0xf000,0x1000,rect,clip)
    u.mem_write(0x60000,bytes(data))
    for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_BP,0xf100)]:u.reg_write(reg,value)
    u.emu_start(0x18a14,0x1f000,count=1000)
    assert u.reg_read(UC_X86_REG_IP)==0xf000,'Original clipping did not return'
    after=bytes(u.mem_read(0x60000,65536))
    assert all(before[i]==after[i] for i in range(65536) if not(rect<=i<rect+8 or 0xdff0<=i<0xe008))
    rows.append(dict(rect=rect,clip=clip,before=before[0x100:0x208].hex(),after=after[rect:rect+8].hex(),rejected=u.reg_read(UC_X86_REG_AX)&255))
print(json.dumps(rows))
