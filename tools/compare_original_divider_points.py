"""Execute original divider scenery-point selection and placement tail."""
import argparse,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('target',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_BP,UC_X86_REG_IP
machines=[]
for path,data,start,end,terrain_pointer,row_table,hill in [(a.legacy,0x32090,0x1232a,0x124d6,0x9f2c,0x8e30,0x124),(a.target,0x32a90,0x12108,0x122b4,0xa1c4,0x90b8,0x182)]:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 machines.append((m,image[data:data+65536],start,end,terrain_pointer,row_table,hill))
checked=0
for id in [109,110]:
 for column in range(30):
  for row in [0,10,19,29]:
   for terrain in [0,6]:
    results=[];x=column*1024+512;z=(29-row)*1024+512
    for m,data,start,end,terrain_pointer,row_table,hill in machines:
     m.mem_write(0x60000,data);m.mem_write(0x70000,bytes(65536));m.mem_write(0x80000,bytes(901))
     def word(address,value):m.mem_write(address,struct.pack('<H',value&65535))
     word(0x60000+terrain_pointer,0);word(0x60000+terrain_pointer+2,0x8000);word(0x60000+row_table+row*2,row*30);word(0x60000+hill,450)
     m.mem_write(0x80000+row*30+column,bytes([terrain]));m.mem_write(0x77ffe,bytes([id]))
     for at,value in [(0x78006,column),(0x78008,row),(0x7800a,0x1000),(0x77ffa,x),(0x77ff4,z)]:word(at,value)
     for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0x7f00),(UC_X86_REG_BP,0x8000)]:m.reg_write(reg,value)
     m.emu_start(start,end,count=1000);assert m.reg_read(UC_X86_REG_CS)*16+m.reg_read(UC_X86_REG_IP)==end
     results.append(struct.unpack('<3h',bytes(m.mem_read(0x61000,6))))
    expected=(x,450 if terrain==6 else 0,z);assert results==[expected,expected],(id,column,row,terrain,results,expected);checked+=1
print(str(checked)+' original divider-point placements match: ground0, elevated terrain450, never divider-top24')
