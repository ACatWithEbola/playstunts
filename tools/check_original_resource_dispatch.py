"""Execute resource dispatch routes with isolated loader/retry service doubles."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0;captures=[]
loaders=[[(0x209e,0x2362),(0x209e,0x23d1),(0x30f2,0x20),(0x315d,0x22),(0x2daf,0xb5e),(0x2daf,0xb86),(0x2daf,0xb06),(0x3059,0xa)],[(0x20e5,0x2364),(0x20e5,0x23d3),(0x3192,0x1e),(0x31fd,0x20),(0x2e0e,0xbf6),(0x2e0e,0xc40),(0x2e0e,0xb80),(0x30e3,0)]]
for index,(path,start,retry) in enumerate([(a.legacy,0x2428,0x2a46),(a.modern,0x24b2,0x2c20)]):
 image=path.read_bytes();edition=[]
 for kind in range(9):
  for success in [False,True]:
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x62000,b'TEST.RES\0');events=[]
   def hook(uc,address,size,user):
    sp=uc.reg_read(UC_X86_REG_SP);loader=next((n for n,(seg,at) in enumerate(loaders[index]) if address==seg*16+at),None)
    if loader is not None:
     assert struct.unpack('<H',uc.mem_read(0x60000+sp+4,2))[0]==0x2000
     events.append(['loader',loader]);uc.reg_write(UC_X86_REG_AX,0x1000 if success else 0);uc.reg_write(UC_X86_REG_DX,0x9000 if success else 0)
    elif address==0x198d0+retry:events.append(['retry']);uc.reg_write(UC_X86_REG_AX,2)
    elif index and address==0x198d0+0x12ac:
     assert struct.unpack('<3H',uc.mem_read(0x60000+sp+4,6))==(0x3428,0x2000,1)
     # Diagnostic filename service is separately verified by filename captures.
     uc.reg_write(UC_X86_REG_AX,0)
    else:return
    ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
   m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,kind,0x2000))
   for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
   m.emu_start(0x198d0+start,0x1000,count=1000)
   assert m.reg_read(UC_X86_REG_SP)==0xf004 and len([e for e in events if e[0]=='loader'])==1
   assert (m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX))==((0x1000,0x9000) if success else (0,0))
   edition.append({'kind':kind,'success':success,'events':events});cases+=1
 captures.append(edition);assert path.read_bytes()==image
assert captures[0]==captures[1]
if a.output:
 with a.output.open('x') as out:json.dump(captures[0],out)
print(json.dumps({'actualDispatcherCases':cases,'allNineRoutesBothEditions':True,'successAndCancellationMatch':True,'loadersRetryAndDiagnosticServicesExplicitlyDoubled':True,'pass':True}))
