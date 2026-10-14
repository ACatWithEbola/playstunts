"""Original file-size paragraph query with simulated DOS open/seek/close."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE,UC_HOOK_INTR
from unicorn.x86_const import *
cases=0
for path,seg,entry,fatal in [(a.legacy,0x209e,0x145c,0xe),(a.modern,0x20e5,0x145e,6)]:
 image=path.read_bytes()
 for length,required,found in itertools.product([0,1,15,16,17,65535,1048575,1048576],[0,1],[False,True]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);events=[];fatal_seen=[]
  def carry(uc,value):uc.reg_write(UC_X86_REG_EFLAGS,(uc.reg_read(UC_X86_REG_EFLAGS)&~1)|int(value))
  def interrupt(uc,number,user):
   assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8
   if ah==0x3d:events.append('open');uc.reg_write(UC_X86_REG_AX,3 if found else 2);carry(uc,not found)
   elif ah==0x42:
    assert uc.reg_read(UC_X86_REG_BX)==3
    end=(ax&255)==2;assert end or (ax&255)==0
    events.append('seek-end' if end else 'rewind');value=length if end else 0
    uc.reg_write(UC_X86_REG_AX,value&65535);uc.reg_write(UC_X86_REG_DX,value>>16);carry(uc,False)
   elif ah==0x3e:assert uc.reg_read(UC_X86_REG_BX)==3;events.append('close');uc.reg_write(UC_X86_REG_AX,0);carry(uc,False)
   else:raise AssertionError(hex(ax))
  def hook(uc,address,size,user):
   if address==seg*16+fatal:fatal_seen.append(True);uc.emu_stop()
  m.hook_add(UC_HOOK_INTR,interrupt);m.hook_add(UC_HOOK_CODE,hook)
  m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,0x2000,required))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0xaaaa),(UC_X86_REG_DI,0xbbbb)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=1000)
  assert bool(fatal_seen)==(required and not found)
  assert events==(['open','seek-end','rewind','close'] if found else ['open'])
  if not fatal_seen:
   assert m.reg_read(UC_X86_REG_AX)==((((length+15)//16)&65535) if found else 0)
   assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_DS)==0x6000 and m.reg_read(UC_X86_REG_SI)==0xaaaa and m.reg_read(UC_X86_REG_DI)==0xbbbb
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'actualParagraphQueryCases':cases,'bothVersionsSizeCeilingAndWordWrapMatch':True,'missingOptionalAndRequiredPaths':True,'DOSFileServicesSimulated':True,'sourceBinariesUnchanged':True,'pass':True}))
