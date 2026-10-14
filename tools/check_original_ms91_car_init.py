"""Original complete car initializer outputs; read-only isolated memory."""
import argparse,sys,struct,json,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('cars',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from extract import resources
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
b=a.image.read_bytes();assert b[0x8f4a:0x8f50]==bytes.fromhex('558bec83ec0e')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,b);r=random.Random(19910225);rows=[]
cars=sorted(a.cars.glob('CAR*.RES'));assert len(cars)==11
for car in cars:
 tuning=resources(car.read_bytes())['simd']
 for heading in [0,256,512,768]:
  before=bytes(r.randrange(256) for _ in range(208));position=[r.randrange(-2000000,2000001) for _ in range(3)];transmission=r.randrange(2)
  m.mem_write(0x60000,bytes(65536));m.mem_write(0x61000,before);m.mem_write(0x62000,tuning)
  m.mem_write(0x6f000,struct.pack('<5H3iH',0x1000,0,0x1000,0x2000,transmission,*position,heading))
  for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
  m.emu_start(0x8f4a,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  rows.append(dict(car=car.name,before=before.hex(),after=bytes(m.mem_read(0x61000,208)).hex(),tuning=tuning.hex(),position=position,heading=heading,transmission=transmission))
print(json.dumps(rows))
