"""Execute original underside guard only, stopping before crash side effects."""
import argparse
import struct
import sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('target',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--handoff',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_BP
machines=[]
for path,entry,flag,new_y,normal,fallback,crash in [
 (a.legacy,0x7f57,0x843e,-0x18,0x7f85,0x7fe6,0x7f7a),
 (a.target,0x7f70,0x863c,-0x1a,0x7f9e,0x7ff8,0x7f93),
]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);image=path.read_bytes();m.mem_write(0,image)
 assert image[entry:entry+5]==bytes.fromhex('803e')+struct.pack('<H',flag)+b'\0'
 result=[];requests=[]
 def stop(machine,address,size,data):
  destinations,out,event,crash_at,flag_at=data
  if a.handoff and address==crash_at:
   sp=machine.reg_read(UC_X86_REG_SP)
   cs,kind,handle=struct.unpack('<3H',bytes(machine.mem_read(0x70000+sp,6)))
   assert kind==5 and handle==0
   event.append(kind);machine.reg_write(UC_X86_REG_SP,sp+2)
   from unicorn.x86_const import UC_X86_REG_IP
   machine.reg_write(UC_X86_REG_IP,address+3);return
  if a.handoff and address in destinations:
   if event:assert bytes(machine.mem_read(0x78000+flag_at,1))==b'\x01'
   else:assert bytes(machine.mem_read(0x78000+flag_at,1))==b'\x00'
   out.append('underside-crash' if event else destinations[address]);machine.emu_stop();return
  if address in destinations:out.append(destinations[address]);machine.emu_stop()
 destinations={normal:'normal',fallback:'ground-fallback'}
 if not a.handoff:destinations[crash]='underside-crash'
 m.hook_add(UC_HOOK_CODE,stop,(destinations,result,requests,crash,-0x134 if path==a.legacy else -0x136))
 machines.append((m,entry,flag,new_y,result,requests))
values=[-32768,-100,-25,-24,-23,-13,-12,-11,-1,0,1,32767]
count=0
for underside in [0,1,2,255]:
 for old_y in values:
  for current_y in values:
   outputs=[]
   for m,entry,flag,new_y,result,requests in machines:
    m.mem_write(0x60000,bytes(0x10000));m.mem_write(0x70000,bytes(0x10000));result.clear();requests.clear()
    for register,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x8000)]:m.reg_write(register,value)
    m.mem_write(0x60000+flag,bytes([underside]));m.mem_write(0x78000-0xa,struct.pack('<h',old_y));m.mem_write(0x78000+new_y,struct.pack('<h',current_y))
    m.emu_start(entry,0x8500,count=40);assert len(result)==1,'guard did not reach an identified branch destination';outputs.append(result[0])
   expected='normal' if underside or old_y>=-12 or current_y>=-12 else 'ground-fallback' if current_y<=-24 else 'underside-crash'
   assert outputs==[expected,expected],(underside,old_y,current_y,outputs,expected);count+=1
print(f'Original MS90/MS91 underside '+('event5/retained-correction-flag handoff' if a.handoff else 'guard')+f' matches in {count} signed-boundary cases; global crash handler and full plane response are not executed')
