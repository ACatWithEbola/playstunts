"""Original disk prompt loops with virtual disk/resource/dialog service doubles."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for index,(path,start,base) in enumerate([(a.legacy,0x2ad4,0x32090),(a.modern,0x2d6c,0x32a90)]):
 image=path.read_bytes()
 for kind,failures in itertools.product([1,2,3,4],range(4)):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[base:base+65536])
  flag=0x132 if index==0 else 0x190;colour=0x4ec2 if index==0 else 0x50b6
  m.mem_write(0x60000+flag,b'\x7d');m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,kind));events=[]
  def hook(machine,address,size,user):
   targets={0x198d0+(0x150c if index==0 else 0x160c):'resource',0x198d0+(0x1e0 if index==0 else 0x1e4):'dialog',
    0x198d0+(0x1820 if index==0 else 0x1920):'reset',(0x209e0+0x15ae) if index==0 else (0x20e50+0x15b0):'probe'}
   if address not in targets:return
   sp=machine.reg_read(UC_X86_REG_SP);action=targets[address]
   if action=='probe':
    seen=sum(e=='probe' for e in events);events.append('probe');machine.reg_write(UC_X86_REG_AX,int(seen>=failures))
   elif action=='resource':
    at=struct.unpack('<H',machine.mem_read(0x60000+sp+8,2))[0]
    assert bytes(machine.mem_read(0x60000+at,4)).split(b'\0')[0]==('id'+str(kind)).encode()
    events.append('resource');machine.reg_write(UC_X86_REG_AX,0x1000);machine.reg_write(UC_X86_REG_DX,0x9000)
   elif action=='dialog':
    supplied=struct.unpack('<H',machine.mem_read(0x60000+sp+16,2))[0]
    assert supplied==struct.unpack('<H',machine.mem_read(0x60000+colour,2))[0]
    events.append('dialog');machine.reg_write(UC_X86_REG_AX,1)
   else:events.append('reset')
   ip,cs=struct.unpack('<2H',machine.mem_read(0x60000+sp,4));machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook)
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0x1234),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+start,0x1000,count=10000)
  assert events==['probe']+['resource','dialog','reset','probe']*failures
  assert m.mem_read(0x60000+flag,1)[0]==(0 if failures else 0x7d)
  assert m.reg_read(UC_X86_REG_SI)==0x1234 and m.reg_read(UC_X86_REG_SP)==0xf004
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalDiskPromptCases':cases,'bothVersionsRetryAndCleanupMatch':True,'versionedColourFieldUsed':True,'noRealDiskAudioOrGraphicsServices':True,'pass':True}))
