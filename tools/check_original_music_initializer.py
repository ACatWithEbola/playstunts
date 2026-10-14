"""Execute both original initializer envelopes; lookup/setup services doubled.

Modern four-byte copy executes as original code. No hardware or file operations.
"""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
total=0
for modern,path,segment,entry,lookup,setup,relocate in [(False,a.legacy,0x2daf,2,0x30230+0x114,0xd0a,0x105e),(True,a.modern,0x2e0e,0xe,0x30af0+0x108,0xdfc,0x1190)]:
 image=path.read_bytes()
 for count,loaded,missing in itertools.product([0,1,7,127,128,255],[0,1],[0,1,2]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(0x80100,bytes([0,0,0,0,count]));m.mem_write(0x80200,bytes([0xa5]*5+[loaded]));events=[];lookups=[0]
  def hook(uc,address,size,user):
   if address not in [lookup,segment*16+setup,segment*16+relocate]:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=0x60000+sp
   if address==lookup:
    lookups[0]+=1;null=missing==lookups[0];uc.reg_write(UC_X86_REG_AX,0 if null else 0x100 if lookups[0]==1 else 0x200);uc.reg_write(UC_X86_REG_DX,0 if null else 0x8000)
   else:events.append('setup' if address==segment*16+setup else 'relocate')
   ip,cs=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,(sp+4)&65535);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<7H',0x1000,0,0x111,0x8000,0x222,0x9000,0x333))
  for reg,val in [(UC_X86_REG_CS,segment),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,val)
  m.emu_start(segment*16+entry,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
  pointer=(m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX))
  assert pointer==((0,0) if missing else (0x200,0x8000))
  assert events==([] if missing or loaded else ['setup','relocate'])
  if not missing and not loaded:
   expected=(0x101+(count if modern or count<128 else count-256)*8)&65535
   assert struct.unpack('<2H',m.mem_read(0x80200,4))==(expected,0x8000)
   assert m.mem_read(0x80205,1)==b'\x01'
  else:assert m.mem_read(0x80200,6)==bytes([0xa5]*5+[loaded])
  assert m.reg_read(UC_X86_REG_SP)==0xf004;total+=1
 assert path.read_bytes()==image
print(json.dumps({'originalInitializerCases':total,'bothEditionsMissingAndLoadedPathsVerified':True,'signedUnsignedBoundaryVerified':True,'modernPointerCopyExecuted':True,'lookupSetupAndRelocationExplicitlyDoubled':True,'noAudioFilesOrLiveData':True,'pass':True}))
