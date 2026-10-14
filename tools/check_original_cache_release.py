"""Execute both original cache-release routines in isolated memory only."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for path,seg,entry,firstfield,fatal in [(a.legacy,0x209e,0x2a14,0x4b12,0xe),(a.modern,0x20e5,0x2a58,0x4bc0,6)]:
 image=path.read_bytes()
 for kind in ['last','interior','no-gap','cache-edge','missing','zero-pages']:
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  def put(off,value):m.mem_write(0x60000+off,struct.pack('<H',value))
  def word(off):return struct.unpack('<H',m.mem_read(0x60000+off,2))[0]
  first,last,cache=0x1000,0x1036,0x1100
  put(firstfield,first);put(firstfield+2,last);put(firstfield+4,cache)
  for n in range(4):
   at=first+18*n;m.mem_write(0x60000+at,b'RESOURCE'+bytes([65+n])*4)
   put(at+12,2);put(at+14,0x3000+0x100*n);put(at+16,1)
  put(cache+14,0x5000);put(cache+12,0);put(cache+16,1)
  descriptor=last if kind=='last' else first+18
  if kind=='cache-edge':cache=descriptor;put(firstfield+4,cache)
  if kind=='no-gap':put(cache+14,word(last+14)+word(last+12))
  if kind=='zero-pages':put(descriptor+12,0)
  source=word(descriptor+14);pages=word(descriptor+12)
  payload=bytes((n*17+3)&255 for n in range(pages*16))
  if payload:m.mem_write(source*16,payload)
  requested=0x7777 if kind=='missing' else source
  m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,0x1234,requested))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0xaaaa),(UC_X86_REG_DI,0xbbbb)]:m.reg_write(reg,value)
  fatal_seen=[]
  def hook(uc,address,size,user):
   if address==seg*16+fatal:fatal_seen.append(True);uc.emu_stop()
  m.hook_add(UC_HOOK_CODE,hook)
  m.emu_start(seg*16+entry,0x1000,count=10000)
  if kind=='missing':assert fatal_seen
  else:
   assert not fatal_seen and m.reg_read(UC_X86_REG_AX)==0x1234
   assert m.reg_read(UC_X86_REG_SP)==0xf004
   assert m.reg_read(UC_X86_REG_SI)==0xaaaa and m.reg_read(UC_X86_REG_DI)==0xbbbb
   assert word(descriptor+16)==0
   copied=kind not in ['no-gap','cache-edge']
   result=m.reg_read(UC_X86_REG_DX)
   assert result==(0x5000-pages if copied else 0)
   if copied:
    assert word(firstfield+4)==cache-18 and word(cache-18+16)==1
    assert bytes(m.mem_read(result*16,pages*16))==payload
   else:assert word(firstfield+4)==cache
   assert word(firstfield+2)==(last-18 if kind=='last' else last)
   if payload:assert bytes(m.mem_read(source*16,len(payload)))==payload
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalExecutionCases':cases,'bothVersions':True,'cacheCopyAndNoSpacePaths':True,'missingStopsBeforeFatalUi':True,'sourceBinariesUnchanged':True,'pass':True}))
