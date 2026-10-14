"""Execute original formatter arithmetic only; string drawing is not emulated."""
import argparse, random, struct, sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--exhaustive',action='store_true');a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_SS,UC_X86_REG_BP,UC_X86_REG_SI,UC_X86_REG_DI,UC_X86_REG_AX
image=a.image.read_bytes()
assert image[0x1bc78:0x1bc87]==bytes.fromhex('b83c00f72edc968946ea8b46082bd2')
assert image[0x1bd18:0x1bd25]==bytes.fromhex('b86400998b0edc96f7f9f76608')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(19910225);values=range(65536) if a.exhaustive else [0,1,9,10,19,20,599,600,1199,1200,32767,32768,65535]+[r.randrange(65536) for _ in range(1000)]
for rate in [10,20]:
 for ticks in values:
  m.mem_write(0x60000,bytes(65536));m.mem_write(0x696dc,struct.pack('<H',rate));m.mem_write(0x6f008,struct.pack('<H',ticks))
  for reg,value in [(UC_X86_REG_CS,0x1700),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x1bc78,0x1bca7,count=100)
  minutes=m.reg_read(UC_X86_REG_SI)&65535;seconds=m.reg_read(UC_X86_REG_DI)&65535
  remainder=struct.unpack('<H',bytes(m.mem_read(0x6f008,2)))[0]
  assert remainder==ticks%rate,(ticks,rate,remainder)
  m.emu_start(0x1bd18,0x1bd25,count=100)
  fraction=m.reg_read(UC_X86_REG_AX)&65535
  assert (minutes,seconds,fraction)==(ticks//(60*rate),ticks//rate%60,ticks%rate*(100//rate)),(ticks,rate,minutes,seconds,fraction)
print(f'Original MS91 formatter arithmetic matches {len(values)*2} unsigned tick/rate cases; string rendering not covered')
