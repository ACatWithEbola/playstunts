"""Isolated complete car-contact response, original data/math, no overlap gate."""
import argparse,sys,struct,json,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
machines=[]
for path,data,entry,cs,contact in [(a.legacy,0x32090,0x18c8e,0x187a,0xb0),(a.modern,0x32a90,0xa990,0,0xc8)]:
 b=path.read_bytes();assert b[entry:entry+3]==bytes.fromhex('558bec')
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,b);m.mem_write(0x60000,b[data:data+65536])
 def stop(machine,address,size,user):
  if address==0x50000:machine.emu_stop()
 m.hook_add(UC_HOOK_CODE,stop,begin=0x50000,end=0x50000)
 machines.append((m,entry,cs,contact))
r=random.Random(19910225);cases=[]
for index in range(1000):
 cars=[dict(yaw=r.randrange(1024),roadSpeed=r.choice([0,1,100,1000,3000,32768,65535,r.randrange(65536)])) for _ in range(2)]
 outputs=[]
 for m,entry,cs,contact in machines:
  for ptr,car in zip([0x1000,0x1200],cars):
   state=bytearray(208);struct.pack_into('<H',state,24,car['yaw']);struct.pack_into('<H',state,44,car['roadSpeed']);m.mem_write(0x60000+ptr,bytes(state))
  m.mem_write(0x6f000,struct.pack('<4H',0,0x5000,0x1000,0x1200))
  for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(entry,0x50000,count=100000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004
  out=[]
  for ptr in [0x1000,0x1200]:
   s=bytes(m.mem_read(0x60000+ptr,208));out.append(dict(speed=struct.unpack_from('<H',s,42)[0],roadSpeed=struct.unpack_from('<H',s,44)[0],wheelAngle=struct.unpack_from('<h',s,54)[0],contact=s[contact]))
  outputs.append(dict(cars=out,crash=bool(m.reg_read(UC_X86_REG_AX))))
 cases.append(dict(input=cars,legacy=outputs[0],modern=outputs[1]))
with a.output.open('x') as f:json.dump(cases,f)
print('Original complete car-contact responses captured for1000 paired cases')
