"""Original left/right result-menu blocks; no display or audio execution."""
import argparse,itertools,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[]
for engine,path,left,right,end in [('ms-1990',a.legacy,0x6bd2,0x6bfc,0x68e0),('ms-1991',a.modern,0x6bd4,0x6bfe,0x68e2)]:
 image=path.read_bytes()
 for available,status,selected,key in itertools.product([0,1],[0,2,255],[0,1,2,3,127,128,255],[0x4b00,0x4d00]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  bp=0xf000
  for delta,value in [(-0x16,available),(-0x6e,status),(-0x92,selected)]:m.mem_write(0x60000+bp+delta,bytes([value]))
  for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(left if key==0x4b00 else right,end,count=100)
  rows.append({'engine':engine,'evaluationAvailable':available,'evaluationStatus':status,'selected':selected,'key':key,'result':m.mem_read(0x60000+bp-0x92,1)[0]})
 assert path.read_bytes()==image
print(json.dumps({'cases':rows,'sourcesUnchanged':True}))
