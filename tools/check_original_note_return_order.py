"""Original note callback-return tail; driver body explicitly doubled."""
import argparse,sys,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
needle=bytes.fromhex('ff5eee83c40e8b5e088b76068a44048887');cases=0
for path,ds in [(a.legacy,0x3209),(a.modern,0x32a9)]:
 image=path.read_bytes();hits=[i for i in range(len(image)) if image.startswith(needle,i)];assert len(hits)==1,(path,hits)
 entry=hits[0];last_note=struct.unpack_from('<H',image,entry+len(needle))[0]
 for owner in [0,16,23]:
  for note in [5,127,255]:
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);bp=0xf000;command=0x4000
   def word(offset,value):m.mem_write(ds*16+offset,struct.pack('<H',value))
   word(bp,0);word(bp+2,0x1000);word(bp+4,0);word(bp+6,command);word(bp+8,owner)
   word(bp-0x16,ds);word(bp-0x14,0);word(bp-6,3);word(bp-0x12,0x100);word(bp-0x10,0x9000)
   m.mem_write(ds*16+command+4,bytes([note]));m.mem_write(ds*16+last_note+owner,b'\x63');observed=[]
   def callback(uc,address,size,user):
    if address!=0x90100:return
    observed.append(bytes(uc.mem_read(ds*16+last_note+owner,1))[0]);sp=uc.reg_read(UC_X86_REG_SP)
    ip,cs=struct.unpack('<HH',uc.mem_read(ds*16+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
   m.hook_add(UC_HOOK_CODE,callback)
   cs=entry>>4;ip=entry&15
   for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_IP,ip),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,bp-0x24)]:m.reg_write(reg,value)
   m.emu_start(entry,0x1000,count=1000)
   assert observed==[99] and bytes(m.mem_read(ds*16+last_note+owner,1))==bytes([note]);assert m.reg_read(UC_X86_REG_AX)==3
   cases+=1
 assert image==path.read_bytes()
print(json.dumps(dict(cases=cases,originalCallbackThenLastNote=True,driverBodyDoubled=True,sourceImagesUnchanged=True)))
