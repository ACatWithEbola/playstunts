"""Modern original four-wheel reposition loop and real arithmetic helpers."""
import argparse,sys,struct,json,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);image=a.image.read_bytes();m.mem_write(0,image);r=random.Random(19910225);rows=[]
for case in range(512):
 origins=[[r.randrange(-1000000,1000001) for _ in range(3)] for _ in range(4)]
 proposed=[[n+r.randrange(-2000,2001) for n in point] for point in origins]
 scaled=r.randrange(1,6001);approach=0 if case%7==0 else r.randrange(-1000,1001);offset=[r.randrange(-32768,32768) for _ in range(3)]
 m.mem_write(0x60000,bytes(65536));m.mem_write(0x68000-0x1c0,struct.pack('<12i',*[n for v in proposed for n in v]));m.mem_write(0x68000-0x176,struct.pack('<12i',*[n for v in origins for n in v]))
 for at,value in [(-0xe6,scaled),(-0xf4,approach),(-0x1c,offset[0]),(-0x1a,offset[1]),(-0x18,offset[2])]:m.mem_write(0x68000+at,struct.pack('<h',value))
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x8000)]:m.reg_write(reg,value)
 m.emu_start(0x7c65,0x788c,count=10000);assert m.reg_read(UC_X86_REG_IP)==0x788c
 values=struct.unpack('<12i',bytes(m.mem_read(0x68000-0x1c0,48)))
 rows.append(dict(origins=origins,proposed=proposed,scaled=scaled,approach=approach,offset=offset,result=[list(values[i*3:i*3+3]) for i in range(4)]))
assert a.image.read_bytes()==image
with a.output.open('x') as f:json.dump(rows,f)
print('512 original modern four-wheel reposition loops captured using real long multiply/divide helpers; image unchanged')
