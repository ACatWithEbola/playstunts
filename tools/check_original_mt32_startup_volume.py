"""Execute bounded original post-upload startup volume tail; driver is doubled."""
import argparse,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
for path,cs,start,data,driver,payload in [(a.legacy,0x2daf,0x2e3fd,0x32090,0x4ddc,0x4e08),(a.modern,0x2e0e,0x2ea2d,0x32a90,0x4eba,0x4ee6)]:
 image=path.read_bytes()
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[data:data+65536]);m.mem_write(0x60000+driver,struct.pack('<2H',0,0x9000));events=[]
 def hook(uc,address,size,user):
  if address!=0x9003f:return
  sp=uc.reg_read(UC_X86_REG_SP);args=struct.unpack('<3H',uc.mem_read(0x60000+sp+4,6));assert args==(4,payload,0x6000)
  packet=bytes(uc.mem_read(0x60000+payload,4));assert packet==bytes([16,0,22,100]);events.append(list(packet));uc.emu_stop()
 m.hook_add(UC_HOOK_CODE,hook)
 for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0xf100)]:m.reg_write(reg,value)
 m.emu_start(start,0x1000,count=1000);assert events==[[16,0,22,100]];assert path.read_bytes()==image
print('Both original post-upload startup tails set Roland system volume100 with exact address payload; driver delivery and earlier loader not covered')
