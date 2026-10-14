"""Isolated original tunnel-selection branch audit, not full wheel collision."""
import argparse
import json
import random
import struct
import sys
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('legacy',type=Path);p.add_argument('target',type=Path)
p.add_argument('--libraries',type=Path,required=True)
p.add_argument('--divider',action='store_true')
p.add_argument('--json',action='store_true')
p.add_argument('--divider-sweep',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_BP,UC_X86_REG_IP

machines=[];source_images={path:path.read_bytes() for path in (a.legacy,a.target)}
for path,start,end,height,surface,plane,wall,upper in [
 (a.legacy,0x112f2,0x11e30,0x945e,0x97b7,0x9834,0x8d3c,0x94fe),
 (a.target,0x11266,0x11c0e,0x96f8,0x9a4f,0x9ace,0x8f9a,0x9798),
]:
 image=path.read_bytes()
 if a.divider:start=0x10c04 if path==a.legacy else 0x10c02
 else:assert image[start:start+8]==bytes.fromhex('8b5e068b47022b06')
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 machines.append((m,start,end,height,surface,plane,wall,upper))
randomizer=random.Random(19910225)
cases=[]
for x in ([-361,-360,-121,-120,-119,0,119,120,121,360,361] if a.divider else [-271,-270,-120,-119,0,119,120,270,271]):
 for y in [-1,0,1,143,144,145,239,240,241]:
  for old_y in [-1,0,1,143,144,145,239,240,241]:cases.append((x,y,0,x,old_y,0))
for _ in range(1000):
 cases.append((randomizer.randint(-350,350),randomizer.randint(-30,200),0,
               randomizer.choice([-271,-270,-120,0,120,270,271]),
               randomizer.choice([0,143,144,200]),
               randomizer.choice([-513,-512,0,512,513])))
if a.divider_sweep:
 assert a.divider
 cases=[(x,0,0,old_x,0,0) for x in range(-1024,1025) for old_x in [-512,-361,-360,-121,-120,-119,0,119,120,121,360,361,512]]
def write_word(m,address,value):m.mem_write(address,struct.pack('<H',value&65535))
observed=set();rows=[]
for index,(x,y,z,old_x,old_y,old_z) in enumerate(cases):
 outputs=[]
 for m,start,end,height,surface,plane,wall,upper in machines:
  m.mem_write(0x60000,bytes(0x10000));m.mem_write(0x70000,bytes(0x10000))
  for register,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x8000)]:m.reg_write(register,value)
  m.mem_write(0x61000,struct.pack('<hhh',x,y,z));m.mem_write(0x62000,struct.pack('<hhh',old_x,old_y,old_z))
  for offset,value in [(6,0x1000),(8,0x2000),(-0x2c,x),(-0x32,abs(x)),(-0x18,old_x),(-0x14,old_z)]:write_word(m,0x78000+offset,value)
  m.mem_write(0x78000-0x12,b'\x01')
  write_word(m,0x60000+height,0);write_word(m,0x60000+plane,0);write_word(m,0x60000+wall,-1);write_word(m,0x60000+upper,-12)
  m.mem_write(0x60000+surface,b'\x04');m.emu_start(start,end,count=300)
  assert m.reg_read(UC_X86_REG_CS)*16+m.reg_read(UC_X86_REG_IP)==end,(index,'branch did not reach its exit')
  outputs.append((bytes(m.mem_read(0x60000+surface,1)),bytes(m.mem_read(0x60000+plane,2)),bytes(m.mem_read(0x60000+wall,2)),bytes(m.mem_read(0x60000+upper,2))))
 assert outputs[0]==outputs[1],(index,cases[index],outputs)
 observed.add(outputs[0])
 rows.append({'point':[x,y,z],'previous':[old_x,old_y,old_z],'result':[int.from_bytes(outputs[1][0],'little'),int.from_bytes(outputs[1][1],'little'),int.from_bytes(outputs[1][2],'little',signed=True),int.from_bytes(outputs[1][3],'little',signed=True)]})
 if not a.divider and (y>=144 or old_y>=144) and abs(x)<270:assert outputs[0][1]==struct.pack('<H',133)
assert len(observed)>(3 if a.divider else 5),'must exercise multiple collision branches'
assert all(path.read_bytes()==image for path,image in source_images.items()), 'Source image changed'
if a.json:print(json.dumps(rows))
else:print(f'Original MS90/MS91 '+('divider' if a.divider else 'tunnel')+f' selection outputs match in {len(cases)} boundary/random cases; full collision response remains separate')
