"""Original paired landing threshold/flags/event/reset sequence; no audio."""
import argparse,sys,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
rows=[]
for path,start,end,wheel_at,sound_at,handler,generation in [(a.legacy,0x83eb,0x8437,-0xe6,0xb7,0xb3b2,'ms-1990'),(a.modern,0x83e9,0x8432,-0xe8,0xcf,0xba32,'ms-1991')]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,path.read_bytes());events=[]
 def hook(machine,address,size,user):
  if address==handler:
   sp=machine.reg_read(UC_X86_REG_SP);ip,cs,cause,car=struct.unpack('<4H',bytes(machine.mem_read(0x60000+sp,8)));assert cause==1 and car==0;events.append(cause);machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
 m.hook_add(UC_HOOK_CODE,hook)
 for fall in [-32768,-1,0,189,190,191,249,250,251,930,931,932,23274,23275,23276,32767]:
  for wheel in range(4):
   for flags in [0,8,255]:
    m.mem_write(0x60000,bytes(65536));m.mem_write(0x68006,struct.pack('<H',0x1000));m.mem_write(0x68000+wheel_at,bytes([wheel]));m.mem_write(0x6104c+wheel*2,struct.pack('<h',fall));m.mem_write(0x61000+sound_at,bytes([flags]))
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x8000)]:m.reg_write(reg,value)
    events.clear();m.emu_start(start,end,count=1000);assert m.reg_read(UC_X86_REG_IP)==end
    rows.append(dict(generation=generation,wheel=wheel,fall=fall,flags=flags,sound=m.mem_read(0x61000+sound_at,1)[0],events=list(events),after=struct.unpack('<h',bytes(m.mem_read(0x6104c+wheel*2,2)))[0]))
with a.output.open('x') as f:json.dump(rows,f)
print('384 original landing sequences captured across both engines,four wheels,threshold boundaries and retained sound flags')
