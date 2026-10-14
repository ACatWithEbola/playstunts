"""Original modern10/20Hz fall increments and signed height displacement."""
import argparse,sys,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);rows=[]
for rate in [10,20]:
 for wheel in range(4):
  for speed in [-32768,-32760,-1,0,1,100,32740,32760,32767]:
   for increment in [0,15,21]:
    m.mem_write(0x60000,bytes(65536));m.mem_write(0x68006,struct.pack('<H',0x1000));m.mem_write(0x67f18,bytes([wheel]));m.mem_write(0x67f22,struct.pack('<H',0x2000));m.mem_write(0x60608+wheel*2,struct.pack('<h',increment));m.mem_write(0x6104c+wheel*2,struct.pack('<h',speed));m.mem_write(0x696dc,struct.pack('<H',rate));m.mem_write(0x62004,struct.pack('<i',1000000))
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x8000)]:m.reg_write(reg,value)
    m.emu_start(0x7d8c,0x7dcc,count=100)
    rows.append(dict(rate=rate,wheel=wheel,speed=speed,increment=increment,fall=struct.unpack('<h',bytes(m.mem_read(0x6104c+wheel*2,2)))[0],height=struct.unpack('<i',bytes(m.mem_read(0x62004,4)))[0]))
assert a.image.read_bytes()==image
with a.output.open('x') as f:json.dump(rows,f)
print('216 original MS9110/20Hz fall-step cases captured across allwheel slots and signed boundaries')
