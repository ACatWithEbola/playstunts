"""Original resize paths with fatal UI intercepted, all allocator code real."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for path,seg,entry,firstfield,highest,fatal in [(a.legacy,0x209e,0x2c3a,0x4b12,0x4788,0xe),(a.modern,0x20e5,0x2c7e,0x4bc0,0x4836,6)]:
 image=path.read_bytes()
 for pages,kind in itertools.product([0,1,4,5,16],['last','interior','missing','space']):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  def put(at,value):m.mem_write(0x60000+at,struct.pack('<H',value))
  def word(at):return struct.unpack('<H',m.mem_read(0x60000+at,2))[0]
  for at,value in [(firstfield,0x1000),(firstfield+2,0x1036),(firstfield+4,0x1100),(firstfield+6,0x1100),(highest,0x3304)]:put(at,value)
  for n in range(4):put(0x1000+n*18+12,4);put(0x1000+n*18+14,0x3000+n*0x100);put(0x1000+n*18+16,1)
  descriptor=0x1012 if kind=='interior' else 0x1036;source=word(descriptor+14)
  put(0x110e,source+4 if kind=='space' else 0x5000)
  fatal_seen=[]
  def hook(uc,address,size,user):
   if address==seg*16+fatal:fatal_seen.append(True);uc.emu_stop()
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,0,0x7777 if kind=='missing' else source,pages))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0xaaaa),(UC_X86_REG_DI,0xbbbb)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=1000)
  fails=kind=='missing' or kind in ('interior','space') and pages>4
  assert bool(fatal_seen)==fails
  assert word(descriptor+12)==(4 if kind=='missing' or kind=='interior' and pages>4 else pages)
  if not fails:assert m.reg_read(UC_X86_REG_AX)==(pages if pages<=4 else 0) and m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_SI)==0xaaaa and m.reg_read(UC_X86_REG_DI)==0xbbbb
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'actualOriginalResizeCases':cases,'bothEditions':True,'shrinkExpandAndErrorPathsMatch':True,'fatalUiIntercepted':True,'pass':True}))
