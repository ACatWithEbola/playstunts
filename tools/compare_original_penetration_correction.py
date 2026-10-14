"""Original post-distance penetration correction, isolated matrices/points only."""
import argparse,sys,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[]
matrices=[[16384,0,0,0,16384,0,0,0,16384],[0,16384,0,-16384,0,0,0,0,16384],[16384,0,0,0,0,16384,0,-16384,0]]
for distance in [-32768,-513,-512,-25,-24,-13,-12,-1,0,1]:
 for flag in [0,1]:
  for matrix in matrices:
   results=[];point=[2147483000,-100000,100000]
   for path,start,end,flag_at,pointer,plane,bank,stored in [(a.legacy,0x836b,0x83eb,-0x134,-0xdc,0x9834,0x9f32,0xa46c),(a.modern,0x8371,0x83e9,-0x136,-0xde,0x9ace,0xa1ca,0xa702)]:
    image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,bytes(65536));m.mem_write(0x70000,bytes(65536))
    # Original passes near stack-vector pointers to its DS-based transform.
    # SS must equal DS, as in the actual game, rather than an isolated stack.
    m.mem_write(0x61000,struct.pack('<3i',*point));m.mem_write(0x68000+pointer,struct.pack('<H',0x1000));m.mem_write(0x68000+flag_at,bytes([flag]));m.mem_write(0x60000+plane,bytes(2));m.mem_write(0x60000+bank,struct.pack('<HH',0x100,0x8000));m.mem_write(0x80110,struct.pack('<9h',*matrix))
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0x8000),(UC_X86_REG_AX,distance&65535)]:m.reg_write(reg,value)
    m.emu_start(start,end,count=2000)
    assert m.reg_read(UC_X86_REG_IP)==end
    results.append(dict(point=list(struct.unpack('<3i',bytes(m.mem_read(0x61000,12)))),distance=struct.unpack('<h',bytes(m.mem_read(0x60000+stored,2)))[0]))
   assert results[0]==results[1]
   rows.append(dict(distance=distance,flag=flag,matrix=matrix,point=point,result=results[1]))
with a.output.open('x') as f:json.dump(rows,f)
print('60 original paired penetration corrections captured across signed boundaries and three matrix orientations; source images read-only')
