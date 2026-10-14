"""Silent original MCGA circle execution in isolated memory; no file writes."""
import argparse,hashlib,json,struct,sys
from pathlib import Path
from unpack_executables import assemble,unpack_exe
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
rows=[];banks=[]
cases=[(100,100,n)for n in [0,1,2,3,8,16,32,64,80,128]]+[(x,y,32)for x,y in [(-10,100),(0,0),(319,199),(330,100),(100,-10),(100,210)]]
for engine,root,d,c,block,table in [('ms-1990',a.legacy,0x2d1a0,0x209e0,0x5d96,0x3bc8),('ms-1991',a.modern,0x2dba0,0x20e50,0x5f1e,0x3c76)]:
 files={path:path.read_bytes()for path in root.iterdir()if path.suffix.upper()in ['.CMN','.COD','.DIF','.HDR']}
 image=unpack_exe(assemble(root,'MCGA'));start=image.find(bytes.fromhex('8b560a8bc2d1e8d1e82bd0'))-9;assert start>0
 bank=bytearray(image[d+table:d+table+0x450]);banks.append(bank)
 for x,y,diameter in cases:
  u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image);u.mem_write(0x80000,bytes(65536))
  u.mem_write(c+block,struct.pack('<H',0x8000));u.mem_write(c+block+8,struct.pack('<6H',0xd000,0,320,0,200,320));u.mem_write(c+block+24,struct.pack('<2H',0,320))
  for row in range(200):u.mem_write(c+0xd000+row*2,struct.pack('<H',row*320))
  for reg,value in [(UC_X86_REG_CS,c//16),(UC_X86_REG_DS,d//16),(UC_X86_REG_ES,d//16),(UC_X86_REG_SS,d//16),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:u.reg_write(reg,value)
  u.mem_write(d+0xf000,struct.pack('<6H',0,0xf000,x&65535,y&65535,diameter,7));u.emu_start(start,0xf0000,count=1000000);assert u.reg_read(UC_X86_REG_CS)==0xf000
  rows.append({'engine':engine,'x':x,'y':y,'diameter':diameter,'sha256':hashlib.sha256(bytes(u.mem_read(0x80000,64000))).hexdigest()})
 assert all(path.read_bytes()==before for path,before in files.items())
# The radius bank is the same after explicit pointer relocation; no blanket
# assumption that newly supplied drawing tables are unchanged.
for index in range(40):
 at=2+index*2;pointer=struct.unpack_from('<H',banks[1],at)[0];struct.pack_into('<H',banks[1],at,(pointer-0xae)&65535)
assert banks[0]==banks[1]
print(json.dumps({'rows':rows,'legacyCircleBank':list(banks[0]),'originalCases':len(rows),'sourceUnchanged':True}))
