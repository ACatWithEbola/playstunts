"""Original portrait Y arithmetic, exhaustive unsigned16 bitmap header height."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
cases=0
for engine,path,start,end in [('ms-1990',a.legacy,0x61db,0x61eb),('ms-1991',a.modern,0x61d9,0x61e6)]:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 for height in range(65536):
  m.mem_write(0x62002,struct.pack('<H',height))
  for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_BX,0x2000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(start,end,count=20)
  result=struct.unpack('<h',bytes(m.mem_read(0x6ef70,2)))[0]
  delta=((99-height+32768)&65535)-32768
  expected=delta//2 if engine=='ms-1991' else (abs(delta)//2)*(-1 if delta<0 else 1)
  assert result==expected,(engine,height,result,expected);cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalPortraitCases':cases,'bothOriginalBlocksExecuted':True,'signed16WrappingVerified':True,'sourcesUnchanged':True,'pass':True}))
