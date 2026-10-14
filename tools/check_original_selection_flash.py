"""Original timed-outline arithmetic with an explicit timer-delta service."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
editions=[]
for path,entry,stop,timer,counter_field in [(a.legacy,0x21f0,0x221f,0x2b5e,0xa788),(a.modern,0x226e,0x229d,0x2df2,0xaa20)]:
 image=path.read_bytes();rows=[]
 for counter,delta in itertools.product([0,1,29,30,31,59,60,61,32767,32768,65535],[0,1,30,60,65535]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000+counter_field,struct.pack('<H',counter))
  def hook(uc,address,size,user):
   if address!=0x198d0+timer:return
   uc.reg_write(UC_X86_REG_AX,delta);sp=uc.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4))
   uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<9H',0x1000,0,0,0,0,0,0,5,14))
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+entry,0x198d0+stop,count=10000)
  assert m.reg_read(UC_X86_REG_IP)==stop
  rows.append({'counter':counter,'delta':delta,'nextCounter':struct.unpack('<H',m.mem_read(0x60000+counter_field,2))[0],'colour':m.reg_read(UC_X86_REG_DI)})
 editions.append(rows);assert path.read_bytes()==image
assert editions[0]==editions[1]
with a.output.open('x') as out:json.dump(editions[0],out)
print(json.dumps({'originalArithmeticCases':len(editions[0])*2,'bothEditionsThresholdAndWrapMatch':True,'timerServiceDoubled':True,'pass':True}))
