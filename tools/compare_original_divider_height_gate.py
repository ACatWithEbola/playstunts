"""Original divider wall-height gate, not full road contact or visual trees."""
import argparse,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('target',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_IP
machines=[]
for path,start,skip,hit,wall,lower,upper,distance in [(a.legacy,0x7990,0x805c,0x79b2,0x8d3c,0x9404,0x94fe,0xa46c),(a.target,0x79a4,0x806e,0x79c6,0x8f9a,0x9694,0x9798,0xa702)]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,path.read_bytes())
 def stop(machine,address,size,ends):
  if address in ends:machine.emu_stop()
 m.hook_add(UC_HOOK_CODE,stop,(skip,hit));machines.append((m,start,skip,hit,wall,lower,upper,distance))
checked=0
for selected_wall in [-1,186]:
 for distance_value in range(-32768,32768):
  results=[]
  for m,start,skip,hit,wall,lower,upper,distance in machines:
   for at,value in [(wall,selected_wall),(lower,-1000),(upper,-12),(distance,distance_value)]:m.mem_write(0x60000+at,struct.pack('<H',value&65535))
   for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
   m.emu_start(start,0x1000,count=30);end=m.reg_read(UC_X86_REG_CS)*16+m.reg_read(UC_X86_REG_IP);assert end in (skip,hit)
   results.append(end==hit)
  expected=selected_wall!=-1 and -1000<distance_value<-12
  assert results==[expected,expected],(selected_wall,distance_value,results);checked+=1
print(str(checked)+' divider-height cases match both originals: distance >= -12 bypasses wall response')
