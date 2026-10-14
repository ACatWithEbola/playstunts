"""Original EGA circle-height calculation; no hardware or stored data writes."""
import argparse,json,sys,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[]
for engine,path,segment,start,end,shift in [('ms-1990',a.legacy,0x209e,0x4d09,0x4d18,1),('ms-1991',a.modern,0x20e5,0x4e8f,0x4ea0,2)]:
 image=path.read_bytes();expected=bytes.fromhex('8b560a8bc2d1e8d1e82bd0')+bytes.fromhex('d1e8')*shift+bytes.fromhex('03d0')
 assert image[segment*16+start:segment*16+end]==expected
 u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image)
 for reg,value in [(UC_X86_REG_CS,segment),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0x1000)]:u.reg_write(reg,value)
 for diameter in range(65536):
  u.mem_write(0x6100a,struct.pack('<H',diameter));u.emu_start(segment*16+start,segment*16+end,count=10)
  assert u.reg_read(UC_X86_REG_IP)==end
  assert u.reg_read(UC_X86_REG_DX)==(diameter-(diameter>>2)+((diameter>>2)>>shift))&65535
 assert path.read_bytes()==image
 rows.append({'engine':engine,'diameters':65536,'quarterShift':shift,'pass':True})
print(json.dumps({'rows':rows,'originalExecutions':131072,'displayMode':'ega','sourceUnchanged':True}))
