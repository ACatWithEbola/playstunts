"""Music reset envelope with real timer initialization and silent voice services."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for modern,path,seg,entry,stop,update,base,stride,volume,lock,active,tracks in [
 (False,a.legacy,0x2daf,0x288,0x2edd0+0x12f4,0x2edd0+0x108e,0x847a,72,0xa3be,0x4e0c,0x4e04,0x8d3e),
 (True,a.modern,0x2e0e,0x2a6,0x2f650+0x1332,0x2f650+0x10cc,0x8678,76,0xa654,0x4eea,0x4ee2,0x8f9c)]:
 image=path.read_bytes()
 for master,fill in itertools.product([0,127,255],[0,0xaa]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000+base,bytes([fill])*(24*stride));m.mem_write(0x60000+volume,bytes([master]));events=[]
  def hook(uc,address,size,user):
   if address not in [stop,update]:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=0x60000+sp
   if address==stop:assert struct.unpack('<2H',uc.mem_read(stack+4,4))==(0,15)
   events.append('stop-music-voices' if address==stop else 'update-voices')
   ip,cs=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<2H',0x1000,0))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
  assert events==['stop-music-voices','update-voices']
  assert bytes(m.mem_read(0x60000+base+16*stride,8*stride))==bytes([fill])*(8*stride)
  for owner in range(16):
   timer=bytes(m.mem_read(0x60000+base+owner*stride,stride));assert timer[:4]==bytes(4) and timer[0x28]==master and timer[0x23]==owner
   if modern:assert timer[72:76]==bytes(4)
  assert m.mem_read(0x60000+active,1)==b'\0' and m.mem_read(0x60000+tracks,1)==b'\0'
  assert struct.unpack('<H',m.mem_read(0x60000+lock,2))[0]==0
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalMusicResetCases':cases,'actualTimerInitializationExecuted':True,'effectTimerSlotsPreserved':True,'voiceStopAndUpdateExplicitlyDoubled':True,'noAudioOrLiveData':True,'pass':True}))
