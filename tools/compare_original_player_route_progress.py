"""Direct changed-route branch comparison; not a complete split-track oracle."""
import argparse,struct,sys,itertools
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
specs=[(a.legacy,0x32090,0x9904,0x99de,[0x936d,0x936e,0x9149],[0x9204,0x9206,0xac36,0x908c],0x9419,0x7832,0x83fa),(a.modern,0x32a90,0x98c9,0x99b1,[0x95fb,0x95fc,0x93bf],[0x9492,0x9494,0xaece,0x92ea],0x96ab,0x7a32,0x7acc)]
machines=[]
for path,data,start,end,bs,ws,display,primary,alternate in specs:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 assert image[start:start+4]==bytes.fromhex('837ee2fe')
 machines.append((m,image[data:data+65536],start,end,bs,ws,display,primary,alternate))
cases=0
for status,confirmations,laps,previous,route,delta in itertools.product(range(3),[0,2,127,255],[0,255],range(4),range(4),[-2,-1,0,2,3,4]):
 results=[]
 for m,data,start,end,bs,ws,display,primary,alternate in machines:
  m.mem_write(0x60000,data)
  for offset,value in zip(bs,[status,confirmations,laps]):m.mem_write(0x60000+offset,bytes([value]))
  for offset,value in zip(ws,[previous,previous,0,0]):m.mem_write(0x60000+offset,struct.pack('<H',value))
  m.mem_write(0x60000+display,b'\0');m.mem_write(0x696dc,struct.pack('<H',20))
  for offset,base,values in [(primary,0,[1,2,3,0]),(alternate,16,[2,65535,0,65535])]:
   m.mem_write(0x60000+offset,struct.pack('<HH',base,0x9000));m.mem_write(0x90000+base,struct.pack('<4H',*values))
  m.mem_write(0x6effe,struct.pack('<H',route));m.mem_write(0x6efe2,struct.pack('<h',delta))
  for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,0xf000),(UC_X86_REG_SP,0xee00)]:m.reg_write(reg,value)
  m.emu_start(start,end,count=1000);assert m.reg_read(UC_X86_REG_IP)==end
  result=[bytes(m.mem_read(0x60000+offset,1))[0] for offset in bs]+[struct.unpack('<H',bytes(m.mem_read(0x60000+offset,2)))[0] for offset in ws]+[bytes(m.mem_read(0x60000+display,1))[0]]
  results.append(result)
 assert results[0]==results[1],(status,confirmations,laps,previous,route,delta,results)
 cases+=1
print(str(cases)+' original changed-route/lap/penalty cases match at20Hz; full split-first course not verified')
