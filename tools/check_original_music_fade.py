"""Original fade control flow; audio callbacks and timer services are doubled."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for index,(path,seg,entry,mode,level,paused,alternate_level,ptr,volume_call,stop_call,timer_seg,begin,finish) in enumerate([
 (a.legacy,0x2daf,0x668,0x4e06,0xa3be,0x4e0c,0x4e0b,0x4ddc,0x764,0x288,0x209e,0x3c16,0x3c2d),
 (a.modern,0x2e0e,0x6a8,0x4ee4,0xa654,0x4eea,0x4ee9,0x4eba,0x7a4,0x2a6,0x20e5,0x3d9c,0x3db3),
]):
 image=path.read_bytes()
 for alternate,initial in itertools.product([0,1],[0,1,2,127,255]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(0x60000+mode,bytes([alternate]));m.mem_write(0x60000+level,bytes([initial]));m.mem_write(0x60000+ptr,struct.pack('<2H',0,0x9000))
  events=[]
  def hook(uc,address,size,user):
   sp=uc.reg_read(UC_X86_REG_SP)
   if address==seg*16+volume_call:
    assert struct.unpack('<H',uc.mem_read(0x60000+paused,2))[0]==1
    events.append(['volume',struct.unpack('<H',uc.mem_read(0x60000+sp+4,2))[0]])
   elif address==0x9003f:
    command,data,data_seg=struct.unpack('<3H',uc.mem_read(0x60000+sp+4,6));assert command==4 and data_seg==0x6000
    assert data==(0x4e08 if index==0 else 0x4ee6)
    events.append(['volume',uc.mem_read(0x60000+alternate_level,1)[0]])
   elif address==timer_seg*16+begin:
    assert struct.unpack('<H',uc.mem_read(0x60000+paused,2))[0]==0
    events.append(['delay',struct.unpack('<i',uc.mem_read(0x60000+sp+4,4))[0]])
   elif address==timer_seg*16+finish:events.append(['wait'])
   elif address==seg*16+stop_call:events.append(['stop'])
   else:return
   ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,2))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0xabcd)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=20000)
  expected=[]
  for value in range(100 if alternate else initial,0,-2):expected.extend([['volume',value],['delay',2],['wait']])
  expected.append(['stop'])
  if alternate:expected.extend([['delay',50],['wait'],['volume',100]])
  assert events==expected,(index,alternate,initial,events)
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_SI)==0xabcd
  assert m.mem_read(0x60000+level,1)[0]==initial;cases+=1
 assert path.read_bytes()==image
print(json.dumps({'actualOriginalFadeCases':cases,'bothVersionsAndDriverBranches':True,'nativeExpectedEventSequenceMatches':True,'audioAndTimerServicesExplicitlyDoubled':True,'noSoundPlayed':True,'pass':True}))
