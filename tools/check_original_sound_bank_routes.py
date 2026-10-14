"""Original sound-kind wrappers; filename loader and fatal UI explicitly doubled."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
rows=[]
for modern,path,seg,ds,loader,fatal,entries,gate in [(False,a.legacy,0x2daf,0x3209,0x9e2,0x209e0+0xe,{4:0xb5e,5:0xb86,6:0xb06},0x4e07),(True,a.modern,0x2e0e,0x32a9,0xa50,0x20e50+6,{4:0xbf6,5:0xc40,6:0xb80},0x4ee5)]:
 image=path.read_bytes()
 for kind,enabled,required,success in itertools.product([4,5,6],[0,1],[0,1],[0,1,2]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(ds*16+gate,bytes([enabled]));events=[];failed=[False]
  if modern:m.mem_write(ds*16+0x4eec,struct.pack('<H',required))
  def text(at):
   out=bytearray()
   for i in range(65536):
    byte=m.mem_read(ds*16+((at+i)&65535),1)[0]
    if not byte:return out.decode('latin1')
    out.append(byte)
   raise AssertionError('unterminated name')
  def hook(uc,address,size,user):
   if address==fatal:failed[0]=True;uc.emu_stop();return
   if address!=seg*16+loader:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=ds*16+sp;name,extension,prefix=struct.unpack('<3H',uc.mem_read(stack+4,6));events.append((text(extension),text(prefix)))
   found=success==len(events);uc.reg_write(UC_X86_REG_AX,0x123 if found else 0);uc.reg_write(UC_X86_REG_DX,0x8000 if found else 0)
   ip,cs=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(ds*16+0xf000,struct.pack('<3H',0x1000,0,0xe800))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,ds),(UC_X86_REG_SS,ds),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entries[kind],0x1000,count=10000)
  maximum=2 if kind!=4 and enabled else 1;found=1<=success<=maximum
  assert len(events)==(success if found else maximum)
  assert failed[0]==bool(modern and required and not found)
  if not failed[0]:assert (m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX))==((0x123,0x8000) if found else (0,0))
  rows.append({'modern':modern,'kind':kind,'enabled':enabled,'required':required,'success':success,'events':events})
 assert path.read_bytes()==image
half=len(rows)//2
for old,new in zip(rows[:half],rows[half:]):assert old['events']==new['events']
print(json.dumps({'originalSoundRouteCases':len(rows),'fallbackRequestsMatchBothEditions':True,'modernRequiredMissingFatalGuardVerified':True,'loaderAndFatalPresentationExplicitlyDoubled':True,'noAudioOrLiveData':True,'pass':True}))
