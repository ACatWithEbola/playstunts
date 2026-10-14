"""Exhaust every mouse X word through original selection arithmetic/helper."""
import argparse,sys,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes();assert image[0x14b79:0x14b7d]==bytes.fromhex('8b3e70ae')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[0x32a90:0x42a90])
result=bytearray()
for x in range(65536):
 m.mem_write(0x6ae70,struct.pack('<H',x))
 for reg,val in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
 m.emu_start(0x14b79,0x14ba6,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xe000
 result.append(m.mem_read(0x65a80,1)[0])
with a.output.open('xb') as out:out.write(result)
assert a.image.read_bytes()==image
print(json.dumps({'mouseWords':len(result),'sourceUnchanged':True}))
