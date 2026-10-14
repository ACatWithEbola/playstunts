"""Original forward/full sky rectangle blocks, memory-only oracle."""
import json,random,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes();u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
r=random.Random(19910225);rows=[]
for kind,start,end in [('forward',0xee18,0xee42),('full',0xedc6,0xede1),('rolled',0xea54,0xeab8)]:
 for index in range(500):
    data=bytearray(r.randbytes(65536));horizon=r.randint(-32768,32767);height=r.randrange(65536);detail=index%5;clip=[r.randint(-32768,32767) for _ in range(4)]
    delta=r.randint(-32768,32767);full=index%2;data[0xa1ac]=full
    data[0x192]=detail;struct.pack_into('<H',data,0xa1d2,height);struct.pack_into('<h',data,0xe000-0x50,horizon);struct.pack_into('<h',data,0xe000-0x32,horizon);struct.pack_into('<h',data,0xe000-0x26,delta);struct.pack_into('<H',data,0xe008,0x1000);struct.pack_into('<4h',data,0x1000,*clip)
    before=bytes(data);u.mem_write(0x60000,before)
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xe000),(UC_X86_REG_SP,0xd000),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
    stop=0xebce if kind=='rolled' and full else end
    u.emu_start(start,stop,count=100);assert u.reg_read(UC_X86_REG_IP)==stop
    after=bytes(u.mem_read(0x60000,65536));assert all(before[i]==after[i] for i in range(65536) if not (0x9738<=i<0x9740 or kind=='rolled' and 0xe000-0x30<=i<0xe000-0x2c))
    rows.append(dict(kind=kind,horizon=horizon,height=height,detail=detail,clip=clip,delta=delta,full=full,rectangle=list(struct.unpack_from('<4h',after,0x9738))))
print(json.dumps(rows))
