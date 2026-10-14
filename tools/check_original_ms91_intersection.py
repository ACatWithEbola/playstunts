"""Read-only original MS91 plane-crossing intersection oracle."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP
image=a.image.read_bytes();prefix=bytes.fromhex('558bec83ec0456578b460c8b76068b5e08')
assert image[0x25440:0x25440+len(prefix)]==prefix
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(19910225);rows=[]
for case in range(1000):
    first=[r.randrange(-32768,32768),r.randrange(-32768,32768),r.randrange(1,32768)]
    second=[r.randrange(-32768,32768),r.randrange(-32768,32768),r.randrange(-32768,0)]
    m.mem_write(0x60000,bytes(65536));m.mem_write(0x61000,struct.pack('<3h',*first));m.mem_write(0x61100,struct.pack('<3h',*second));m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0x1000,0x1100,0x1200,0))
    for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    m.emu_start(0x25440,0x1000,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xf004
    rows.append({'first':first,'second':second,'result':list(struct.unpack('<3h',bytes(m.mem_read(0x61200,6))))})
with a.output.open('x') as f:json.dump(rows,f)
print('Generated 1000 original MS91 ordered crossing intersections')
