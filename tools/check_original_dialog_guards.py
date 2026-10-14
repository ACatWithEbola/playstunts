"""Modern complete-dialog early guards; measurement/backdrop services doubled."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.modern.read_bytes();cases=0
for offset,segment,backdrop in itertools.product([0,1],[0,0x8000],[0,1]):
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 m.mem_write(0x600a0,struct.pack('<2H',offset,segment));m.mem_write(0x6a6f6,struct.pack('<H',8));m.mem_write(0x90000,b'Title]\0');events=[]
 def hook(uc,address,size,user):
  if address not in [0x198d0+0x1920,0x20e50+0x3e1f,0x198d0+8]:return
  sp=uc.reg_read(UC_X86_REG_SP)
  if address==0x198d0+8:uc.reg_write(UC_X86_REG_AX,backdrop);events.append('backdrop')
  elif address==0x20e50+0x3e1f:uc.reg_write(UC_X86_REG_AX,5)
  else:events.append('cursor-reset')
  ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
 m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<11H',0x1000,0,2,1,0,0x9000,65535,65535,4,0x5000,0))
 for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0x1234),(UC_X86_REG_DI,0xabcd)]:m.reg_write(reg,value)
 # Stop before drawing on the successful path, or at the far-return sentinel.
 m.hook_add(UC_HOOK_CODE,lambda uc,*args:uc.emu_stop(),begin=0x198d0+0x361,end=0x198d0+0x361)
 m.emu_start(0x198d0+0x1e4,0x1000,count=10000)
 if not(offset|segment) or not backdrop:
  actual=(m.reg_read(UC_X86_REG_CS),m.reg_read(UC_X86_REG_IP),m.reg_read(UC_X86_REG_AX));assert actual==(0,0x1000,65535),(offset,segment,backdrop,actual,events)
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_SI)==0x1234 and m.reg_read(UC_X86_REG_DI)==0xabcd
 else:assert m.reg_read(UC_X86_REG_IP)==0x361
 assert events==(['cursor-reset','backdrop'] if offset|segment else [])
 cases+=1
assert a.modern.read_bytes()==image
depth_cases=0
for depth in [0,1,2,3,4,255]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60194,bytes([depth]));m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0,32,0,32))
 for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 m.hook_add(UC_HOOK_CODE,lambda uc,*args:uc.emu_stop(),begin=0x198d0+0x20,end=0x198d0+0x20)
 m.emu_start(0x198d0+8,0x1000,count=100)
 if depth==3:assert (m.reg_read(UC_X86_REG_CS),m.reg_read(UC_X86_REG_IP),m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_SP))==(0,0x1000,0,0xf004)
 else:assert m.reg_read(UC_X86_REG_IP)==0x20
 depth_cases+=1
print(json.dumps({'originalDialogGuardCases':cases,'backdropDepthGuardCases':depth_cases,'depthExactlyThreeReturnsFailure':True,'otherDepthsOnlyVerifiedThroughGuard':True,'missingFontAndBackdropFailureVerified':True,'sharedFailureReturnRestoresCallerRegisters':True,'successfulPathReachesDrawingBoundary':True,'servicesExplicitlyDoubled':True,'pass':True}))
