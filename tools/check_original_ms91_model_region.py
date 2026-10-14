"""Bounded original model descriptor region-routing oracle."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
r=random.Random(19910225);rows=[]
for kind,start,end,visibility,local in [('first',0xdd6e,0xddb4,0x93bb,0x6a),('second',0xe01a,0xe062,0x948b,0x8e)]:
 for index in range(100):
    data=bytearray(r.randbytes(65536));enabled=[0,1,2,65535][index%4];visible=index%3;descriptor=0x1000
    struct.pack_into('<H',data,0x9690,enabled);struct.pack_into('<H',data,0xb138,descriptor);data[visibility]=visible;before=bytes(data)
    u.mem_write(0x60000,before)
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_ES,0x7000),(UC_X86_REG_SP,0xd000),(UC_X86_REG_BP,0xe000),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
    u.emu_start(start,end,count=1000);assert u.reg_read(UC_X86_REG_IP)==end
    after=bytes(u.mem_read(0x60000,65536));allowed=lambda i:i in [descriptor+8,descriptor+9,descriptor+18] or 0xe000-local<=i<0xe000-local+8 or 0xcffa<=i<0xd000
    unexpected=[hex(i) for i in range(65536) if not allowed(i) and before[i]!=after[i]]
    assert not unexpected,(kind,index,unexpected)
    rows.append(dict(kind=kind,enabled=enabled,visibility=visible,empty=before[0x339a:0x33a2].hex(),descriptor=before[descriptor:descriptor+20].hex(),after=after[descriptor:descriptor+20].hex(),local=after[0xe000-local:0xe000-local+8].hex()))
print(json.dumps(rows))
