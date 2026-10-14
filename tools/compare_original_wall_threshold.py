"""Original wall threshold arithmetic over every folded direction; no calls."""
import argparse,sys,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
machines=[]
for path,start,end in [(a.legacy,0x7c00,0x7c20),(a.modern,0x7c14,0x7c2a)]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,path.read_bytes())
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0x8000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 machines.append((m,start,end))
rows=[]
for direction in range(1024):
 impact=1024-direction if direction>256 else direction;results=[]
 for index,(m,start,end) in enumerate(machines):
  m.reg_write(UC_X86_REG_SI,impact);m.emu_start(start,end,count=50)
  assert m.reg_read(UC_X86_REG_IP)==end
  results.append(m.reg_read(UC_X86_REG_CX))
 decisions=[]
 for index,(m,start,end) in enumerate(machines):
  events=[];call=0x7c4d if index==0 else 0x7c57;finish=0x7c53 if index==0 else 0x7c5d;flag=-0x136 if index==0 else -0x138
  def hook(machine,address,size,user):
   if address==call:
    sp=machine.reg_read(UC_X86_REG_SP);cs,event,car=__import__('struct').unpack('<3H',bytes(machine.mem_read(0x60000+sp,6)));assert event==1 and car==0
    events.append(event);machine.reg_write(UC_X86_REG_SP,sp+2);machine.reg_write(UC_X86_REG_IP,address+3)
  handle=m.hook_add(UC_HOOK_CODE,hook)
  for speed in [max(0,results[index]-1),results[index],min(65535,results[index]+1)]:
   import struct
   m.mem_write(0x68006,struct.pack('<H',0x1000));m.mem_write(0x6800e,b'\0');m.mem_write(0x68000+flag,struct.pack('<H',int(direction>256)));m.mem_write(0x6102c,struct.pack('<H',speed));m.mem_write(0x61036,struct.pack('<h',123))
   m.reg_write(UC_X86_REG_SI,impact);m.reg_write(UC_X86_REG_SP,0xf000);events.clear()
   m.emu_start(start,finish,count=100)
   assert m.reg_read(UC_X86_REG_IP)==finish
   decisions.append(dict(generation='ms-1990' if index==0 else 'ms-1991',speed=speed,crash=bool(events),wheelAngle=struct.unpack('<h',bytes(m.mem_read(0x61036,2)))[0]))
  m.hook_del(handle)
 rows.append(dict(direction=direction,impact=impact,legacy=results[0],modern=results[1],decisions=decisions))
assert sum(row['legacy']!=row['modern'] for row in rows)==297
with a.output.open('x') as f:json.dump(rows,f)
print('1024 paired original full wall-threshold calculations captured, including signed multiply,shift and byte packing;297 version differences')
