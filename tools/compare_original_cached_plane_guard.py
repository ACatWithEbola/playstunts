"""Execute original cached-plane guards; stop before crash-event side effects."""
import argparse,sys,struct,itertools,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
specs=[(a.legacy,0x8a01,0x8a27,0xb3b2,-0x136),(a.modern,0x89ab,0x89d5,0xba32,-0x138)]
machines=[]
for path,start,end,event,local in specs:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 machines.append((m,start,end,event,local))
values=[-32768,-8,-7,-6,-5,-1,0,1,5,6,7,8,32767];different=0;cases=0
for old,new,flag in itertools.product(values,values,[0,1,2,255]):
 observed=[]
 for m,start,end,event,local in machines:
  m.mem_write(0x60000,bytes(65536));m.mem_write(0x6aab6,bytes([flag]));m.mem_write(0x6f000+local,struct.pack('<h',new))
  fired=[]
  def hook(machine,address,size,user):
   sp=machine.reg_read(UC_X86_REG_SP)
   assert struct.unpack('<H',bytes(machine.mem_read(0x60000+sp+4,2)))[0]==5
   fired.append(True);machine.emu_stop()
  h=m.hook_add(UC_HOOK_CODE,hook,begin=event,end=event)
  for reg,v in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xee00),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SI,old&65535),(UC_X86_REG_AX,new&65535)]:m.reg_write(reg,v)
  m.ctl_flush_tb();m.emu_start(start,end,count=1000);m.hook_del(h);observed.append(bool(fired))
 expected=[(old < -6 and new > 6) or (old > 6 and new < -6),flag!=1 and ((old<0 and new>0) or (old>0 and new<0))]
 assert observed==expected,(old,new,flag,observed,expected)
 different+=observed[0]!=observed[1];cases+=1
print(json.dumps(dict(cases=cases,differingCases=different,event=5,modernFlagOneBypasses=True,fullCollisionResponseVerified=False,passVerified=True)))
