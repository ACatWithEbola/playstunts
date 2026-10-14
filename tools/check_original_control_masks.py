"""Execute every ten-key combination in both original control-mask routines."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
cases=0;masks=[16,32,9,1,5,4,6,2,10,8]
for path,seg,start,bindings,held,enabled in [(a.legacy,0x209e,0x1b18,0x430a,0x43dc,0x4602),(a.modern,0x20e5,0x1b14,0x43b8,0x448a,0x46b0)]:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 m.mem_write(0x60000+bindings,bytes(range(10)));m.mem_write(0x60000+enabled,b'\0')
 for combination in range(1024):
  keys=bytes((combination>>i)&1 for i in range(10));m.mem_write(0x60000+held,keys)
  m.mem_write(0x6f000,struct.pack('<2H',0x1000,0))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+start,0x1000,count=500)
  expected=0
  for i in range(10):
   if combination>>i&1:expected|=masks[i]
  assert m.reg_read(UC_X86_REG_AX)==expected and m.reg_read(UC_X86_REG_SP)==0xf004
  assert bytes(m.mem_read(0x60000+held,10))==keys
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalControlMaskCases':cases,'bothVersionsAllKeyCombinations':True,'joystickDisabledForZeroKeyCase':True,'sourceFilesUnchanged':True,'pass':True}))
