"""Complete original route lookup on isolated synthetic route allocations."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes();rows=[]
for reverse in [0,16]:
 for rotation,alternate,point in itertools.product([0,256,512,768],[False,True],[0,1]):
  for terrain in [0,6]:
   for height in [0,-1]:
    m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[0x32a90:0x42a90])
    # Four independent far buffers: tile,direction,column,terrain row; terrain
    # allocation holds one full30x30 grid because the helper indexes row29.
    for at,offset in [(0x96e0,0),(0xa1da,0x100),(0xa340,0x200),(0xa6de,0x300),(0xa1c4,0x400)]:m.mem_write(0x60000+at,struct.pack('<HH',offset,0x9000))
    for at,value in [(0,0),(0x100,reverse),(0x200,0),(0x300,29),(0x400+29*30,terrain)]:m.mem_write(0x90000+at,bytes([value]))
    m.mem_write(0x60000+0x90b8+29*2,struct.pack('<H',29*30))
    m.mem_write(0x60000+0x7ad0+29*2,struct.pack('<H',0));m.mem_write(0x60000+0xae8a+29*2,struct.pack('<H',512))
    m.mem_write(0x60000+0xaad6,struct.pack('<H',512))
    m.mem_write(0x6209e,struct.pack('<H',0x3000)+bytes(12))
    record=bytearray(14);record[5]=2;struct.pack_into('<H',record,6,rotation);struct.pack_into('<H',record,8,0x3100)
    if alternate:struct.pack_into('<H',record,10,0x3200)
    m.mem_write(0x63000,bytes(record));m.mem_write(0x63100,struct.pack('<12h',-513,height,-513,-512,height,-512,-510,height,-510,-509,height,-509))
    m.mem_write(0x63200,struct.pack('<12h',-517,height,-517,-516,height,-516,-514,height,-514,-513,height,-513))
    m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0,0x4000,point,0))
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
    m.emu_start(0xb200,0x1000,count=10000)
    assert m.reg_read(UC_X86_REG_SP)==0xf004
    rows.append({'reverse':reverse,'rotation':rotation,'alternate':alternate,'point':point,'terrain':terrain,'height':height,'output':list(struct.unpack('<10h',bytes(m.mem_read(0x64000,20)))),'last':m.reg_read(UC_X86_REG_AX)})
assert a.image.read_bytes()==image
print(json.dumps({'cases':rows,'sourceUnchanged':True}))
