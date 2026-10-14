"""Execute original window release and nested discard; fatal UI intercepted."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for path,seg,entry,top,firstfield,fatal in [(a.legacy,0x209e,0x3900,0x9a40,0x4b12,0xe),(a.modern,0x20e5,0x3a86,0x9bc4,0x4bc0,6)]:
 image=path.read_bytes()
 for height,kind in itertools.product([0,1,255,65535],['valid','wrong-order','missing']):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  def put(at,value):m.mem_write(at,struct.pack('<H',value&65535))
  def word(at):return struct.unpack('<H',m.mem_read(at,2))[0]
  size=((height+15)*2)&65535;initial=(0x1000+size+int(kind=='wrong-order'))&65535
  put(seg*16+top,initial);m.mem_write(0x51000,struct.pack('<2H',0,0x3000));put(0x30002,height)
  put(0x60000+firstfield,0x1000);put(0x60000+firstfield+2,0x1012)
  put(0x61010,1);put(0x61022,1);put(0x61020,0x4000 if kind=='missing' else 0x3000)
  fatal_seen=[]
  def hook(uc,address,size,user):
   if address==seg*16+fatal:fatal_seen.append(True);uc.emu_stop()
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,0x1000,0x5000))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0xaaaa),(UC_X86_REG_DI,0xbbbb)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=1000)
  assert bool(fatal_seen)==(kind!='valid')
  assert word(seg*16+top)==(initial if kind=='wrong-order' else 0x1000)
  assert word(0x60000+firstfield+2)==(0x1000 if kind=='valid' else 0x1012)
  assert word(0x61022)==(0 if kind=='valid' else 1)
  if kind=='valid':assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_DS)==0x6000 and m.reg_read(UC_X86_REG_SI)==0xaaaa and m.reg_read(UC_X86_REG_DI)==0xbbbb
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalWindowReleaseCases':cases,'nestedDiscardExecuted':True,'fatalUiIntercepted':True,'pass':True}))
