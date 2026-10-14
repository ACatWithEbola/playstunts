"""Original filename builders with isolated strings; never opens any file."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[]
for engine,path,start,data_base in [('ms-1990',a.legacy,0x102e,0x2d1a0),('ms-1991',a.modern,0x110c,0x32a90)]:
 image=path.read_bytes()
 for directory,name,extension in itertools.product([None,'','C:','C:\\','C:\\SAVES','C:/SAVES/'],['DEFAULT','TEST.TRK',''],['.HIG','.RPL']):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[data_base:data_base+65536])
  for offset,text in [(0x1000,directory or ''),(0x1100,name),(0x1200,extension)]:m.mem_write(0x60000+offset,text.encode('ascii')+b'\0')
  m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0 if directory is None else 0x1000,0x1100,0x1200,0x2000))
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+start,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  text=bytes(m.mem_read(0x62000,256)).split(b'\0')[0].decode('ascii')
  rows.append({'engine':engine,'directory':directory,'name':name,'extension':extension,'output':text})
 assert path.read_bytes()==image
print(json.dumps({'cases':rows,'sourcesUnchanged':True}))
