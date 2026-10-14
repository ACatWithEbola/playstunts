"""Actual original sort-policy branch; no raster/hardware claim."""
import argparse,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[]
for engine,path,start,end,flags_at in [('ms-1990',a.legacy,0x179a6,0x179f1,0x638a),('ms-1991',a.modern,0x181ce,0x18219,0x6584)]:
 image=path.read_bytes();assert image[start:start+2]==bytes.fromhex('f606')
 u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
 for model in [0,1]:
  for primitive in range(256):
   u.mem_write(0x60000+flags_at,bytes([model]));u.mem_write(0x60000+0xe000-2,bytes([primitive]))
   for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xe000),(UC_X86_REG_AX,0xaaaa)]:u.reg_write(reg,value)
   u.emu_start(start,end,count=20);assert u.reg_read(UC_X86_REG_IP)==end-0x10000
   rows.append({'engine':engine,'model':model,'primitive':primitive,'sort':u.reg_read(UC_X86_REG_AX)})
 assert path.read_bytes()==image
print(json.dumps(rows))
