"""Execute every shipped compression stage, feeding original output onward."""
import argparse,hashlib,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--resources',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
records=[];executions=0
for resource in sorted(a.resources.iterdir()):
 if not resource.is_file() or resource.suffix.upper() not in ('.PRE','.PVS','.VSH'):continue
 packed=resource.read_bytes();passes=packed[0]&127 if packed[0]&128 else 1;all_editions=[]
 for path,seg,vle,rle in [(a.legacy,0x209e,0x41d2,0x213c),(a.modern,0x20e5,0x4358,0x213e)]:
  image=path.read_bytes();stage=packed[4:] if packed[0]&128 else packed;stages=[]
  for pass_index in range(passes):
   kind=stage[0];assert kind in [1,2];size=int.from_bytes(stage[1:4],'little');assert 0<size<=0x70000 and len(stage)<0x10000
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x70000,stage+bytes(16));m.mem_write(0x80000,bytes([0xa5])*(size+64))
   m.mem_write(0x6f000,struct.pack('<7H',0x1000,0,0,0x7000,0,0x8000,(size+15)//16+4))
   for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
   m.emu_start(seg*16+(vle if kind==2 else rle),0x1000,count=10000000)
   assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_IP)==0x1000,(resource.name,pass_index)
   stage=bytes(m.mem_read(0x80000,size));stages.append({'type':kind,'size':size,'sha256':hashlib.sha256(stage).hexdigest()});executions+=1
  all_editions.append(stages);assert path.read_bytes()==image
 assert all_editions[0]==all_editions[1],resource.name;assert resource.read_bytes()==packed
 records.append({'name':resource.name,'stages':all_editions[0]})
with a.output.open('x') as out:json.dump(records,out)
print(json.dumps({'shippedResources':len(records),'originalStageExecutions':executions,'bothEditionsAllStageOutputsMatch':True,'sourceFilesUnchanged':True,'pass':True}))
