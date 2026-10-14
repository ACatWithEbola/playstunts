"""Full aligned car/tree overlap in both originals, with initialized identity cache."""
import argparse,json,struct,sys,random
from pathlib import Path
from extract import resources
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('target',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--angled',action='store_true');p.add_argument('--cars',type=Path)
p.add_argument('--paired',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_AX
machines=[]
for path,data,start,yhelper,ycs,identity in [(a.legacy,0x32090,0xae4a,0x2d9a0,0x2d94,0x635a),(a.target,0x32a90,0xb50e,0x2df9c,0x2df4,0x6554)]:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 machines.append((m,image[data:data+65536],start,yhelper,ycs,identity))
rows=[]
cases=[(h,x,z,[0,0,0]) for h in range(-20,61) for x in [-31,-30,-1,0,1,30,31] for z in [-61,-60,0,60,61]]
if a.angled:cases=[(h,x,z,[roll,pitch,yaw]) for h in [0,31] for x in [-1,0,1] for z in [-1,0,1] for yaw in range(0,1024,128) for pitch in [-16,0,16] for roll in [-16,0,16]]
cars=[('PMIN',(19,17,56,62))]
if a.cars:
 cars=[(path.stem[3:],struct.unpack_from('<4h',resources(path.read_bytes())['simd'],200)) for path in sorted(a.cars.glob('CAR*.RES'))]
 assert len(cars)==11,'All eleven original car resources are required'
cases=[(name,dimensions,height,x,z,angles) for name,dimensions in cars for height,x,z,angles in cases]
if a.paired:
 rng=random.Random(19910225)
 cases=[(*cars[i%len(cars)],rng.randrange(-120,121),rng.randrange(-160,161),rng.randrange(-160,161),[rng.randrange(-64,65),rng.randrange(-64,65),rng.randrange(1024)]) for i in range(1000)]
for case_index,(name,dimensions,height,x,z,angles) in enumerate(cases):
   target_dimensions=cars[(case_index*7+3)%len(cars)][1] if a.paired else (1,10,1,10)
   target_angles=[(case_index*17)%129-64,(case_index*31)%129-64,(case_index*137)%1024] if a.paired else [0,0,0]
   results=[]
   for m,data,start,yhelper,ycs,identity in machines:
    m.mem_write(0x60000,data)
    def regs(cs):
     for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,identity,0));regs(ycs);m.emu_start(yhelper,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
    assert struct.unpack('<9h',bytes(m.mem_read(0x60000+identity,18)))==(16384,0,0,0,16384,0,0,0,16384)
    if a.angled or a.paired:
     caches=[(0x59ba,256),(0x59a8,512),(0x59d4,768)] if start==0xae4a else [(0x5bb4,256),(0x5ba2,512),(0x5bce,768)]
     for pointer,angle in caches:
      m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,pointer,angle));regs(ycs);m.emu_start(yhelper,0x1000,count=10000)
    # Original PMIN SIMD words200..206: width,height,length,radius.
    m.mem_write(0x61000,struct.pack('<4h',*dimensions));m.mem_write(0x61100,struct.pack('<6h',x,height,z,*angles))
    m.mem_write(0x61200,struct.pack('<4h',*target_dimensions));m.mem_write(0x61300,struct.pack('<6h',0,0,0,*target_angles))
    m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0x1000,0x1100,0x1200,0x1300));regs(0);m.emu_start(start,0x1000,count=100000);assert m.reg_read(UC_X86_REG_SP)==0xf004
    results.append(bool(m.reg_read(UC_X86_REG_AX)))
   assert results[0]==results[1],(height,x,z,results)
   if not a.angled and not a.paired and name=='PMIN' and height==31:assert not results[0]
   if not a.angled and not a.paired and height==0 and x==0 and z==0:assert results[0]
   rows.append(dict(car=name,dimensions=list(dimensions[:3]),radius=dimensions[3],height=height,x=x,z=z,angles=angles,targetDimensions=list(target_dimensions[:3]),targetRadius=target_dimensions[3],targetAngles=target_angles,hit=results[0]))
with a.output.open('x') as f:json.dump(rows,f)
print(str(len(rows))+' full original MS90/MS91 '+('paired-car' if a.paired else 'angled' if a.angled else 'aligned')+' overlap cases match')
