"""Run original RES/PRE fallback with real copy/append and virtual loaders."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0;captures=[]
for path,start,dispatch,retry,source_ds,res,pre in [(a.legacy,0x145c,0x2428,0x2a46,0x32090,0x3398,0x339d),(a.modern,0x155c,0x24b2,0x2c20,0x32a90,0x346c,0x3471)]:
 image=path.read_bytes();edition=[]
 def source_text(at):return image[source_ds+at:image.index(b'\0',source_ds+at)]
 extensions=[source_text(res),source_text(pre)]
 for name in [b'MISC',b'OPP1',b'LONGNAME']:
  for failures in [0,1,2]:
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[source_ds:source_ds+65536]);m.mem_write(0x6d000,name+b'\0');events=[];calls=[]
   def hook(uc,address,size,user):
    sp=uc.reg_read(UC_X86_REG_SP)
    if address==0x198d0+dispatch:
     kind,at=struct.unpack('<2H',uc.mem_read(0x60000+sp+4,4));n=len(calls)
     assert kind==(1 if n%2==0 else 7)
     text=bytearray()
     for i in range(100):
      value=uc.mem_read(0x60000+((at+i)&65535),1)[0]
      if value==0:break
      text.append(value)
     assert bytes(text)==name+extensions[n%2];calls.append(kind);events.append(['load',kind])
     uc.reg_write(UC_X86_REG_AX,0x1000 if n>=failures else 0);uc.reg_write(UC_X86_REG_DX,0x9000 if n>=failures else 0)
    elif address==0x198d0+retry:events.append(['retry']);uc.reg_write(UC_X86_REG_AX,2)
    else:return
    ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
   m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,0xd000))
   for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
   m.emu_start(0x198d0+start,0x1000,count=5000)
   assert len(calls)==failures+1 and m.reg_read(UC_X86_REG_AX)==0x1000 and m.reg_read(UC_X86_REG_DX)==0x9000 and m.reg_read(UC_X86_REG_SP)==0xf004
   assert bytes(m.mem_read(0x6d000,len(name)+1))==name+b'\0'
   edition.append({'name':name.decode(),'failures':failures,'events':events});cases+=1
 captures.append(edition);assert path.read_bytes()==image
assert captures[0]==captures[1]
print(json.dumps({'actualOriginalFallbackCases':cases,'bothEditionsMatch':True,'copyAndAppendExecutedUnmocked':True,'retryChoiceTwoIgnoredAsOriginal':True,'loaderAndPromptServicesDoubled':True,'pass':True}))
