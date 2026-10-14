"""Original ordered score save, real filename helpers, in-memory DOS-write double."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
source=bytes((n*37+19)&255 for n in range(364));cases=0
for index,(path,start,base) in enumerate([(a.legacy,0x436c,0x32090),(a.modern,0x4380,0x32a90)]):
 image=path.read_bytes()
 for reverse in [False,True]:
  for shift in range(7):
   order=[(n+shift)%7 for n in range(7)]
   if reverse:order.reverse()
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[base:base+65536])
   pointer=0x9758 if index==0 else 0x99f2;mapping=0xabdc if index==0 else 0xae74;flag=0x135 if index==0 else 0x193
   m.mem_write(0x60000+pointer,struct.pack('<2H',0,0x9000));m.mem_write(0x60000+mapping,struct.pack('<7H',*order));m.mem_write(0x90000,source)
   m.mem_write(0x60000+(0x98 if index==0 else 0xa4),b'C:\\SAVES\0');m.mem_write(0x60000+(0x942b if index==0 else 0x96bd),b'TEST\0')
   m.mem_write(0x6f000,struct.pack('<2H',0x1000,0));writes=[]
   def hook(machine,address,size,user):
    target=(0x209e0+0x3961) if index==0 else (0x20e50+0x3ae7)
    if address!=target:return
    sp=machine.reg_read(UC_X86_REG_SP);name,offset,segment,low,high=struct.unpack('<5H',machine.mem_read(0x60000+sp+4,10))
    assert (low,high)==(364,0);assert machine.mem_read(0x60000+flag,1)[0]==1
    filename=bytes(machine.mem_read(0x60000+name,80)).split(b'\0')[0];assert filename==b'C:\\SAVES\\TEST.hig',filename
    writes.append(bytes(machine.mem_read(segment*16+offset,364)))
    ip,cs=struct.unpack('<2H',machine.mem_read(0x60000+sp,4));machine.reg_write(UC_X86_REG_AX,0);machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
   m.hook_add(UC_HOOK_CODE,hook)
   for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_BP,0xbeef),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
   m.emu_start(start,0x1000,count=30000)
   assert writes==[b''.join(source[n*52:(n+1)*52] for n in order)]
   assert bytes(m.mem_read(0x90000,364))==source and bytes(m.mem_read(0x60000+mapping,14))==struct.pack('<7H',*order)
   assert m.mem_read(0x60000+flag,1)[0]==0 and m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_BP)==0xbeef
   cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalScoreSaveCases':cases,'bothVersions':True,'ordered364BytesAndFilenameMatch':True,'recordsAndOrderUnchanged':True,'flagAndStackRestored':True,'allWritesInterceptedInMemory':True,'pass':True}))
