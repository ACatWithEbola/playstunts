"""Execute both original buffer-full prompt blocks with explicit service adapters."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for path,start,end,source_data,pending,done,counter,suspend,pause,lookup,dialog,resume,release,event in [
 (a.legacy,0x13b9d,0x13c17,0x2d1a0,0xaa77,0x8ff4,0x4090,0x198d0+0x254a,0x28f00+0x138,0x198d0+0x150c,0x198d0+0x1e0,0x28f00+0x216,0x198d0+0x2566,0x6e70+0x4542),
 (a.modern,0x14224,0x1429e,0x32a90,0xb16b,0x96e6,0x413e,0x198d0+0x25f8,0x2e0e0+0x152,0x198d0+0x160c,0x198d0+0x1e4,0x2e0e0+0x230,0x198d0+0x2614,0x6e80+0x4bb2)]:
 image=path.read_bytes()
 for choice,active,previous_done in itertools.product([0,1,65535],[0,1],[0,1]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[source_data:source_data+65536]);m.mem_write(0x60000+pending,bytes([active]));m.mem_write(0x60000+done,bytes([previous_done]));m.mem_write(0x60000+counter,struct.pack('<H',123));events=[]
  services={suspend:'suspend',pause:'pause',lookup:'lookup',dialog:'dialog',resume:'resume-audio',release:'resume-input',event:'replay'}
  def hook(uc,address,size,user):
   if address not in services:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=0x60000+sp;events.append(services[address])
   if address==lookup:uc.reg_write(UC_X86_REG_AX,0);uc.reg_write(UC_X86_REG_DX,0x9000)
   elif address==dialog:
    args=struct.unpack('<9H',uc.mem_read(stack+4,18));assert args[0:4]==(2,1,0,0x9000) and args[4:6]==(65535,65535) and args[7:9]==(0,0),args
    uc.reg_write(UC_X86_REG_AX,choice)
   elif address==event:assert struct.unpack('<2H',uc.mem_read(stack+4,4))==(4,0)
   ip,cs=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook)
  for reg,value in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(start,end,count=1000);assert m.reg_read(UC_X86_REG_IP)==end-0x105c0
  expected=['suspend','pause','lookup','dialog','resume-audio','resume-input']+(['replay'] if choice==1 else []) if active else []
  assert events==expected and m.mem_read(0x60000+pending,1)==b'\0'
  assert m.mem_read(0x60000+done,1)==bytes([1 if active and choice==1 else previous_done])
  assert struct.unpack('<H',m.mem_read(0x60000+counter,2))[0]==(0 if active else 123)
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalPromptCases':cases,'bothEditionsInitiallySelectContinueNow':True,'escapeContinuesAndSeeReplayRequestsMode4':True,'orderedCleanupAndFlagsMatch':True,'servicesExplicitlyDoubled':True,'pass':True}))
