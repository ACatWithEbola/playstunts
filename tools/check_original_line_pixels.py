"""Original MCGA line pixels in isolated memory; archived inputs read-only."""
import argparse,hashlib,json,math,random,struct,sys
from pathlib import Path
from unpack_executables import assemble,unpack_exe
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--polygons',action='store_true');p.add_argument('--pattern',choices=['transparent','two-colour']);p.add_argument('--wheels',action='store_true');a=p.parse_args();a.polygons|=bool(a.pattern);sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
r=random.Random(19910225);cases=[[0,0,319,199],[319,199,0,0],[100,100,100,100],[-10,100,330,100],[100,-10,100,210]]+[[r.randrange(-100,421),r.randrange(-100,301),r.randrange(-100,421),r.randrange(-100,301)]for _ in range(27)];rows=[]
if a.polygons:
 cases=[[[0,0],[319,0],[319,199],[0,199]],[[100,100],[100,100],[100,100]],[[319,0],[319,100],[319,199]],[[20,20],[100,20],[60,60],[100,100],[20,100]]]
 for index in range(28):
  n=3+index%6;cx=r.randrange(-100,421);cy=r.randrange(-100,301);rx=r.randrange(1,300);ry=r.randrange(1,200)
  cases.append([[round(cx+rx*math.cos(i*2*math.pi/n)),round(cy+ry*math.sin(i*2*math.pi/n))]for i in range(n)])
for engine,root,d,c,block,entry in [('ms-1990',a.legacy,0x2d1a0,0x209e0,0x5d96,0x13b8),('ms-1991',a.modern,0x2dba0,0x20e50,0x5f1e,0x13ba)]:
 files={path:path.read_bytes()for path in root.iterdir()if path.suffix.upper()in ['.CMN','.COD','.DIF','.HDR']};image=unpack_exe(assemble(root,'MCGA'))
 for index,coords in enumerate(cases):
  u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image);u.mem_write(0x80000,bytes(65536))
  u.mem_write(c+block,struct.pack('<H',0x8000));u.mem_write(c+block+8,struct.pack('<6H',0xd000,0,320,0,200,320));u.mem_write(c+block+24,struct.pack('<2H',0,320))
  for row in range(200):u.mem_write(c+0xd000+row*2,struct.pack('<H',row*320))
  for reg,value in [(UC_X86_REG_CS,c//16),(UC_X86_REG_DS,d//16),(UC_X86_REG_ES,d//16),(UC_X86_REG_SS,d//16),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
  if a.wheels:
   rng=random.Random(190+index);x=rng.randrange(-30,351);y=rng.randrange(-30,231);rx=rng.randrange(2,65);ry=rng.randrange(2,65)
   coords=[[x,y],[x+rng.randrange(-15,16),y+ry],[x+rx,y+rng.randrange(-15,16)],[x+rng.randrange(-20,21),y+rng.randrange(-20,21)]]
   u.mem_write(d+0xb000,struct.pack('<8h',*[n for point in coords for n in point]));u.mem_write(d+0xff00,struct.pack('<7H',0,0xf000,0xb000,0x2500,3,7,11))
   target=0x28ab2 if engine=='ms-1990'else 0x290aa;u.reg_write(UC_X86_REG_CS,target>>4)
  elif a.polygons:
   u.mem_write(d+0xb000,struct.pack('<'+'h'*len(coords)*2,*[n for point in coords for n in point]));u.mem_write(d+0xff00,struct.pack('<5H',0,0xf000,7,len(coords),0xb000));entry=0x2d4a if engine=='ms-1990'else 0x2d8e
   if a.pattern=='transparent':
    entry=0x3cdc if engine=='ms-1990'else 0x3e62;u.mem_write(d+0xff00,struct.pack('<6H',0,0xf000,0xaa55,7,len(coords),0xb000))
   elif a.pattern=='two-colour':
    entry=0x9b4 if engine=='ms-1990'else 0x9b6;u.mem_write(d+0xff00,struct.pack('<7H',0,0xf000,0xaa55,3,7,len(coords),0xb000))
  else:u.mem_write(d+0xff00,struct.pack('<7H',0,0xf000,*[n&65535 for n in coords],7))
  u.emu_start(target if a.wheels else c+entry,0xf0000,count=1000000);assert u.reg_read(UC_X86_REG_CS)==0xf000
  rows.append({'engine':engine,'points'if a.polygons or a.wheels else'coords':coords,'sha256':hashlib.sha256(bytes(u.mem_read(0x80000,64000))).hexdigest()})
 assert all(path.read_bytes()==before for path,before in files.items())
print(json.dumps({'rows':rows,'sourceUnchanged':True}))
