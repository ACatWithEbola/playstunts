"""Whole original filename fallback, with only raw/packed file loaders doubled."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
editions=[]
for modern,path,seg,entry,ds,raw,packed,extension,prefix in [(False,a.legacy,0x2daf,0x9e2,0x3209,0x209e0+0x2362,0x209e0+0x23d1,0x4e2c,0x78c0),(True,a.modern,0x2e0e,0xa50,0x32a9,0x20e50+0x2364,0x20e50+0x23d3,0x4f38,0x7abe)]:
 image=path.read_bytes();rows=[]
 for name,success in itertools.product(['SKIDVICT','C:\\GAME\\SKIDVICT','VICT.KMS','C:\\GAME\\VICT.KMS'],range(8)):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(ds*16+0xe800,name.encode()+b'\0');events=[]
  def text(at):
   out=bytearray()
   for i in range(65536):
    byte=m.mem_read(ds*16+((at+i)&65535),1)[0]
    if not byte:return out.decode('latin1')
    out.append(byte)
   raise AssertionError('unterminated filename')
  def hook(uc,address,size,user):
   if address not in [raw,packed]:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=ds*16+sp;at=struct.unpack('<H',uc.mem_read(stack+4,2))[0];events.append({'kind':'raw' if address==raw else 'packed','name':text(at)})
   found=success==len(events);uc.reg_write(UC_X86_REG_AX,0x123 if found else 0);uc.reg_write(UC_X86_REG_DX,0x8000 if found else 0)
   ip,cs=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(ds*16+0xf000,struct.pack('<5H',0x1000,0,0xe800,extension,prefix))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=100000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
  assert len(events)==(success if success else 7)
  assert (m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX))==((0x123,0x8000) if success else (0,0))
  rows.append({'name':name,'success':success,'events':events})
 editions.append(rows);assert path.read_bytes()==image
assert editions[0]==editions[1]
with a.output.open('x') as out:json.dump(editions[0],out)
print(json.dumps({'originalFallbackCases':sum(map(len,editions)),'actualFilenameBuildersExecuted':True,'bothEditionRequestsMatch':True,'rawPackedFileLoadersExplicitlyDoubled':True,'pass':True}))
