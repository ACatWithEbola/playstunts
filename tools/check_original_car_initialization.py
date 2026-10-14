"""Both complete car initializers on isolated retained-state/tuning inputs."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('cars',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from extract import resources
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[];sources={path:path.read_bytes() for path in a.cars.glob('CAR*.RES')};assert len(sources)==11
for engine,image_path,start,size in [('ms-1990',a.legacy,0x8f7c,184),('ms-1991',a.modern,0x8f4a,208)]:
 image=image_path.read_bytes()
 for path,source in sorted(sources.items()):
  tuning=resources(source)['simd'];assert len(tuning)==776
  for transmission,position,heading in itertools.product([0,1],[(690432,0,805760),(-65,-1,65),(1966016,28800,512)],[0,256,512,768]):
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
   m.mem_write(0x62000,bytes([0x7d])*size);m.mem_write(0x6b800,tuning)
   m.mem_write(0x6f000,struct.pack('<5H3iH',0x1000,0,0x2000,0xb800,transmission,*position,heading))
   for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
   m.emu_start(start,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
   rows.append({'engine':engine,'car':path.stem[3:],'transmission':transmission,'position':position,'heading':heading,'output':bytes(m.mem_read(0x62000,size)).hex()})
 assert image_path.read_bytes()==image
assert all(path.read_bytes()==source for path,source in sources.items())
print(json.dumps({'cases':rows,'tunings':{path.stem[3:]:resources(source)['simd'].hex() for path,source in sources.items()},'sourcesUnchanged':True}))
