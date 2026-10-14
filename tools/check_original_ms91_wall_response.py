"""Complete modern wall-response branch in prepared original memory; no audio."""
import argparse,sys,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('inputs',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.image.read_bytes();inputs=a.inputs.read_bytes();cases=json.loads(inputs)[:512];m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,bytes(65536));d=0x60000;bp=0x8000
for pattern,destination,length in [(struct.pack('<8H',0,101,201,302,402,503,603,704),0x4ca4,514),(bytes([0,1,1,2,3,3,4,4,5,6,6,7,8,8,9,10]),0x3970,257)]:
 at=image.find(pattern);assert at>=0 and image.find(pattern,at+1)<0;m.mem_write(d+destination,image[at:at+length])
def registers(cs):
 for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
for destination,angle in [(0x6554,0),(0x5bb4,256),(0x5ba2,512),(0x5bce,768)]:
 m.mem_write(d+0xf000,struct.pack('<4H',0x1000,0,destination,angle));registers(0x2df4);m.emu_start(0x2df9c,0x1000,count=10000)
m.mem_write(d+0x3398,b'\xff\xff');seed=bytes(m.mem_read(d,65536));events=[];stops=[]
def hook(machine,address,size,user):
 if address in (0x806e,0x788c):stops.append(address);machine.emu_stop()
 if address==0xba32:
  sp=machine.reg_read(UC_X86_REG_SP);ip,cs,cause,car=struct.unpack('<4H',bytes(machine.mem_read(d+sp,8)));assert car==0;events.append(cause);machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
m.hook_add(UC_HOOK_CODE,hook);rows=[]
for source in cases:
 row={k:v for k,v in source.items() if k!='expected'};m.mem_write(d,seed);wheel=row['wheel']
 def word(at,value):m.mem_write(d+at,struct.pack('<H',value&65535))
 for at,value in [(bp+6,0x1000),(bp+14,0),(bp-0xde,bp-0x1c0+wheel*12),(bp-0x146,bp-0x176+wheel*12),(bp-0xe6,row['scaledRoadSpeed']),(0x8f9a,0),(0x9694,row['wallLower']),(0x9798,row['wallUpper']),(0xa702,row['distance']),(0x7a30,row['wall']['origin'][0]),(0x7a3c,row['wall']['origin'][1]),(0xaa9a,row['wall']['orientation']),(0x906a,row['carRotation'][0]),(0x9692,row['carRotation'][1]),(0x96a4,row['carRotation'][2]),(0x1036,row['wheelAngle']),(0x102c,row['roadSpeed'])]:word(at,value)
 m.mem_write(d+0x10cf,bytes([row['soundFlags']]));m.mem_write(d+bp-0xe8,bytes([wheel]));m.mem_write(d+0x1074+wheel*6,struct.pack('<3h',*row['previous']))
 m.mem_write(d+bp-0x1c0,struct.pack('<12i',*[n for point in row['proposed'] for n in point]));m.mem_write(d+bp-0x176,struct.pack('<12i',*[n for point in row['origins'] for n in point]))
 events.clear();stops.clear();registers(0);m.emu_start(0x79a4,0xf0000,count=200000);assert len(stops)==1
 expected=None
 if stops[0]==0x788c:
  values=struct.unpack('<12i',bytes(m.mem_read(d+bp-0x1c0,48)));expected=dict(proposed=[list(values[i*3:i*3+3]) for i in range(4)],wheelAngle=struct.unpack('<h',bytes(m.mem_read(d+0x1036,2)))[0],soundFlags=m.mem_read(d+0x10cf,1)[0],crashEvents=list(events))
 rows.append(dict(**row,physicsEngine='ms-1991',expected=expected))
assert a.image.read_bytes()==image and a.inputs.read_bytes()==inputs
with a.output.open('x') as f:json.dump(rows,f)
print('512 complete original MS91 wall responses captured; '+str(sum(x['expected'] is not None for x in rows))+' contacts; original-generated tables and no live writes')
