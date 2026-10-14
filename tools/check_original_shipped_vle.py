"""Decode shipped type-2 first stages in both original executables."""
import argparse,hashlib,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--resources',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
records=[]
for resource in sorted(a.resources.iterdir()):
 if not resource.is_file() or resource.suffix.upper() not in ('.PRE','.PVS','.VSH'):continue
 packed=resource.read_bytes();skip=4 if packed and packed[0]&128 else 0;stage=packed[skip:]
 if len(stage)<5 or stage[0]!=2:continue
 size=int.from_bytes(stage[1:4],'little');assert 0<size<=0x70000 and len(stage)<0x10000
 hashes=[]
 for path,seg,entry in [(a.legacy,0x209e,0x41d2),(a.modern,0x20e5,0x4358)]:
  image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x70000,stage+bytes(16));m.mem_write(0x80000,bytes([0xa5])*(size+16))
  m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0,0x7000,0,0x8000))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=10000000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_IP)==0x1000,resource.name
  assert bytes(m.mem_read(0x80000+size,16))==bytes([0xa5])*16
  hashes.append(hashlib.sha256(bytes(m.mem_read(0x80000,size))).hexdigest())
  assert path.read_bytes()==image
 assert hashes[0]==hashes[1],resource.name;assert resource.read_bytes()==packed
 records.append({'name':resource.name,'stageOffset':skip,'size':size,'sha256':hashes[0]})
assert records
with a.output.open('x') as out:json.dump(records,out)
print(json.dumps({'shippedType2Stages':len(records),'originalExecutions':len(records)*2,'bothEditionsOutputsMatch':True,'sourceFilesUnchanged':True,'pass':True}))
