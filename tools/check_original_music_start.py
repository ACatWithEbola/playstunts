"""Original start routine envelope with reset/driver/timer adapters doubled."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
cases=0
for modern,path,seg,entry,reset,sequence,driver_field,lock,active,accumulator,interval,tracks,volume in [
 (False,a.legacy,0x2daf,0x9c,0x288,0xbfe,0x4ddc,0x4e0c,0x4e04,0x97b8,0x9f2a,0x8d3e,0xa3be),
 (True,a.modern,0x2e0e,0xb8,0x2a6,0xcf8,0x4eba,0x4eea,0x4ee2,0x9a50,0xa1c2,0x8f9c,0xa654)]:
 image=path.read_bytes()
 for count,valid in itertools.product([0,1,7,127,128,255],['ready','null','blocked','unloaded']):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  header=0x100;signed=count if modern or count<128 else count-256;track_at=(header+7+signed*4)&65535
  m.mem_write(0x80000+header,bytes([0,0,0,0,int(valid=='blocked'),int(valid!='unloaded'),count]));m.mem_write(0x80000+track_at,b'\x03')
  m.mem_write(0x60000+driver_field,struct.pack('<2H',0x100,0x7000));m.mem_write(0x60000+volume,b'\x7f');events=[]
  def hook(uc,address,size,user):
   if address not in [seg*16+reset,seg*16+sequence,0x70118]:return
   sp=uc.reg_read(UC_X86_REG_SP);stack=0x60000+sp
   if address==seg*16+sequence:
    args=list(struct.unpack('<7H',uc.mem_read(stack+4,14)));expected=[0,2,header,0x8000,(8+signed*4)&65535,127,32]
    assert args==expected,(modern,count,args,expected);events.append('sequence')
   else:events.append('reset' if address==seg*16+reset else 'driver')
   ip,cs=struct.unpack('<2H',uc.mem_read(stack,4));uc.reg_write(UC_X86_REG_SP,(sp+4)&65535);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,0 if valid=='null' else header,0 if valid=='null' else 0x8000))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+entry,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_CS)==0 and m.reg_read(UC_X86_REG_IP)==0x1000
  assert events==(['reset','driver','sequence'] if valid=='ready' else ['reset'])
  assert struct.unpack('<H',m.mem_read(0x60000+lock,2))[0]==(0 if valid=='ready' else 1)
  if valid=='ready':
   assert m.mem_read(0x60000+active,1)==b'\x01' and m.mem_read(0x60000+tracks,1)==b'\x03'
   assert struct.unpack('<H',m.mem_read(0x60000+accumulator,2))[0]==0
   assert struct.unpack('<H',m.mem_read(0x60000+interval,2))[0]==128
  cases+=1
 assert path.read_bytes()==image
print(json.dumps({'originalStartCases':cases,'guardsStateAndSequenceArgumentsVerified':True,'signedUnsignedCountBoundaryVerified':True,'resetDriverAndSequenceServicesExplicitlyDoubled':True,'noAudioOrLiveData':True,'pass':True}))
